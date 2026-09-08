import assert from "node:assert/strict";
import test from "node:test";
import { normalizeApiPath } from "../supabase/functions/_shared/api.ts";

test("normalizes local and hosted Edge Function paths", () => {
  assert.equal(normalizeApiPath("/api/health"), "/health");
  assert.equal(
    normalizeApiPath("/functions/v1/center/bootstrap"),
    "/bootstrap",
  );
  assert.equal(normalizeApiPath("/center/bootstrap"), "/bootstrap");
  assert.equal(normalizeApiPath("/health"), "/health");
  assert.equal(normalizeApiPath("/center"), "/");
});
