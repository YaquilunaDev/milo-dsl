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

### Bun users: trust the prepare script

Bun blocks lifecycle scripts by default, so the `prepare` build does not
run and `dist/` stays empty until you trust the package:

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

## How it works

You author a story as a TypeScript module using typed builder functions.
`build(config, registry)` walks the tree, resolves gallery image hashes
and filenames against an asset registry (exported from the platform),
validates module / command / variable / page consistency, and emits the
final JSON. Assets are still uploaded through the platform editor; the
registry is the exported JSON's `galleries` and `files` sections.

## Status

Early-stage. The DSL reproduces the reference export faithfully and has
32 passing tests covering the build path, but the API may still change
before 1.0. File issues for bugs or feature requests at
https://github.com/YaquilunaDev/milo-dsl/issues.

## Documentation

- [Commands reference](./docs/commands.md)
- [Variables and JS scope](./docs/variables.md)
- [Embedded JS scope](./docs/js-scope.md)
- [Asset workflow](./docs/assets.md)
- [Migrating from raw JSON](./docs/migration.md)
- [Examples](./examples/)

## License

GPL-3.0-only. See [LICENSE](./LICENSE).
