#!/usr/bin/env node
import { parseArgs } from "node:util";
import { dirname, resolve, isAbsolute, join, extname } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { stat, writeFile, readFile, unlink } from "node:fs/promises";
import { loadAssets } from "./registry.js";
import { build } from "./build.js";
import type { AssetRegistry, StoryConfig } from "./types.js";

const USAGE = `Usage: milo-dsl <input> [options]

Positional:
  <input>                 Path to a story .ts / .js / .mjs file, or a directory
                          containing story.ts / story.js / index.ts / index.js.

Options:
  -r, --registry <path>   Asset registry JSON. Default: <input-dir>/registry.json
                          (falls back to an empty registry if the file is
                          absent, which fails the build only if the story
                          actually references any assets).
  -o, --out <path>        Output file path. Default: <input-dir>/out.json
      --minify            Emit compact JSON. Default is 2-space pretty.
  -h, --help              Show this help.
  -V, --version           Print the milo-dsl version.
`;

function isBun(): boolean {
  return typeof (globalThis as any).Bun !== "undefined";
}

async function main(argv: string[]): Promise<number> {
  const parsed = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      registry: { type: "string", short: "r" },
      out: { type: "string", short: "o" },
      minify: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
      version: { type: "boolean", short: "V", default: false },
    },
  });

  if (parsed.values.help) {
    process.stdout.write(USAGE);
    return 0;
  }

  if (parsed.values.version) {
    const v = await readPackageVersion();
    process.stdout.write(v + "\n");
    return 0;
  }

  const [inputArg, ...rest] = parsed.positionals;
  if (!inputArg) {
    fail("missing <input> argument. Run with --help for usage.");
  }
  if (rest.length > 0) {
    fail(`unexpected extra positional arguments: ${rest.join(" ")}`);
  }

  const storyPath = await resolveStoryPath(resolve(inputArg!));
  const storyDir = dirname(storyPath);

  const registry = await resolveRegistry(parsed.values.registry, storyDir);
  const config = await loadStoryModule(storyPath);

  const output = build(config, registry);

  const outPath = parsed.values.out
    ? resolve(parsed.values.out)
    : resolve(storyDir, "out.json");

  const payload =
    (parsed.values.minify
      ? JSON.stringify(output)
      : JSON.stringify(output, null, 2)) + "\n";

  await writeFile(outPath, payload);
  process.stdout.write(`wrote ${outPath}\n`);
  return 0;
}

async function resolveStoryPath(p: string): Promise<string> {
  if (!(await pathExists(p))) {
    fail(`input path does not exist: ${p}`);
  }
  if (await isDirectory(p)) {
    const candidates = ["story.ts", "story.js", "index.ts", "index.js"];
    for (const name of candidates) {
      const candidate = resolve(p, name);
      if (await pathExists(candidate)) return candidate;
    }
    fail(
      `no story entrypoint in directory ${p} (looked for ${candidates.join(", ")})`
    );
  }
  return p;
}

async function resolveRegistry(
  registryFlag: string | undefined,
  storyDir: string
): Promise<AssetRegistry> {
  if (registryFlag) {
    const abs = isAbsolute(registryFlag)
      ? registryFlag
      : resolve(process.cwd(), registryFlag);
    if (!(await pathExists(abs))) {
      fail(`registry file not found: ${abs}`);
    }
    return await loadAssets(abs);
  }
  const defaultPath = resolve(storyDir, "registry.json");
  if (await pathExists(defaultPath)) {
    return await loadAssets(defaultPath);
  }
  return { galleries: {}, files: {} };
}

async function loadStoryModule(path: string): Promise<StoryConfig> {
  const ext = extname(path).toLowerCase();
  // Bun imports every supported extension natively, and Node handles .js/.mjs
  // without help. Only `.ts` / `.tsx` / `.cts` / `.mts` under Node need the
  // esbuild transpile step.
  const needsTranspile =
    !isBun() && (ext === ".ts" || ext === ".tsx" || ext === ".cts" || ext === ".mts");

  let mod: any;
  try {
    mod = needsTranspile
      ? await importViaEsbuild(path)
      : await import(pathToFileURL(path).href);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    fail(`failed to import story ${path}: ${msg}`);
  }
  const config = (mod as any).default;
  if (!config || typeof config !== "object") {
    fail(
      `story ${path} has no default export. ` +
        "Export your defineStory(...) result as default."
    );
  }
  if (!Array.isArray(config.pages)) {
    fail(
      `story ${path} default export does not look like a StoryConfig (missing pages array).`
    );
  }
  return config as StoryConfig;
}

async function importViaEsbuild(path: string): Promise<unknown> {
  let esbuild: typeof import("esbuild");
  try {
    esbuild = await import("esbuild");
  } catch {
    fail(
      "esbuild is required to import .ts files under Node. It should have " +
        "been installed with milo-dsl; try reinstalling the package."
    );
  }
  const result = await esbuild.build({
    entryPoints: [path],
    bundle: true,
    format: "esm",
    platform: "node",
    target: `node${process.versions.node.split(".")[0]}`,
    write: false,
    sourcemap: "inline",
    logLevel: "silent",
    // Keep milo-dsl external so the bundled story uses the same installed
    // instance as the CLI; brand-symbol identity must hold across the module
    // boundary or the Command discriminator breaks.
    external: ["milo-dsl"],
  });
  if (result.outputFiles.length === 0) {
    fail(`esbuild produced no output for ${path}`);
  }
  const code = result.outputFiles[0]!.text;
  // Write the bundled module next to the user's story file so Node's module
  // resolution can walk up to find the installed `milo-dsl` package in their
  // node_modules. Writing to os.tmpdir() would move us out of that tree and
  // break the `import "milo-dsl"` call in the bundle.
  const storyDir = dirname(path);
  const tmpFile = join(
    storyDir,
    `.milo-dsl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mjs`
  );
  await writeFile(tmpFile, code);
  try {
    return await import(pathToFileURL(tmpFile).href);
  } finally {
    await unlink(tmpFile).catch(() => {});
  }
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function isDirectory(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function readPackageVersion(): Promise<string> {
  const here = fileURLToPath(new URL(".", import.meta.url));
  const candidates = [
    resolve(here, "..", "package.json"),
    resolve(here, "..", "..", "package.json"),
  ];
  for (const p of candidates) {
    if (await pathExists(p)) {
      try {
        const json = JSON.parse(await readFile(p, "utf8"));
        if (json.version) return String(json.version);
      } catch {
        // keep looking
      }
    }
  }
  return "unknown";
}

function fail(message: string): never {
  process.stderr.write(`milo-dsl: ${message}\n`);
  process.exit(1);
}

try {
  const code = await main(process.argv.slice(2));
  process.exit(code);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  fail(msg);
}
