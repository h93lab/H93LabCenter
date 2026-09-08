import test from "node:test";
import assert from "node:assert/strict";
import { artifactDiff, lineDiff } from "../src/components/blueprint-diff.ts";
test("blueprint difference preserves removals, additions and unchanged lines", () => {
  const diff = lineDiff("Keep\nRemove\nEnd", "Keep\nAdd\nEnd");
  assert.deepEqual(
    diff.filter((line) => line.kind !== "add").map((line) => line.text),
    ["Keep", "Remove", "End"],
  );
  assert.deepEqual(
    diff.filter((line) => line.kind !== "remove").map((line) => line.text),
    ["Keep", "Add", "End"],
  );
  assert.equal(diff.filter((line) => line.kind === "same").length, 2);
});
test("artifact comparison includes deleted documents and added entities", () => {
  const changes = artifactDiff(
    {
      documents: [
        { path: "removed.md", content_md: "old" },
        { path: "same.md", content_md: "same" },
      ],
    },
    {
      documents: [
        { path: "added.md", content_md: "new" },
        { path: "same.md", content_md: "same" },
      ],
    },
    "documents",
    "path",
  );
  assert.deepEqual(
    changes.map((change) => [change.id, change.action]),
    [
      ["removed.md", "Removed"],
      ["added.md", "Added"],
    ],
  );
});
