import { test } from "node:test";
import assert from "node:assert/strict";
import { collectSource } from "../supabase/functions/_shared/sources.ts";
test("Apple empty review feeds are labelled; observed review entries retain provenance", async () => {
  const original = globalThis.fetch;
  let hasReview = false;
  globalThis.fetch = async (input) => {
    const url = String(input);
    return Response.json(
      url.includes("/search?")
        ? {
            results: [
              {
                trackId: 123,
                trackName: "Fixture pantry",
                trackViewUrl: "https://apps.apple.com/app/id123",
                description: "Fixture listing",
                averageUserRating: 4.2,
                userRatingCount: 17,
              },
            ],
          }
        : {
            feed: {
              entry: hasReview
                ? [
                    {
                      id: { label: "review-9" },
                      title: { label: "Shared list" },
                      content: { label: "The shared list stopped syncing." },
                      "im:rating": { label: "2" },
                      updated: { label: "2026-09-01T10:00:00Z" },
                    },
                  ]
                : [],
            },
          },
    );
  };
  try {
    const empty = await collectSource("apple_app_store", "pantry", "US", 1);
    assert.equal(empty.length, 1);
    assert.equal(empty[0].raw_payload.review_sample_status, "empty");
    hasReview = true;
    const filled = await collectSource("apple_app_store", "pantry", "US", 1);
    assert.equal(filled.length, 2);
    assert.equal(filled[0].raw_payload.review_sample_status, "available");
    assert.equal(filled[1].source_type, "user_review");
    assert.equal(filled[1].raw_payload.app_id, "123");
    assert.equal(filled[1].raw_payload.rating, 2);
    assert.equal(filled[1].raw_text, "The shared list stopped syncing.");
  } finally {
    globalThis.fetch = original;
  }
});
