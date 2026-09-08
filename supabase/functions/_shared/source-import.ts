import { z } from "zod";
import { sha, stableId } from "./domain.ts";
import type { Store, Row } from "./store.ts";

const httpsUrl = z
  .string()
  .url()
  .max(2048)
  .refine((v) => {
    const u = new URL(v);
    return u.protocol === "https:" && !u.username && !u.password;
  }, "Use a public HTTPS source URL without credentials");
const reviewRowSchema = z
  .object({
    external_id: z.string().trim().min(1).max(200),
    text: z.string().trim().min(5).max(4000),
    published_at: z.iso.datetime(),
    url: httpsUrl,
    app_id: z.string().trim().min(1).max(200),
    title: z.string().max(300).optional(),
    rating: z.number().min(0).max(5).optional(),
  })
  .strict();
export const reviewImportSchema = z
  .object({
    format: z.enum(["csv", "json"]),
    content: z.string().min(1).max(500000),
    source_name: z.string().trim().min(2).max(120),
    source_url: httpsUrl,
    market: z.string().regex(/^[A-Z]{2}$/),
    platform: z.enum(["ios", "android", "web", "other"]),
    language: z.string().regex(/^(und|[a-z]{2,3}(-[A-Za-z0-9]{2,8})*)$/),
    sampled_at: z.iso.datetime(),
    confirmed_real_reviews: z.literal(true),
    dataset_kind: z.literal("real"),
    request_key: z.string().uuid().optional(),
  })
  .strict();

