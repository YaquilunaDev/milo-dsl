import { describe, expect, test } from "bun:test";
import {
  audioPlay,
  build,
  defineStory,
  duration,
  file,
  gallery,
  html,
  image,
  js,
  loadAssets,
  notificationCreate,
  notificationRemove,
  page,
  say,
  variable,
} from "../src";
import type { AssetRegistry } from "../src/types";
import { flattenGotoScript } from "../src/internal/flatten";
import story from "../examples/04-full-tour/story";

const REGISTRY_PATH = "./examples/04-full-tour/registry.json";
const INPUT_JSON_PATH = "./dls-tests-2026-04-15.json";

async function loadInput(): Promise<any> {
  return await Bun.file(INPUT_JSON_PATH).json();
}

// Strip fields the DSL intentionally diverges on (editor state, init text form).
function normalize(x: any) {
  const copy = structuredClone(x);
  delete copy.editor;
  // init: compare only the set of `let <name> = <value>;` / `let <name>=<value>` lines.
  if (typeof copy.init === "string") {
    copy.init = extractLetAssignments(copy.init);
  }
  // gotoScript targets: the DSL flattens multiline JS at build time because
  // the server's target regex forbids newlines. Apply the same flattening to
  // the input so comparisons reflect semantics, not transport.
  walkCommands(copy.pages, (cmd: any) => {
    if (cmd?.goto?.target?.startsWith("$")) {
      cmd.goto.target = "$" + flattenGotoScript(cmd.goto.target.slice(1));
    }
  });
  return copy;
}

function walkCommands(pages: any, fn: (cmd: any) => void): void {
  if (!pages || typeof pages !== "object") return;
  for (const key of Object.keys(pages)) {
    const cmds = pages[key];
    if (!Array.isArray(cmds)) continue;
    for (const cmd of cmds) visit(cmd, fn);
  }
}
function visit(cmd: any, fn: (cmd: any) => void): void {
  if (!cmd || typeof cmd !== "object") return;
  fn(cmd);
  if (cmd.if) {
    for (const c of cmd.if.commands ?? []) visit(c, fn);
    for (const c of cmd.if.elseCommands ?? []) visit(c, fn);
  }
  if (cmd.choice) {
    for (const opt of cmd.choice.options ?? [])
      for (const c of opt.commands ?? []) visit(c, fn);
  }
  if (cmd["notification.create"]?.buttonCommands) {
    for (const c of cmd["notification.create"].buttonCommands) visit(c, fn);
  }
}

function extractLetAssignments(src: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const re = /let\s+([A-Za-z_$][\w$]*)\s*=\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|-?\d+(?:\.\d+)?|true|false|null)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const [, name, valueRaw] = m;
    try {
      const jsonVal =
        valueRaw!.startsWith("'")
          ? JSON.parse('"' + valueRaw!.slice(1, -1).replace(/\\'/g, "'").replace(/"/g, '\\"') + '"')
          : JSON.parse(valueRaw!);
      out[name!] = jsonVal;
    } catch {
      out[name!] = valueRaw;
    }
  }
  return out;
}

const hasInputJson = await Bun.file(INPUT_JSON_PATH).exists();

describe("build: demo reproduction", () => {
  test.skipIf(!hasInputJson)(
    "demo builds and structurally matches input JSON",
    async () => {
      const assets = await loadAssets(REGISTRY_PATH);
      const built = build(story, assets);
      const expected = await loadInput();
      expect(normalize(built)).toEqual(normalize(expected));
    }
  );

  test("output has editor: { recentImages: [] } regardless of input", async () => {
    const assets = await loadAssets(REGISTRY_PATH);
    const built = build(story, assets);
    expect(built.editor).toEqual({ recentImages: [] });
  });

  test("init contains canonical `let testYes = \"test\";`", async () => {
    const assets = await loadAssets(REGISTRY_PATH);
    const built = build(story, assets);
    expect(built.init).toContain('let testYes = "test";');
  });
});

