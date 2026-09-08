import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
process.loadEnvFile(".env.server");
const env = process.env;
if (env.SUPABASE_URL !== "http://127.0.0.1:55321")
  throw Error(
    "This helper only supports the isolated local H93LabCenter database.",
  );
const name = "h93labcenter-edge-local";
const docker = (args) =>
  execFileSync("docker", args, {
    encoding: "utf8",
    timeout: 30000,
    stdio: ["ignore", "pipe", "pipe"],
  });
let exists = false;
try {
  docker(["inspect", name]);
  exists = true;
} catch {}
if (exists)
  throw Error(
    "The local Edge container already exists. Keep it running, or stop/remove it only after its active jobs finish.",
  );
const base = resolve(".local/edge-container");
mkdirSync(base + "/main", { recursive: true });
mkdirSync(base + "/center", { recursive: true });
if (!existsSync("supabase/functions/center/main.generated.ts"))
  throw Error("Run npm run edge:build first.");
copyFileSync(
  "supabase/functions/center/main.generated.ts",
  base + "/center/index.ts",
);
writeFileSync(
  base + "/main/index.ts",
  `Deno.serve(async req=>{try{const worker=await EdgeRuntime.userWorkers.create({servicePath:'/work/center',memoryLimitMb:150,workerTimeoutMs:150000,noModuleCache:false,envVars:Object.entries(Deno.env.toObject()),forceCreate:false,cpuTimeSoftLimitMs:10000,cpuTimeHardLimitMs:20000});return await worker.fetch(req);}catch{ return new Response('Edge runtime unavailable',{status:503}); }});`,
);
const secretFile = resolve(".local/edge-container.env");
writeFileSync(
  secretFile,
  Object.entries({
    SUPABASE_URL: "http://supabase_kong_h93labcenter:8000",
    PUBLIC_SUPABASE_URL: env.SUPABASE_URL,
    CENTER_SECRET_KEY: env.SUPABASE_SECRET_KEY,
    CENTER_PUBLISHABLE_KEY: env.SUPABASE_PUBLISHABLE_KEY,
    APP_ORIGIN: env.APP_ORIGIN,
    WORKER_SECRET: env.WORKER_SECRET,
    OPENROUTER_API_KEY: env.OPENROUTER_API_KEY || "",
  })
    .map(([key, value]) => key + "=" + value)
    .join("\n"),
  { mode: 0o600 },
);
docker([
  "create",
  "--name",
  name,
  "--restart=unless-stopped",
  "--cpus=1",
  "--memory=512m",
  "--network",
  "supabase_network_h93labcenter",
  "-p",
  "127.0.0.1:55325:9000",
  "--env-file",
  secretFile,
  "public.ecr.aws/supabase/edge-runtime:v1.74.3",
  "start",
  "--main-service",
  "/work/main",
]);
docker(["cp", base + "/.", name + ":/work"]);
docker(["start", name]);
console.log(
  "Local Supabase Edge Runtime: http://127.0.0.1:55325/functions/v1/center",
);
