import { writeFileSync } from "node:fs";
import { z } from "zod";
import {
  analysisSchema,
  extractedSchema,
  opportunitySchema,
  blueprintSchema,
  technicalSchema,
  consistencySchema,
} from "../supabase/functions/_shared/domain.ts";
for (const [name, schema] of Object.entries({
  extraction: extractedSchema,
  opportunity: opportunitySchema,
  analysis: analysisSchema,
  blueprint: blueprintSchema,
  technical: technicalSchema,
  consistency: consistencySchema,
})) {
  writeFileSync(
    "schemas/runtime/" + name + ".schema.json",
    JSON.stringify(z.toJSONSchema(schema), null, 2) + "\n",
  );
}
console.log("Runtime schema snapshots exported.");