describe("build: validation errors", () => {
  const remi = gallery({
    id: "12fb05bc-9183-4826-93f3-150a674a228e",
    name: "Remi",
  });

  async function registry(): Promise<AssetRegistry> {
    return await loadAssets(REGISTRY_PATH);
  }

  test("unknown image hash throws", async () => {
    const s = defineStory({
      pages: [
        page("start", [
          image(remi.image("0000000000000000000000000000000000000000")),
        ]),
      ],
    });
    expect(() => build(s, {
      galleries: {
        "12fb05bc-9183-4826-93f3-150a674a228e": {
          name: "Remi",
          images: [],
        },
      },
      files: {},
    })).toThrow(/hash 0{40} not found/);
  });

  test("unknown file name throws", async () => {
    const s = defineStory({
      modules: { audio: true },
      pages: [page("start", [audioPlay({ locator: file("missing.mp3") })])],
    });
    expect(() => build(s, { galleries: {}, files: {} })).toThrow(
      /file "missing.mp3" not found/
    );
  });

  test("image with id 0 throws", async () => {
    const hash = "0000000000000000000000000000000000000001";
    const s = defineStory({
      pages: [page("start", [image(remi.image(hash))])],
    });
    expect(() =>
      build(s, {
        galleries: {
          "12fb05bc-9183-4826-93f3-150a674a228e": {
            name: "Remi",
            images: [{ id: 0, hash, size: 0, width: 0, height: 0 }],
          },
        },
        files: {},
      })
    ).toThrow(/id 0/);
  });

  test("audioPlay without audio module throws", async () => {
    const assets = await registry();
    const s = defineStory({
      pages: [
        page("start", [
          audioPlay({ locator: file("file-example-mp3-700kb.mp3") }),
        ]),
      ],
    });
    expect(() => build(s, assets)).toThrow(/modules.audio: true/);
  });

  test("notification command without notification module throws", async () => {
    const assets = await registry();
    const s = defineStory({
      pages: [page("start", [notificationCreate({ title: "x" })])],
    });
    expect(() => build(s, assets)).toThrow(/modules.notification: true/);
  });

  test("undeclared variable throws", async () => {
    const assets = await registry();
    const undeclared = variable<string>("undeclared");
    const s = defineStory({
      variables: [],
      pages: [page("start", [say(html.p("hi")), ifCmdLocal(undeclared)])],
    });
    expect(() => build(s, assets)).toThrow(
      /variable "undeclared" is used but not declared/
    );
  });

  test("goto to unknown page throws", async () => {
    const assets = await registry();
    // craft a phony ref with the same brand
    const { goto, page } = await import("../src");
    const strayPage = page("stray", []);
    const s = defineStory({ pages: [page("start", [goto(strayPage)])] });
    expect(() => build(s, assets)).toThrow(/page "stray" is referenced but not declared/);
  });
});

function ifCmdLocal(v: ReturnType<typeof variable<string>>) {
  const { ifCmd, say } = require("../src") as typeof import("../src");
  return ifCmd(js`${v} == "x"`, [say("ok")]);
}

describe("variables / init generation", () => {
  test("variable with initial emits canonical let line", () => {
    const v = variable<string>("x", { initial: "hello" });
    const s = defineStory({
      variables: [v],
      pages: [page("start", [])],
    });
    const out = build(s, { galleries: {}, files: {} });
    expect(out.init).toBe('let x = "hello";');
  });

  test("variable without initial does not appear in init", () => {
    const v = variable<string>("x");
    const s = defineStory({
      variables: [v],
      pages: [page("start", [])],
    });
    const out = build(s, { galleries: {}, files: {} });
    expect(out.init).toBeUndefined();
  });

  test("initExtra appends after auto-gen", () => {
    const v = variable<number>("n", { initial: 42 });
    const s = defineStory({
      variables: [v],
      initExtra: js`// post-init`,
      pages: [page("start", [])],
    });
    const out = build(s, { galleries: {}, files: {} });
    expect(out.init).toBe("let n = 42;\n// post-init");
  });
});

