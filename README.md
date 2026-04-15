<div align="center">

<img src="./logo.png" alt="milo-dsl logo" width="180" />

# milo-dsl

[![CI](https://github.com/YaquilunaDev/milo-dsl/actions/workflows/ci.yml/badge.svg)](https://github.com/YaquilunaDev/milo-dsl/actions/workflows/ci.yml)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-%E2%89%A51.1-000000?logo=bun&logoColor=white)](https://bun.sh)
[![Node](https://img.shields.io/badge/Node-%E2%89%A518-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Built with Claude](https://img.shields.io/badge/Built%20with-Claude-D97757?logo=anthropic&logoColor=white)](https://claude.com/claude-code)

</div>

TypeScript DSL for authoring interactive narrative JSON. Write stories in
typed TS modules, build to the runtime's JSON export format.

## Install

```bash
# npm
npm install github:YaquilunaDev/milo-dsl

# bun
bun add github:YaquilunaDev/milo-dsl

# pnpm
pnpm add github:YaquilunaDev/milo-dsl
```

Pin to a tag or commit:

```bash
npm install github:YaquilunaDev/milo-dsl#v0.1.0
```

The install runs a `prepare` step that builds `dist/` via `tsc`. No
runtime dependencies beyond TypeScript itself.

> **Bun users:** one extra step is required after install. See
> [Bun: trust the prepare script](#bun-trust-the-prepare-script) below.

## Quickstart

```ts
import {
  build,
  defineStory,
  end,
  goto,
  html,
  ifCmd,
  js,
  page,
  prompt,
  say,
  variable,
} from "milo-dsl";

const name = variable<string>("name");

const bye = page("bye", [say(html.p("Goodbye, ", html.evalVar(name))), end()]);

const start = page("start", [
  prompt(name),
  say(html.p("Hello, ", html.evalVar(name), "!")),
  ifCmd(js`${name} == "stop"`, [goto(bye)], [say("Welcome back.")]),
]);

const story = defineStory({
  variables: [name],
  pages: [start, bye],
});

const output = build(story, { galleries: {}, files: {} });
await Bun.write("./out.json", JSON.stringify(output, null, 2));
```

Upload `out.json` through the platform editor.

## CLI

Installed alongside the library, the `milo-dsl` binary builds a story
to JSON without a hand-written build script. Invoke it directly:

```bash
./node_modules/.bin/milo-dsl ./story.ts \
  --registry ./registry.json \
  --out ./out.json
```

Or wire it into `package.json`:

```json
{
  "scripts": {
    "build": "milo-dsl ./story.ts --out ./out.json"
  }
}
```

```bash
bun run build
```

> **Don't use `bunx milo-dsl`.** For GitHub-installed packages Bun still
> hits the public npm registry to resolve a version before falling back
> to the local bin, and since `milo-dsl` isn't published there you'll see
> `error: GET https://registry.npmjs.org/milo-dsl - 404`. Running the
> binary directly or via `bun run` sidesteps the registry lookup.

Pass a directory to pick up its `story.ts` automatically:

```bash
./node_modules/.bin/milo-dsl ./my-story/
```

Add `--minify` for a compact upload-ready payload. See
[docs/cli.md](./docs/cli.md) for all flags.

## How it works

You author a story as a TypeScript module using typed builder functions.
`build(config, registry)` walks the tree, resolves gallery image hashes
and filenames against an asset registry (exported from the platform),
validates module / command / variable / page consistency, and emits the
final JSON. Assets are still uploaded through the platform editor; the
registry is the exported JSON's `galleries` and `files` sections.

## Bun: trust the prepare script

Bun blocks lifecycle scripts by default, so after
`bun add github:YaquilunaDev/milo-dsl` the `prepare` build doesn't run
and `dist/` stays empty. That breaks two things at once:

- `import ... from "milo-dsl"` fails with `Cannot find package 'milo-dsl'`.
- The `milo-dsl` CLI bin isn't linked, so `bunx milo-dsl` falls through
  to the public npm registry and prints
  `error: GET https://registry.npmjs.org/milo-dsl`.

Trust the package once to run `prepare` and link the bin:

```bash
bun pm trust milo-dsl
```

Or, in your consumer `package.json`:

```json
{
  "trustedDependencies": ["milo-dsl"]
}
```

npm and pnpm run `prepare` automatically, so this step is only needed
for Bun. See [Bun's trusted dependencies
docs](https://bun.com/docs/cli/install#trusted-dependencies) for
background.

## Status

Early-stage. The DSL reproduces the reference export faithfully and has
32 passing tests covering the build path, but the API may still change
before 1.0. File issues for bugs or feature requests at
https://github.com/YaquilunaDev/milo-dsl/issues.

## Documentation

- [CLI reference](./docs/cli.md)
- [Commands reference](./docs/commands.md)
- [Variables and JS scope](./docs/variables.md)
- [Embedded JS scope](./docs/js-scope.md)
- [Asset workflow](./docs/assets.md)
- [Migrating from raw JSON](./docs/migration.md)
- [Examples](./examples/)

## License

GPL-3.0-only. See [LICENSE](./LICENSE).
