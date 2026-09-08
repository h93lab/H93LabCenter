import { z } from "zod";
import type { Bundle } from "./domain.ts";
export const figmaReceiptSchema = z.object({
  project_id: z.string().uuid(),
  version_id: z.string().uuid(),
  figma_file_key: z.string().max(200).nullable(),
  page_id: z.string().regex(/^\d+:\d+$/),
  node_map: z.record(z.string(), z.string().regex(/^\d+:\d+$/)),
  imported_at: z.string().datetime(),
});
export type FigmaReceipt = z.infer<typeof figmaReceiptSchema>;
export interface FigmaAdapter {
  createArtifact(
    project: { id: string; name: string },
    version: { id: string; version_number: number; manifest: Bundle },
  ): unknown;
  getArtifactStatus(
    receipt: FigmaReceipt,
    currentVersion: string,
  ): "current" | "stale";
}
export const fileHandoff: FigmaAdapter = {
  createArtifact: (project, version) => ({
    project_id: project.id,
    project_name: project.name,
    version_id: version.id,
    version_number: version.version_number,
    ...version.manifest.prototype,
  }),
  getArtifactStatus: (receipt, currentVersion) =>
    receipt.version_id === currentVersion ? "current" : "stale",
};
