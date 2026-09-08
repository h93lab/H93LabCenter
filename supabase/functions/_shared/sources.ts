import { sha } from "./domain.ts";
import type { Row } from "./store.ts";
export const supportedSources = ["apple_app_store", "hacker_news", "github"];
export function sourceCoverage(key: string, requested: string) {
  return {
    requested_market_code: requested.toUpperCase(),
    observed_market_code:
      key === "apple_app_store"
        ? requested === "GLOBAL"
          ? "US"
          : requested.toUpperCase()
        : null,
    language: "und",
    language_basis: "not_detected",
    coverage_note:
      key === "apple_app_store"
        ? requested === "GLOBAL"
          ? "US storefront sample; not representative of the global market."
          : "Storefront sample; availability does not establish demand."
        : "Public source sample; geographic coverage and human language are unconfirmed.",
    platform: key === "apple_app_store" ? "ios" : "unknown",
  };
}
function covered(items: Row[], key: string, requested: string) {
  return items.map((item) => ({
    ...item,
    raw_payload: {
      ...item.raw_payload,
      provenance: sourceCoverage(key, requested),
    },
  }));
}
export function appleReviewEntries(feed: Row) {
  const raw = feed.feed?.entry;
  const entries = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return entries.filter(
    (x: Row) =>
      x["im:rating"] && x.id?.label && typeof x.content?.label === "string",
  );
}
async function json(url: string) {
  const hosts = [
    "itunes.apple.com",
    "hacker-news.firebaseio.com",
    "api.github.com",
    "algolia.net",
    "hn.algolia.com",
  ];
  const u = new URL(url);
  if (u.protocol !== "https:" || !hosts.includes(u.hostname))
    throw Error("SOURCE_URL_DENIED");
  const r = await fetch(u, {
    headers: { Accept: "application/json", "User-Agent": "H93LabCenter/1.0" },
    redirect: "error",
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok)
    throw Error(
      r.status === 429
        ? "RATE_LIMITED"
        : r.status === 403
          ? "SOURCE_RESTRICTED"
          : "SOURCE_HTTP_" + r.status,
    );
  const text = await r.text();
  if (text.length > 2000000) throw Error("SOURCE_TOO_LARGE");
  return JSON.parse(text);
}
export async function collectSource(
  key: string,
  query: string,
  market: string,
  limit = 12,
): Promise<Row[]> {
  if (key === "apple_app_store") {
    const data = await json(
      "https://itunes.apple.com/search?entity=software&country=" +
        encodeURIComponent(market === "GLOBAL" ? "us" : market.toLowerCase()) +
        "&limit=" +
        Math.min(limit, 30) +
        "&term=" +
        encodeURIComponent(query),
    );
    const listings = data.results.map((x: Row) => ({
      external_id: String(x.trackId),
      title: x.trackName,
      canonical_url: x.trackViewUrl,
      raw_text: [
        x.trackName,
        x.description,
        "Price: " + x.formattedPrice,
        "Rating: " + x.averageUserRating,
        "Review count: " + x.userRatingCount,
      ]
        .join("\n")
        .slice(0, 10000),
      raw_payload: {
        trackId: x.trackId,
        price: x.price,
        currency: x.currency,
        rating: x.averageUserRating,
        reviewCount: x.userRatingCount,
        version: x.version,
        developer: x.sellerName,
        languages: x.languageCodesISO2,
        releaseDate: x.releaseDate,
      },
      published_at: x.currentVersionReleaseDate,
      source_type: "official_store",
    }));
    const reviews: Row[] = [];
    await Promise.all(
      listings.slice(0, 3).map(async (app: Row) => {
        try {
          const feed = await json(
            "https://itunes.apple.com/" +
              (market === "GLOBAL" ? "us" : market.toLowerCase()) +
              "/rss/customerreviews/page=1/id=" +
              encodeURIComponent(app.external_id) +
              "/sortby=mostrecent/json",
          );
          const entries = appleReviewEntries(feed);
          app.raw_payload.review_sample_status = entries.length
            ? "available"
            : "empty";
          for (const item of entries
            .filter((x: Row) => x["im:rating"])
            .slice(0, 6))
            reviews.push({
              external_id: "review:" + item.id.label,
              title: app.title + " — " + item.title.label,
              canonical_url: item.link?.attributes?.href || app.canonical_url,
              raw_text: item.content.label,
              raw_payload: {
                kind: "user_review",
                app_id: app.external_id,
                app_name: app.title,
                rating: Number(item["im:rating"].label),
                review_id: item.id.label,
              },
              published_at: item.updated?.label || null,
              source_type: "user_review",
            });
        } catch {
          app.raw_payload.review_sample_status = "unavailable";
        }
      }),
    );
    return covered([...listings, ...reviews], key, market);
  }
  if (key === "hacker_news") {
    const data = await json(
      "https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=" +
        limit +
        "&query=" +
        encodeURIComponent(query),
    );
    return covered(
      data.hits.map((x: Row) => ({
        external_id: x.objectID,
        title: x.title,
        canonical_url: "https://news.ycombinator.com/item?id=" + x.objectID,
        raw_text: [
          x.title,
          x.story_text || "",
          x.url || "",
          "Discussion points: " + x.points,
        ]
          .join("\n")
          .slice(0, 10000),
        raw_payload: {
          points: x.points,
          comments: x.num_comments,
          product_url: x.url,
        },
        published_at: x.created_at,
        source_type: "community",
      })),
      key,
      market,
    );
  }
  if (key === "github") {
    const data = await json(
      "https://api.github.com/search/repositories?sort=updated&per_page=" +
        limit +
        "&q=" +
        encodeURIComponent(query),
    );
    return covered(
      data.items.map((x: Row) => ({
        external_id: String(x.id),
        title: x.full_name,
        canonical_url: x.html_url,
        raw_text: [
          x.full_name,
          x.description || "",
          "Stars: " + x.stargazers_count,
          "Language: " + x.language,
        ].join("\n"),
        raw_payload: {
          stars: x.stargazers_count,
          language: x.language,
          license: x.license?.spdx_id,
        },
        published_at: x.updated_at,
        source_type: "official_api",
      })),
      key,
      market,
    );
  }
  throw Error("ADAPTER_UNAVAILABLE");
}
export async function evidenceDraft(
  item: Row,
  source: Row,
  run: string,
  marketId: string | null,
) {
  const provenance = item.raw_payload?.provenance;
  const observed = provenance?.observed_market_code || null;
  const requested = provenance?.requested_market_code || null;
  return {
    ...item,
    owner_id: source.owner_id,
    research_run_id: run,
    source_id: source.id,
    requested_market_id: marketId,
    market_id: observed && observed === requested ? marketId : null,
    observed_market_code: observed,
    normalized_text: item.raw_text,
    normalized_payload: item.raw_payload,
    content_hash: await sha(item.canonical_url + "\n" + item.raw_text),
    parser_version: "1.1",
    language: provenance?.language || "und",
  };
}
