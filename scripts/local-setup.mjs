import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
const info = JSON.parse(
  execFileSync("./node_modules/.bin/supabase", ["status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
if (
  new URL(info.API_URL).hostname !== "127.0.0.1" ||
  !info.API_URL.includes(":55321")
)
  throw Error("LOCAL_ONLY");
mkdirSync(".local", { recursive: true });
mkdirSync("src/lib", { recursive: true });
const old = existsSync(".env.server")
  ? readFileSync(".env.server", "utf8")
      .split("\n")
      .filter((l) => !/^SUPABASE_|^WORKER_SECRET=/.test(l))
      .join("\n")
  : "";
writeFileSync(
  ".env.server",
  old +
    `\nSUPABASE_URL=${info.API_URL}\nSUPABASE_PUBLISHABLE_KEY=${info.PUBLISHABLE_KEY}\nSUPABASE_SECRET_KEY=${info.SECRET_KEY}\nWORKER_SECRET=${randomBytes(32).toString("hex")}\n`,
  { mode: 0o600 },
);
writeFileSync(
  ".env.local",
  `VITE_SUPABASE_URL=${info.API_URL}\nVITE_SUPABASE_PUBLISHABLE_KEY=${info.PUBLISHABLE_KEY}\nVITE_API_URL=/api\n`,
  { mode: 0o600 },
);
const db = createClient(info.API_URL, info.SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
let owner;
if (existsSync(".local/owner.json"))
  owner = JSON.parse(readFileSync(".local/owner.json", "utf8"));
else {
  owner = {
    email: "owner@h93lab.local",
    password: randomBytes(24).toString("base64url"),
  };
  const { data, error } = await db.auth.admin.createUser({
    ...owner,
    email_confirm: true,
    user_metadata: { display_name: "Hesham" },
  });
  if (error) throw error;
  owner.id = data.user.id;
  writeFileSync(".local/owner.json", JSON.stringify(owner, null, 2), {
    mode: 0o600,
  });
}
const roles = [
  "claim_extractor",
  "signal_classifier",
  "signal_cluster_analyst",
  "opportunity_generator",
  "concept_generator",
  "competitor_analyst",
  "review_miner",
  "market_analyst",
  "monetization_distribution_analyst",
  "risk_analyst",
  "dedupe_adjudicator",
  "final_judge",
  "executive_brief_writer",
  "blueprint_product_architect",
  "blueprint_ux_architect",
  "blueprint_technical_architect",
  "blueprint_business_architect",
  "blueprint_task_planner",
  "prototype_spec_generator",
  "consistency_reviewer",
  "change_manager",
];
const { error } = await db.from("ai_roles").upsert(
  roles.map((role_key) => ({
    owner_id: owner.id,
    role_key,
    primary_model: "openai/gpt-4.1-mini",
    max_cost_per_call_usd: 0.15,
    settings: { max_tokens: 12000, temperature: 0.15 },
  })),
  { onConflict: "owner_id,role_key" },
);
if (error) throw error;
await db
  .from("app_settings")
  .update({
    daily_research_enabled: false,
    daily_ai_budget_usd: 2,
    monthly_ai_budget_usd: 20,
    max_deep_candidates: 2,
    research_config: {
      query: "mobile productivity offline privacy",
      max_items: 12,
      run_budget: 0.5,
    },
  })
  .eq("owner_id", owner.id);
await db.from("profiles").update({ display_name: "Hesham" }).eq("id", owner.id);
await db
  .from("research_sources")
  .update({ enabled: false })
  .eq("owner_id", owner.id);
await db
  .from("research_sources")
  .update({ enabled: true })
  .eq("owner_id", owner.id)
  .in("key", ["apple_app_store", "hacker_news", "github"]);
console.log(
  "Local owner and role settings ready. Credentials saved to .local/owner.json. No remote changes.",
);
