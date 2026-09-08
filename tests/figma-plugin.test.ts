import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { fixture } from "./fixtures.ts";
test("Figma importer creates editable frames and navigation, preserves previous pages, and is idempotent", async () => {
  let seq = 0;
  const root: any = { children: [] };
  const messages: any[] = [];
  const node = (type: string) => ({
    id: "1:" + ++seq,
    type,
    children: [] as any[],
    height: 24,
    data: {} as Record<string, string>,
    appendChild(n: any) {
      this.children.push(n);
    },
    setPluginData(k: string, v: string) {
      this.data[k] = v;
    },
    getPluginData(k: string) {
      return this.data[k] || "";
    },
    resize(w: number, h: number) {
      this.height = h;
    },
    async setReactionsAsync(r: any) {
      (this as any).reactions = r;
    },
  });
  const figma: any = {
    root,
    currentPage: null,
    fileKey: "fixture",
    showUI() {},
    ui: { postMessage: (m: any) => messages.push(m) },
    async loadFontAsync() {},
    async loadAllPagesAsync() {},
    async setCurrentPageAsync(p: any) {
      this.currentPage = p;
    },
    createPage() {
      const p = node("PAGE");
      root.children.push(p);
      return p;
    },
    createFrame: () => node("FRAME"),
    createText: () => node("TEXT"),
    viewport: { scrollAndZoomIntoView() {} },
  };
  const unrelated = node("PAGE");
  root.children.push(unrelated);
  runInNewContext(readFileSync("figma-plugin/code.js", "utf8"), {
    figma,
    __html__: "",
  });
  const b = fixture(),
    payload = {
      project_id: "fixture-project",
      project_name: "Test",
      version_id: "v1",
      version_number: 1,
      ...b.prototype,
    };
  await figma.ui.onmessage({ type: "import", payload });
  assert.equal(root.children.length, 2);
  const page = root.children[1];
  assert.equal(page.children.length, 2);
  assert.equal(page.children[0].type, "FRAME");
  assert.ok(page.children[0].children.some((n: any) => n.type === "TEXT"));
  const button = page.children[0].children.find((n: any) => n.reactions);
  assert.equal(
    button.reactions[0].actions[0].destinationId,
    page.children[1].id,
  );
  assert.equal(messages.at(-1).type, "complete");
  await figma.ui.onmessage({ type: "import", payload });
  assert.equal(root.children.length, 2);
  await figma.ui.onmessage({
    type: "import",
    payload: { ...payload, version_id: "v2", version_number: 2 },
  });
  assert.equal(root.children.length, 3);
  assert.equal(root.children[0], unrelated);
  assert.equal(root.children[1], page);
  const invalid = {
    ...payload,
    version_id: "v3",
    screens: [
      {
        ...payload.screens[0],
        components: [{ type: "button", text: "Broken", target: "missing" }],
      },
    ],
  };
  await figma.ui.onmessage({ type: "import", payload: invalid });
  assert.equal(root.children.length, 3);
  assert.equal(messages.at(-1).type, "error");
});
