import { handle } from "../_shared/api.ts";
import type { Env } from "../_shared/store.ts";
const env = {
  SUPABASE_URL: Deno.env.get("SUPABASE_URL")!,
  PUBLIC_SUPABASE_URL: Deno.env.get("PUBLIC_SUPABASE_URL"),
  SUPABASE_SECRET_KEY:
    Deno.env.get("CENTER_SECRET_KEY") ||
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  SUPABASE_PUBLISHABLE_KEY:
    Deno.env.get("CENTER_PUBLISHABLE_KEY") ||
    Deno.env.get("SUPABASE_ANON_KEY")!,
  OPENROUTER_API_KEY: Deno.env.get("OPENROUTER_API_KEY"),
  APP_ORIGIN: Deno.env.get("APP_ORIGIN")!,
  WORKER_SECRET: Deno.env.get("WORKER_SECRET")!,
} as Env;
Deno.serve((req) => {
  const action = new URL(req.url).pathname.split("/").pop();
  if (
    ["worker", "dispatch"].includes(action || "") &&
    req.method === "POST" &&
    env.WORKER_SECRET &&
    req.headers.get("authorization") === "Bearer " + env.WORKER_SECRET
  ) {
    EdgeRuntime.waitUntil(handle(req, env));
    return new Response(
      JSON.stringify({ ok: true, data: { accepted: true } }),
      { status: 202, headers: { "Content-Type": "application/json" } },
    );
  }
  return handle(req, env);
});
