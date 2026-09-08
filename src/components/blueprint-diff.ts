export type DiffLine = { kind: "same" | "add" | "remove"; text: string };
export function lineDiff(before: string, after: string): DiffLine[] {
  const a = before ? before.split("\n") : [],
    b = after ? after.split("\n") : [];
  if (a.length * b.length > 2_000_000)
    return [
      ...a.map((text) => ({ kind: "remove" as const, text })),
      ...b.map((text) => ({ kind: "add" as const, text })),
    ];
  const matrix = Array.from(
    { length: a.length + 1 },
    () => new Uint32Array(b.length + 1),
  );
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      matrix[i][j] =
        a[i] === b[j]
          ? matrix[i + 1][j + 1] + 1
          : Math.max(matrix[i + 1][j], matrix[i][j + 1]);
  const lines: DiffLine[] = [];
  let i = 0,
    j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      lines.push({ kind: "same", text: a[i++] });
      j++;
    } else if (
      j < b.length &&
      (i === a.length || matrix[i][j + 1] >= matrix[i + 1][j])
    )
      lines.push({ kind: "add", text: b[j++] });
    else lines.push({ kind: "remove", text: a[i++] });
  }
  return lines;
}
export function artifactDiff(
  before: Record<string, any>,
  after: Record<string, any>,
  family: string,
  key: string,
) {
  const oldItems = before[family] || [],
    newItems = after[family] || [];
  const ids = new Set<string>(
    [...oldItems, ...newItems].map((item: any) => item[key]),
  );
  return [...ids].flatMap((id) => {
    const previous = oldItems.find((item: any) => item[key] === id),
      current = newItems.find((item: any) => item[key] === id);
    return JSON.stringify(previous) === JSON.stringify(current)
      ? []
      : [
          {
            id,
            previous,
            current,
            action: !previous ? "Added" : !current ? "Removed" : "Changed",
          },
        ];
  });
}
