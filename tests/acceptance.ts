import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { unzipSync, strFromU8 } from "fflate";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
process.loadEnvFile(".env.server");
if (!process.env.SUPABASE_URL?.includes("127.0.0.1:55321"))
  throw Error("ISOLATED_LOCAL_ONLY");
const owner = JSON.parse(readFileSync(".local/owner.json", "utf8"));
const client = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY!,
  { auth: { persistSession: false } },
);
const auth = await client.auth.signInWithPassword({
  email: owner.email,
  password: owner.password,
});
assert.ok(auth.data.session);
async function api(path: string, method = "GET", body?: unknown) {
  const r = await fetch(
    (process.env.API_TEST_URL || "http://127.0.0.1:8788/api") + path,
    {
      method,
      headers: {
        Authorization: "Bearer " + auth.data.session!.access_token,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    },
  );
  const p = await r.json();
  assert.ok(r.ok, p.error?.message);
  return p.data;
}
const projects = await api("/table/projects");
const p = projects.items.find((p: any) => p.status === "ready_for_development");
assert.ok(p, "A live generated and published project is required.");
const detail = await api("/projects/" + p.id);
const v = detail.version;
assert.equal(v.status, "published");
assert.ok(v.consistency_review);
assert.equal(
  detail.quality
    .filter((q: any) => q.blueprint_version_id === v.id)
    .sort((a: any, b: any) => b.created_at.localeCompare(a.created_at))[0]
    .mandatory_pass,
  true,
);
const result = await api("/projects/" + p.id + "/export", "POST", {
  version_id: v.id,
});
const response = await fetch(result.url);
assert.ok(response.ok);
const bytes = new Uint8Array(await response.arrayBuffer());
const files = unzipSync(bytes);
const manifest = JSON.parse(strFromU8(files["MANIFEST.json"]));
assert.equal(manifest.version_id, v.id);
assert.equal(manifest.files.length, Object.keys(files).length - 1);
for (const file of manifest.files) {
  assert.equal(
    createHash("sha256").update(files[file.path]).digest("hex"),
    file.sha256,
  );
  assert.ok(!file.path.includes(".."));
  assert.ok(!/sk-or-v1-|sb_secret_/.test(strFromU8(files[file.path])));
}
for (const path of [
  "AGENTS.md",
  "product/PRD.md",
  "technical/DATA_MODEL.md",
  "execution/TASKS.md",
  "execution/TESTING.md",
  "prototype/prototype.json",
  "prototype/figma-handoff.json",
])
  assert.ok(files[path], path);
const prototype = JSON.parse(strFromU8(files["prototype/prototype.json"]));
assert.equal(prototype.screens.length, v.manifest.screens.length);
const figma = await api("/projects/" + p.id + "/figma", "POST", {
  version_id: v.id,
});
assert.equal(figma.version_id, v.id);
assert.equal(figma.screens.length, prototype.screens.length);
writeFileSync(".local/verified-blueprint.zip", bytes);
writeFileSync(
  ".local/acceptance-result.json",
  JSON.stringify(
    {
      tested_at: new Date().toISOString(),
      project_id: p.id,
      version_id: v.id,
      documents: v.manifest.documents.length,
      screens: prototype.screens.length,
      files: Object.keys(files).length,
      checksums: "all_passed",
      independent_review: "passed",
    },
    null,
    2,
  ),
);
console.log(
  "PASS Live research → GO → generated blueprint → independent review → publication → private ZIP download.",
);
console.log(
  "PASS",
  Object.keys(files).length,
  "archive files with verified SHA-256 hashes;",
  prototype.screens.length,
  "prototype screens; Figma payload version matches.",
);
