figma.showUI(__html__, { width: 440, height: 540, themeColors: true });
const paint = (hex) => {
  const h = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#202024";
  return [
    {
      type: "SOLID",
      color: {
        r: parseInt(h.slice(1, 3), 16) / 255,
        g: parseInt(h.slice(3, 5), 16) / 255,
        b: parseInt(h.slice(5, 7), 16) / 255,
      },
    },
  ];
};
let regular, bold;
async function fonts() {
  for (const family of ["Cairo", "Inter"]) {
    try {
      regular = { family, style: "Regular" };
      bold = { family, style: "Bold" };
      await figma.loadFontAsync(regular);
      await figma.loadFontAsync(bold);
      return;
    } catch {}
  }
  throw Error("Cairo or Inter font is required.");
}
function label(value, size = 14, strong = false, color = "#202024") {
  const t = figma.createText();
  t.fontName = strong ? bold : regular;
  t.characters = String(value).slice(0, 10000);
  t.fontSize = size;
  t.fills = paint(color);
  t.textAutoResize = "HEIGHT";
  t.resize(310, t.height);
  return t;
}
figma.ui.onmessage = async (msg) => {
  if (msg.type !== "import") return;
  try {
    const p = msg.payload;
    if (
      !p.project_id ||
      !p.version_id ||
      !Array.isArray(p.screens) ||
      p.screens.length < 1 ||
      p.screens.length > 100
    )
      throw Error("Invalid H93Lab handoff payload.");
    const ids = new Set(p.screens.map((s) => s.stable_key));
    if (ids.size !== p.screens.length) throw Error("Duplicate screen IDs.");
    for (const s of p.screens) {
      if (
        !s.name ||
        !Array.isArray(s.components) ||
        s.components.some((c) => c.target && !ids.has(c.target))
      )
        throw Error("Invalid screen or navigation target.");
    }
    await fonts();
    await figma.loadAllPagesAsync();
    const namespace = "h93:" + p.project_id + ":" + p.version_id;
    let page = figma.root.children.find(
      (n) => n.getPluginData("namespace") === namespace,
    );
    if (page) {
      await figma.setCurrentPageAsync(page);
      figma.viewport.scrollAndZoomIntoView(page.children);
      figma.ui.postMessage({
        type: "complete",
        receipt: JSON.parse(page.getPluginData("receipt")),
        text: "This version is already imported. Existing edits were preserved.",
      });
      return;
    }
    page = figma.createPage();
    page.name =
      "H93 · " + p.project_name + " · v" + (p.version_number || "draft");
    page.setPluginData("import_state", "building");
    page.setPluginData("project_id", p.project_id);
    page.setPluginData("version_id", p.version_id);
    await figma.setCurrentPageAsync(page);
    const nodes = {},
      actions = [];
    for (const [i, s] of p.screens.entries()) {
      const frame = figma.createFrame();
      page.appendChild(frame);
      frame.name = s.stable_key + " · " + s.name;
      frame.setPluginData("stable_key", s.stable_key);
      frame.setPluginData("version_id", p.version_id);
      frame.layoutMode = "VERTICAL";
      frame.primaryAxisSizingMode = "AUTO";
      frame.counterAxisSizingMode = "FIXED";
      frame.resize(390, 844);
      frame.paddingTop = 28;
      frame.paddingBottom = 32;
      frame.paddingLeft = 24;
      frame.paddingRight = 24;
      frame.itemSpacing = 18;
      frame.cornerRadius = 24;
      frame.fills = paint(p.tokens?.background || "#ffffff");
      frame.x = (i % 4) * 450;
      frame.y = Math.floor(i / 4) * 1050;
      nodes[s.stable_key] = frame;
      frame.appendChild(
        label("9:41                                      ●  ▰", 11),
      );
      frame.appendChild(label(s.name, 23, true));
      for (const [j, c] of s.components.entries()) {
        if (
          !["heading", "text", "button", "input", "card", "list"].includes(
            c.type,
          )
        )
          continue;
        if (["heading", "text"].includes(c.type)) {
          const t = label(
            c.text,
            c.type === "heading" ? 20 : 14,
            c.type === "heading",
          );
          frame.appendChild(t);
          t.layoutSizingHorizontal = "FILL";
          t.setPluginData("component_key", s.stable_key + ":" + j);
          continue;
        }
        const box = figma.createFrame();
        box.name = c.type + " · " + c.text.slice(0, 50);
        box.layoutMode = "VERTICAL";
        box.primaryAxisSizingMode = "AUTO";
        box.counterAxisSizingMode = "FIXED";
        box.resize(342, 48);
        box.paddingTop = 14;
        box.paddingBottom = 14;
        box.paddingLeft = 16;
        box.paddingRight = 16;
        box.cornerRadius = 9;
        box.fills = paint(
          c.type === "button" ? p.tokens?.primary || "#202024" : "#f4f4f5",
        );
        frame.appendChild(box);
        box.layoutSizingHorizontal = "FILL";
        const t = label(
          c.text,
          14,
          c.type === "button",
          c.type === "button" ? "#ffffff" : "#303038",
        );
        box.appendChild(t);
        t.layoutSizingHorizontal = "FILL";
        box.setPluginData("component_key", s.stable_key + ":" + j);
        if (c.target) actions.push({ node: box, target: c.target });
      }
      frame.setPluginData("screen_states", JSON.stringify(s.states));
    }
    for (const a of actions)
      await a.node.setReactionsAsync([
        {
          trigger: { type: "ON_CLICK" },
          actions: [
            {
              type: "NODE",
              destinationId: nodes[a.target].id,
              navigation: "NAVIGATE",
              transition: null,
              preserveScrollPosition: false,
            },
          ],
        },
      ]);
    const receipt = {
      project_id: p.project_id,
      version_id: p.version_id,
      figma_file_key: figma.fileKey || null,
      page_id: page.id,
      node_map: Object.fromEntries(
        Object.entries(nodes).map(([k, n]) => [k, n.id]),
      ),
      imported_at: new Date().toISOString(),
    };
    page.setPluginData("receipt", JSON.stringify(receipt));
    page.setPluginData("namespace", namespace);
    page.setPluginData("import_state", "complete");
    figma.viewport.scrollAndZoomIntoView(Object.values(nodes));
    figma.ui.postMessage({
      type: "complete",
      receipt,
      text:
        p.screens.length +
        " editable screens created. Older versions and unrelated nodes are preserved.",
    });
  } catch (e) {
    figma.ui.postMessage({
      type: "error",
      text: e.message || "Import failed.",
    });
  }
};
