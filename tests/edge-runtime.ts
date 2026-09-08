import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
process.loadEnvFile(".env.server");
const e = process.env;
if (e.SUPABASE_URL !== "http://127.0.0.1:55321")
  throw Error("ISOLATED_LOCAL_ONLY");
const c = createClient(e.SUPABASE_URL!, e.SUPABASE_PUBLISHABLE_KEY!, {
  auth: { persistSession: false },
});
const o = JSON.parse(readFileSync(".local/owner.json", "utf8"));
const a = await c.auth.signInWithPassword({
  email: o.email,
  password: o.password,
});
assert.ok(a.data.session, a.error?.message || "Owner session missing");
const base =
  process.env.EDGE_TEST_URL || "http://127.0.0.1:55325/functions/v1/center";
for (const p of ["/health", "/bootstrap"]) {
  const r: Response = await fetch(base + p, {
    headers: { Authorization: "Bearer " + a.data.session!.access_token },
  });
  const j = await r.json();
  console.log(p, r.status, j.ok);
  assert.equal(r.status, 200);
}
const no = await fetch(base + "/worker", { method: "POST" });
assert.equal(no.status, 401);
console.log("PASS Edge unauthorized worker rejected");
const wake = await fetch(base + "/worker", {
  method: "POST",
  headers: { Authorization: "Bearer " + e.WORKER_SECRET },
});
assert.equal(wake.status, 202);
console.log("PASS Edge background worker accepted");
const x = createClient(e.SUPABASE_URL!, e.SUPABASE_PUBLISHABLE_KEY!, {
  auth: { persistSession: false },
});
const signup = await x.auth.signUp({
  email: "disabled-signup@h93lab.local",
  password: crypto.randomUUID(),
});
assert.ok(signup.error);
assert.match(signup.error!.message, /disabled|not allowed/i);
console.log("PASS public signup disabled and existing owner login works");
