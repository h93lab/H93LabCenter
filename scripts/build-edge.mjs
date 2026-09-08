import { build } from "esbuild";
await build({
  entryPoints: ["supabase/functions/center/index.ts"],
  bundle: true,
  platform: "browser",
  format: "esm",
  conditions: ["deno", "browser"],
  outfile: "supabase/functions/center/main.generated.ts",
  minify: true,
  legalComments: "eof",
});
console.log("Supabase Edge bundle built from pinned local dependencies.");
