import { useState } from "react";
import { human, type Row } from "../lib/client";
import { Badge, Empty } from "./ui";
import { artifactDiff, lineDiff } from "./blueprint-diff";

export function StructuredDetails({
  value,
  onReference,
  depth = 0,
}: {
  value: unknown;
  onReference?: (key: string) => void;
  depth?: number;
}) {
  if (value == null) return <span className="muted">Unknown</span>;
  if (typeof value === "boolean") return <span>{value ? "Yes" : "No"}</span>;
  if (typeof value !== "object") {
    const text = String(value);
    return onReference && /^[A-Z]+-\d+$/.test(text) ? (
      <button className="text-link mono" onClick={() => onReference(text)}>
        {text}
      </button>
    ) : (
      <span className="pre-wrap">{text}</span>
    );
  }
  if (Array.isArray(value))
    return value.length ? (
      <ul className="structured-list">
        {value.map((item, index) => (
          <li key={index}>
            <StructuredDetails
              value={item}
              onReference={onReference}
              depth={depth + 1}
            />
          </li>
        ))}
      </ul>
    ) : (
      <span className="muted">None recorded</span>
    );
  return (
    <dl className={depth ? "structured-details nested" : "structured-details"}>
      {Object.entries(value).map(([key, item]) => (
        <div key={key}>
          <dt>{human(key)}</dt>
          <dd>
            <StructuredDetails
              value={item}
              onReference={onReference}
              depth={depth + 1}
            />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function BlueprintDiff({ before, after }: { before: Row; after: Row }) {
  const [search, setSearch] = useState("");
  const documents = artifactDiff(
    before.manifest,
    after.manifest,
    "documents",
    "path",
  );
  const families = [
    "requirements",
    "features",
    "screens",
    "rules",
    "tasks",
    "events",
    "decisions",
    "tests",
  ];
  const entities = families.flatMap((family) =>
    artifactDiff(before.manifest, after.manifest, family, "stable_key").map(
      (item) => ({ ...item, family }),
    ),
  );
  const selected = documents.filter((item) =>
    item.id.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="blueprint-diff">
      <p>
        Version {before.version_number} → Version {after.version_number} ·{" "}
        {documents.length} document changes · {entities.length} entity changes
      </p>
      <p>
        Quality score: {before.quality_score ?? "Unknown"} →{" "}
        {after.quality_score ?? "Unknown"}
        {typeof before.quality_score === "number" &&
        typeof after.quality_score === "number"
          ? ` (${after.quality_score - before.quality_score >= 0 ? "+" : ""}${after.quality_score - before.quality_score})`
          : ""}
      </p>
      <p className="muted">
        Added and removed lines are labeled explicitly. Screen changes also
        identify prototype changes. Technical documents include data contracts
        and integration guidance.
      </p>
      <label>
        Find a changed document
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search document paths…"
        />
      </label>
      {selected.map((item) => (
        <details
          className="diff-file"
          key={item.id}
          open={selected.length === 1}
        >
          <summary>
            <Badge value={item.action} />{" "}
            <span className="mono">{item.id}</span>
          </summary>
          <div className="unified-diff" aria-label={`Changes in ${item.id}`}>
            {lineDiff(
              item.previous?.content_md || "",
              item.current?.content_md || "",
            ).map((line, index) => (
              <div key={index} className={`diff-line ${line.kind}`}>
                <span
                  className="diff-sign"
                  aria-label={
                    line.kind === "same"
                      ? "Unchanged"
                      : line.kind === "add"
                        ? "Added"
                        : "Removed"
                  }
                >
                  {line.kind === "same" ? " " : line.kind === "add" ? "+" : "−"}
                </span>
                <code>{line.text || " "}</code>
              </div>
            ))}
          </div>
        </details>
      ))}
      {!selected.length && (
        <Empty
          title="No matching changed documents"
          text="Try another file name."
        />
      )}
      <h3>Structured entity changes</h3>
      {entities.map((item) => (
        <details className="diff-file" key={item.family + item.id}>
          <summary>
            <Badge value={item.action} />
            {human(item.family)} · {item.id} ·{" "}
            {item.current?.title ||
              item.current?.name ||
              item.previous?.title ||
              item.previous?.name}
          </summary>
          <div className="two-column diff-entities">
            <section>
              <h4>Before</h4>
              {item.previous ? (
                <StructuredDetails value={item.previous} />
              ) : (
                <p>Not present</p>
              )}
            </section>
            <section>
              <h4>After</h4>
              {item.current ? (
                <StructuredDetails value={item.current} />
              ) : (
                <p>Removed from this version</p>
              )}
            </section>
          </div>
        </details>
      ))}
      {!entities.length && (
        <p className="muted">No structured entity changes.</p>
      )}
    </div>
  );
}