describe("locators / durations", () => {
  test("duration parses single and range", () => {
    expect(duration("10s").value).toBe("10s");
    expect(duration("2m40s").value).toBe("2m40s");
    expect(duration("1.1s-8.1s").value).toBe("1.1s-8.1s");
    expect(duration.range("3s", "22s").value).toBe("3s-22s");
  });

  test("duration rejects garbage", () => {
    expect(() => duration("not a duration")).toThrow();
    expect(() => duration("10x")).toThrow();
  });

  test("gallery random serializes with wildcard", async () => {
    const assets = await loadAssets(REGISTRY_PATH);
    const remi = gallery({
      id: "12fb05bc-9183-4826-93f3-150a674a228e",
      name: "Remi",
    });
    const s = defineStory({
      pages: [page("start", [image(remi.random())])],
    });
    const out = build(s, assets);
    expect((out.pages.start[0] as any).image.locator).toBe(
      "gallery:12fb05bc-9183-4826-93f3-150a674a228e/*"
    );
  });

  test("file pattern passes through", async () => {
    const assets = await loadAssets(REGISTRY_PATH);
    const s = defineStory({
      modules: { audio: true },
      pages: [
        page("start", [audioPlay({ locator: file.pattern("*.mp3") })]),
      ],
    });
    const out = build(s, assets);
    expect((out.pages.start[0] as any)["audio.play"].locator).toBe(
      "file:*.mp3"
    );
  });
});

describe("js template", () => {
  test("VarRef renders as bare identifier", () => {
    const v = variable<string>("foo");
    expect(js`${v} + 1`.source).toBe("foo + 1");
  });

  test("string interpolation is JSON-quoted", () => {
    const src = js`x == ${"yaaas"}`.source;
    expect(src).toBe('x == "yaaas"');
  });

  test("unsupported interpolation throws", () => {
    expect(() => js`${{} as any}`).toThrow(/unsupported type/);
  });

  test("nested js pastes raw source", () => {
    const inner = js`a + b`;
    expect(js`(${inner}) * 2`.source).toBe("(a + b) * 2");
  });
});

describe("html helpers", () => {
  test("text is escaped", () => {
    expect(html.p("a < b & c").html).toBe("<p>a &lt; b &amp; c</p>");
  });

  test("nested helpers compose", () => {
    expect(html.p(html.bold("X")).html).toBe("<p><strong>X</strong></p>");
  });

  test("color validates hex", () => {
    expect(() => html.color("red", "x")).toThrow(/hex/);
    expect(html.color("#aabbcc", "x").html).toBe(
      '<span style="color: #aabbcc">x</span>'
    );
  });

  test("evalVar renders eval tag with bare name", () => {
    const v = variable<string>("who");
    expect(html.evalVar(v).html).toBe("<eval>who</eval>");
  });

  test("raw string without leading tag gets wrapped in <p>", () => {
    const s = say("Hello");
    expect(s.label).toBe("<p>Hello</p>");
  });

  test("HTML helper output does not get re-wrapped", () => {
    const s = say(html.p("Hello"));
    expect(s.label).toBe("<p>Hello</p>");
  });
});

describe("gotoScript flattening", () => {
  test("line comment + statements become single-line", async () => {
    const assets = await loadAssets(REGISTRY_PATH);
    const { gotoScript } = await import("../src");
    const s = defineStory({
      pages: [
        page("start", [
          gotoScript(js`// hello
pages.goto('start')
pages.disable('start')`),
        ]),
      ],
    });
    const out = build(s, assets);
    const target = (out.pages.start[0] as any).goto.target;
    expect(target).not.toContain("\n");
    expect(target).toBe(
      "$/* hello*/;pages.goto('start');pages.disable('start')"
    );
    expect(/^\$.*$/.test(target)).toBe(true);
  });

  test("single-line gotoScript passes through", async () => {
    const assets = await loadAssets(REGISTRY_PATH);
    const { gotoScript } = await import("../src");
    const s = defineStory({
      pages: [page("start", [gotoScript(js`pages.goto('start')`)])],
    });
    const out = build(s, assets);
    expect((out.pages.start[0] as any).goto.target).toBe(
      "$pages.goto('start')"
    );
  });

  test("eval.script preserves newlines (not flattened)", async () => {
    const assets = await loadAssets(REGISTRY_PATH);
    const { evalCmd } = await import("../src");
    const s = defineStory({
      pages: [
        page("start", [
          evalCmd(js`// stays
pages.goto('start')`),
        ]),
      ],
    });
    const out = build(s, assets);
    expect((out.pages.start[0] as any).eval.script).toContain("\n");
  });
});

describe("notifications", () => {
  test("notificationRemove uses ref.id", () => {
    const r = notificationCreate({ title: "t", id: "abc" });
    const rm = notificationRemove(r.ref);
    expect((rm as any).id).toBe("abc");
  });
});