export function parseCsv(content: string): Row[] {
  const lines: string[][] = [];
  let line: string[] = [],
    value = "",
    quoted = false,
    afterQuote = false;
  const pushCell = () => {
    line.push(value);
    value = "";
    afterQuote = false;
  };
  const pushLine = () => {
    pushCell();
    if (line.some((v) => v.length)) lines.push(line);
    line = [];
  };
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (quoted) {
      if (c === '"' && content[i + 1] === '"') {
        value += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
        afterQuote = true;
      } else value += c;
    } else if (c === '"') {
      if (value || afterQuote) throw Error("INVALID_CSV_QUOTE");
      quoted = true;
    } else if (c === ",") pushCell();
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && content[i + 1] === "\n") i++;
      pushLine();
    } else {
      if (afterQuote && c.trim()) throw Error("INVALID_CSV_QUOTE");
      if (!afterQuote) value += c;
    }
    if (lines.length > 101) throw Error("IMPORT_LIMIT_100_REVIEWS");
  }
  if (quoted) throw Error("UNCLOSED_CSV_QUOTE");
  if (value || line.length) pushLine();
  const headers = (lines.shift() || []).map((h) =>
    h.trim().replace(/^\uFEFF/, ""),
  );
  if (
    new Set(headers).size !== headers.length ||
    !["external_id", "text", "published_at", "url", "app_id"].every((h) =>
      headers.includes(h),
    )
  )
    throw Error("INVALID_CSV_HEADERS");
  return lines.map((cells) => {
    if (cells.length !== headers.length) throw Error("INVALID_CSV_COLUMNS");
    const row = Object.fromEntries(headers.map((key, i) => [key, cells[i]]));
    if (row.rating === "") delete row.rating;
    return {
      ...row,
      ...(row.rating !== undefined ? { rating: Number(row.rating) } : {}),
    };
  });
}
export function parseReviewImport(raw: unknown, now = Date.now()) {
  const input = reviewImportSchema.parse(raw);
  if (Date.parse(input.sampled_at) > now + 300000)
    throw Error("FUTURE_SAMPLE_DATE");
  const parsed =
    input.format === "json"
      ? JSON.parse(input.content)
      : parseCsv(input.content);
  const rows = z.array(reviewRowSchema).min(1).max(100).parse(parsed);
  const unique = new Map<string, z.infer<typeof reviewRowSchema>>();
  for (const row of rows) {
    if (Date.parse(row.published_at) > Date.parse(input.sampled_at) + 300000)
      throw Error("REVIEW_AFTER_SAMPLE_DATE");
    const key = [row.app_id, row.external_id, row.text].join("\n");
    unique.set(key, row);
  }
  return {
    input,
    rows: [...unique.values()],
    duplicates_in_file: rows.length - unique.size,
  };
}
export function previewReviewImport(raw: unknown) {
  const { input, rows, duplicates_in_file } = parseReviewImport(raw);
  return {
    count: rows.length,
    duplicates_in_file,
    metadata: {
      source_name: input.source_name,
      source_url: input.source_url,
      market: input.market,
      platform: input.platform,
      language: input.language,
      sampled_at: input.sampled_at,
      verification_origin: "owner_import",
    },
    sample: rows.slice(0, 5).map((r) => ({ ...r, text: r.text.slice(0, 280) })),
    note: "Owner-provided review sample. Authenticity is attested by the owner, not independently verified. This import does not run AI or change scores.",
  };
}
export async function importReviews(s: Store, conceptId: string, raw: unknown) {
  await s.one("product_concepts", z.string().uuid().parse(conceptId));
  const { input, rows, duplicates_in_file } = parseReviewImport(raw);
  if (!input.request_key) throw Error("REQUEST_KEY_REQUIRED");
  const fingerprint = await sha(
    JSON.stringify({ ...input, request_key: undefined }),
  );
  const oldBatch = (
    await s.list("review_import_batches", { request_key: input.request_key }, 1)
  )[0];
  if (
    oldBatch &&
    (oldBatch.concept_id !== conceptId || oldBatch.content_hash !== fingerprint)
  )
    throw Error("REQUEST_KEY_CONFLICT");
  const marketQuery = await s.db
    .from("markets")
    .select("id")
    .eq("code", input.market)
    .single();
  if (marketQuery.error || !marketQuery.data) throw Error("UNKNOWN_MARKET");
  const marketId = marketQuery.data.id;
  const sourceKey =
    "owner_reviews_" +
    (
      await sha(input.source_url + ":" + input.platform + ":" + input.market)
    ).slice(0, 20);
  let source = (await s.list("research_sources", { key: sourceKey }, 1))[0];
  if (!source)
    source = await s.put("research_sources", {
      id: await stableId(s.owner + ":" + sourceKey),
      key: sourceKey,
      name: input.source_name,
      source_type: "user_review",
      enabled: false,
      is_paid: false,
      capabilities: {
        manual_import: true,
        reviews: true,
        platform: input.platform,
      },
      reliability_profile: {
        verification_origin: "owner_import",
        independent_verification: false,
      },
      config: { source_url: input.source_url, market: input.market },
    });
  const batchInput = {
    id: await stableId(s.owner + ":import-batch:" + input.request_key),
    concept_id: conceptId,
    request_key: input.request_key,
    source_id: source.id,
    content_hash: fingerprint,
    source_name: input.source_name,
    source_url: input.source_url,
    platform: input.platform,
    market_code: input.market,
    language: input.language,
    sampled_at: input.sampled_at,
    item_count: rows.length,
  };
  const claim = await s.db
    .from("review_import_batches")
    .upsert(
      { ...batchInput, owner_id: s.owner },
      { onConflict: "owner_id,request_key", ignoreDuplicates: true },
    );
  if (claim.error) throw claim.error;
  const batch = (
    await s.list("review_import_batches", { request_key: input.request_key }, 1)
  )[0];
  if (
    !batch ||
    batch.concept_id !== conceptId ||
    batch.content_hash !== fingerprint
  )
    throw Error("REQUEST_KEY_CONFLICT");
  const evidenceIds: string[] = [];
  let duplicates = duplicates_in_file;
  for (const row of rows) {
    const hash = await sha(
      [
        input.platform,
        input.market,
        row.app_id,
        row.external_id,
        row.text,
        row.published_at,
      ].join("\n"),
    );
    const evidenceId = await stableId(
      s.owner + ":import:" + source.id + ":" + hash,
    );
    const existing = (await s.list("evidence", { id: evidenceId }, 1))[0];
    if (existing) duplicates++;
    else {
      const payload = {
        kind: "user_review",
        app_id: row.app_id,
        rating: row.rating ?? null,
        review_id: row.external_id,
        provenance: {
          requested_market_code: input.market,
          observed_market_code: input.market,
          platform: input.platform,
          language: input.language,
          language_basis: "owner_reported",
          verification_origin: "owner_import",
          source_url: input.source_url,
          sampled_at: input.sampled_at,
          dataset_kind: "real",
          coverage_note:
            "Owner-provided review sample; source identity and authenticity are not independently verified. Not representative of all users.",
        },
      };
      // Insert immutable evidence; a changed review body produces a new identity.
      const { error } = await s.db
        .from("evidence")
        .upsert(
          {
            id: evidenceId,
            owner_id: s.owner,
            source_id: source.id,
            external_id: row.app_id + ":" + row.external_id,
            canonical_url: row.url,
            title: row.title || "Imported review · " + row.app_id,
            source_type: "user_review",
            market_id: marketId,
            requested_market_id: marketId,
            observed_market_code: input.market,
            language: input.language,
            published_at: row.published_at,
            raw_text: row.text,
            normalized_text: row.text,
            raw_payload: payload,
            normalized_payload: payload,
            content_hash: hash,
            parser_version: "owner-import-1.0",
            retention_metadata: {
              owner_confirmed_usage: true,
              verification_origin: "owner_import",
            },
          },
          { onConflict: "id", ignoreDuplicates: true },
        );
      if (error) throw error;
    }
    await s.put("review_items", {
      id: await stableId(evidenceId + ":review"),
      evidence_id: evidenceId,
      external_id: row.external_id,
      market_id: marketId,
      language: input.language,
      rating: row.rating ?? null,
      review_text: row.text,
      published_at: row.published_at,
      classification: { verification_origin: "owner_import" },
    });
    await s.put(
      "concept_evidence",
      {
        concept_id: conceptId,
        evidence_id: evidenceId,
        origin: "owner_import",
      },
      "concept_id,evidence_id",
    );
    evidenceIds.push(evidenceId);
  }
  return {
    batch,
    evidence_ids: evidenceIds,
    imported: rows.length - (duplicates - duplicates_in_file),
    duplicates,
    note: "Imported as owner-reported reviews. Refresh this concept to analyze the new evidence; existing scores and published blueprints are unchanged.",
  };
}
