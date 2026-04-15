import { afterAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "../src/build";
import { loadAssets } from "../src/registry";
import helloStory from "../examples/01-hello-world/story";
import fullStory from "../examples/04-full-tour/story";

const CLI = "./src/cli.ts";
const tmpDirs: string[] = [];

async function makeTmp(): Promise<string> {
  const d = await mkdtemp(join(tmpdir(), "milo-cli-"));
  tmpDirs.push(d);
  return d;
}

afterAll(async () => {
  for (const d of tmpDirs) {
    await rm(d, { recursive: true, force: true }).catch(() => {});
  }
});

async function runCli(
  args: string[]
): Promise<{ code: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn(["bun", CLI, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const code = await proc.exited;
  return { code, stdout, stderr };
}

describe("cli", () => {
  test("--help exits 0 and prints usage", async () => {
    const { code, stdout } = await runCli(["--help"]);
    expect(code).toBe(0);
    expect(stdout).toContain("Usage: milo-dsl");
    expect(stdout).toContain("--registry");
    expect(stdout).toContain("--out");
    expect(stdout).toContain("--minify");
  });

  test("--version exits 0 and prints a version string", async () => {
    const { code, stdout } = await runCli(["--version"]);
    expect(code).toBe(0);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  test("missing input exits 1 with a clear message", async () => {
    const { code, stderr } = await runCli([]);
    expect(code).toBe(1);
    expect(stderr).toContain("missing <input>");
  });

  test("nonexistent input exits 1", async () => {
    const { code, stderr } = await runCli(["/definitely/not/a/real/path.ts"]);
    expect(code).toBe(1);
    expect(stderr).toContain("does not exist");
  });

  test("builds hello-world to a custom --out path", async () => {
    const out = join(await makeTmp(), "hw.json");
    const { code, stdout } = await runCli([
      "examples/01-hello-world/story.ts",
      "--out",
      out,
    ]);
    expect(code).toBe(0);
    expect(stdout).toContain(`wrote ${out}`);
    const actual = JSON.parse(await readFile(out, "utf8"));
    const expected = build(helloStory, { galleries: {}, files: {} });
    expect(actual).toEqual(expected);
  });

  test("folder input resolves to story.ts inside", async () => {
    const out = join(await makeTmp(), "full.json");
    const { code } = await runCli([
      "examples/04-full-tour",
      "--out",
      out,
    ]);
    expect(code).toBe(0);
    const actual = JSON.parse(await readFile(out, "utf8"));
    const registry = await loadAssets(
      "./examples/04-full-tour/registry.json"
    );
    const expected = build(fullStory, registry);
    expect(actual).toEqual(expected);
  });

  test("--minify emits single-line JSON", async () => {
    const out = join(await makeTmp(), "pretty.json");
    const outMini = join(await makeTmp(), "mini.json");
    await runCli(["examples/04-full-tour", "--out", out]);
    await runCli(["examples/04-full-tour", "--out", outMini, "--minify"]);
    const pretty = await readFile(out, "utf8");
    const mini = await readFile(outMini, "utf8");
    expect(mini.length).toBeLessThan(pretty.length);
    // Both parse to the same object.
    expect(JSON.parse(mini)).toEqual(JSON.parse(pretty));
    // Minified has at most one newline (trailing).
    expect(mini.trim().includes("\n")).toBe(false);
  });

  test("--registry explicitly overrides the default", async () => {
    const out = join(await makeTmp(), "full.json");
    const { code } = await runCli([
      "examples/04-full-tour/story.ts",
      "--registry",
      "examples/04-full-tour/registry.json",
      "--out",
      out,
    ]);
    expect(code).toBe(0);
    const actual = JSON.parse(await readFile(out, "utf8"));
    const registry = await loadAssets(
      "./examples/04-full-tour/registry.json"
    );
    const expected = build(fullStory, registry);
    expect(actual).toEqual(expected);
  });

  test("bad --registry path exits 1", async () => {
    const { code, stderr } = await runCli([
      "examples/04-full-tour/story.ts",
      "--registry",
      "/definitely/not/here.json",
    ]);
    expect(code).toBe(1);
    expect(stderr).toContain("registry file not found");
  });
});
