import { createServer } from "node:http";
import { handle, dispatch } from "../supabase/functions/_shared/api.ts";
import { tick } from "../supabase/functions/_shared/pipeline.ts";
import type { Env } from "../supabase/functions/_shared/store.ts";
process.loadEnvFile(".env.server");
const env = process.env as unknown as Env;
if (new URL(env.SUPABASE_URL).hostname !== "127.0.0.1")
  throw Error("Local runner requires loopback Supabase");
const server = createServer(async (req, res) => {
  try {
    const chunks: Buffer[] = [];
    let length = 0;
    for await (const chunk of req) {
      length += chunk.length;
      if (length > 1000000) {
        res.writeHead(413);
        res.end();
        return;
      }
      chunks.push(chunk);
    }
    const request = new Request("http://127.0.0.1:8788" + req.url, {
      method: req.method,
      headers: req.headers as Record<string, string>,
      ...(!["GET", "HEAD"].includes(req.method || "GET")
        ? { body: Buffer.concat(chunks) }
        : {}),
    });
    const response = await handle(request, env);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    res.writeHead(500);
    res.end("Server error");
  }
});
server.listen(8788, "127.0.0.1", () =>
  console.log("H93Lab local API: http://127.0.0.1:8788"),
);
let busy = false;
setInterval(async () => {
  if (busy || process.env.LOCAL_WORKER_ENABLED === "0") return;
  busy = true;
  try {
    await tick(env);
  } catch (e) {
    console.error(
      "Worker unavailable:",
      e instanceof Error ? e.message : "unknown",
    );
  } finally {
    busy = false;
  }
}, 2500);

setInterval(
  () =>
    process.env.LOCAL_WORKER_ENABLED !== "0" &&
    dispatch(env).catch(() => console.error("Scheduled dispatch failed")),
  60000,
);
