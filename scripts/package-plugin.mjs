import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { zipSync } from "fflate";
const files = Object.fromEntries(
  readdirSync("figma-plugin").map((n) => [
    n,
    new Uint8Array(readFileSync("figma-plugin/" + n)),
  ]),
);
writeFileSync("public/figma-plugin.zip", zipSync(files));
console.log("Figma plugin packaged.");
