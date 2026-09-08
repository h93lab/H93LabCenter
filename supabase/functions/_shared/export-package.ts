import { zipSync, strToU8 } from "fflate";
import { reviewedQuality, sha, safePath, type Bundle } from "./domain.ts";
import type { Row } from "./store.ts";

const secretPatterns = [
  /sk-or-v1-[A-Za-z0-9_-]+/,
  /sb_secret_[A-Za-z0-9_-]+/,
  /\bsk-[A-Za-z0-9_-]{24,}\b/,
  /-----BEGIN(?: [A-Z]+)* PRIVATE KEY-----/,
  /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/,
];
export function scanExportContent(value: string, knownSecrets: string[] = []) {
  if (
    secretPatterns.some((pattern) => pattern.test(value)) ||
    knownSecrets.some((secret) => secret.length >= 16 && value.includes(secret))
  )
    throw Error("EXPORT_SECRET_DETECTED");
}
export async function buildExportPackage(
  project: Row,
  version: Row,
  knownSecrets: string[] = [],
) {
  const bundle = version.manifest as Bundle;
  const files: Record<string, Uint8Array> = {};
  const names = new Set<string>();
  const manifest: Row = {
    project_id: project.id,
    project: project.name,
    slug: project.slug,
    source_concept_id: project.concept_id,
    version: version.version_number,
    version_id: version.id,
    generated_at: new Date().toISOString(),
    schema_version: "1.1",
    prototype_version: version.id,
    quality: reviewedQuality(bundle, version.consistency_review),
    compatible_agents: ["Claude Code", "Codex", "Kimi", "Gemini CLI"],
    flutter_version_policy:
      "Latest stable at implementation time unless a version is justified in the technical plan",
    files: [],
  };
  async function add(path: string, content: string) {
    safePath(path);
    if (names.has(path.toLowerCase())) throw Error("EXPORT_DUPLICATE_PATH");
    names.add(path.toLowerCase());
    scanExportContent(content, knownSecrets);
    files[path] = strToU8(content);
    manifest.files.push({ path, sha256: await sha(files[path]) });
  }
  for (const doc of bundle.documents) await add(doc.path, doc.content_md);
  await add(
    "prototype/prototype.json",
    JSON.stringify(bundle.prototype, null, 2),
  );
  await add(
    "prototype/figma-handoff.json",
    JSON.stringify(
      {
        project_id: project.id,
        project_name: project.name,
        version_id: version.id,
        version_number: version.version_number,
        ...bundle.prototype,
      },
      null,
      2,
    ),
  );
  const required = [
    "AGENTS.md",
    "product/PRD.md",
    "technical/ARCHITECTURE.md",
    "technical/DATA_MODEL.md",
    "execution/TASKS.md",
    "execution/TESTING.md",
    "ux/SCREENS.md",
  ];
  if (required.some((path) => !files[path]))
    throw Error("EXPORT_REQUIRED_FILE_MISSING");
  for (const doc of bundle.documents) {
    const prose = doc.content_md.replace(/```[\s\S]*?```/g, "");
    for (const match of prose.matchAll(
      /\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g,
    )) {
      const target = match[1];
      if (target.startsWith("#") || /^(https?:|mailto:)/i.test(target))
        continue;
      if (/^[a-z][a-z\d+.-]*:/i.test(target)) throw Error("EXPORT_UNSAFE_LINK");
      const resolved = new URL(target, "https://archive.invalid/" + doc.path);
      const path = decodeURIComponent(resolved.pathname.slice(1));
      if (!files[path]) throw Error("EXPORT_BROKEN_LINK");
    }
  }
  const metadata = JSON.stringify(manifest, null, 2);
  scanExportContent(metadata, knownSecrets);
  if (names.has("manifest.json")) throw Error("EXPORT_DUPLICATE_PATH");
  files["MANIFEST.json"] = strToU8(metadata);
  const archive = zipSync(files, { level: 6 });
  return { manifest, archive, archive_checksum: await sha(archive) };
}
