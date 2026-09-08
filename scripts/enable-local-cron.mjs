import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
process.loadEnvFile(".env.server");
if (process.env.SUPABASE_URL !== "http://127.0.0.1:55321")
  throw Error("ISOLATED_LOCAL_ONLY");
const health = await fetch(
  "http://127.0.0.1:55325/functions/v1/center/health",
  { signal: AbortSignal.timeout(10000) },
);
if (!health.ok)
  throw Error("Verify the local Edge container before enabling Cron.");
const quote = (s) => "'" + s.replaceAll("'", "''") + "'";
const secrets = {
  h93_center_endpoint:
    "http://h93labcenter-edge-local:9000/functions/v1/center",
  h93_center_worker_secret: process.env.WORKER_SECRET,
};
const statements = Object.entries(secrets).map(
  ([name, value]) =>
    `select id into sid from vault.secrets where name=${quote(name)}; if sid is null then perform vault.create_secret(${quote(value)},${quote(name)}); else perform vault.update_secret(sid,${quote(value)}); end if;`,
);
statements.push(
  "perform cron.schedule('h93labcenter-worker','15 seconds',$$select private.center_wake('worker')$$);",
  "perform cron.schedule('h93labcenter-dispatch','*/15 * * * *',$$select private.center_wake('dispatch')$$);",
);
const file = ".local/cron-setup.sql";
writeFileSync(
  file,
  "do $setup$ declare sid uuid; begin " +
    statements.join("\n") +
    " end $setup$;",
  { mode: 0o600 },
);
try {
  execFileSync(
    "./node_modules/.bin/supabase",
    ["db", "query", "--local", "--file", file],
    { stdio: ["ignore", "pipe", "pipe"], timeout: 30000 },
  );
} catch {
  throw Error("LOCAL_CRON_SETUP_FAILED");
} finally {
  unlinkSync(file);
}
console.log(
  "Local worker Cron enabled every 15 seconds; timezone dispatcher every 15 minutes. Owner daily research preference is unchanged.",
);
