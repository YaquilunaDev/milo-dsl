# CLI

The `milo-dsl` command builds a story file to JSON without hand-writing
a build script.

```
milo-dsl <input> [options]
```

Requires Bun (the CLI uses Bun's native `.ts` import). After installing
milo-dsl via `bun add github:YaquilunaDev/milo-dsl`, trust the package
so its `prepare` step runs (`bun pm trust milo-dsl`). Then invoke the
binary directly (`./node_modules/.bin/milo-dsl`) or through a
`package.json` script (`bun run build`).

Do not use `bunx milo-dsl` for GitHub-installed builds. Bun looks up
the package on the public npm registry before using the local bin, and
since `milo-dsl` isn't published there the lookup 404s:
`error: GET https://registry.npmjs.org/milo-dsl - 404`. Running
`./node_modules/.bin/milo-dsl` or `bun run <script>` avoids the
registry call.

## Positional

### `<input>`

Path to a story. Either:

- A `.ts` file that exports `defineStory(...)` as its default export, or
- A directory. The CLI probes for `story.ts`, `story.js`, `index.ts`,
  `index.js` in that order and uses the first hit.

## Options

### `-r, --registry <path>`

Asset registry JSON (exported from the platform; see
[docs/assets.md](./assets.md)). If omitted, the CLI looks for
`registry.json` next to the story. If that file is also absent, the
build runs with an empty registry; it errors only if the story actually
references gallery images or files.

### `-o, --out <path>`

Output file. Default: `<input-dir>/out.json`.

### `--minify`

Emit compact JSON on a single line. Default is 2-space pretty-printed.

### `-h, --help`

Print usage and exit.

### `-V, --version`

Print the installed milo-dsl version and exit.

## Examples

Hello-world style story, no assets, default output path:

```bash
bunx milo-dsl ./story.ts
# wrote ./out.json
```

Folder input with a colocated `registry.json`:

```bash
bunx milo-dsl ./my-story/
# -> ./my-story/out.json
```

Explicit registry and output:

```bash
bunx milo-dsl ./story.ts \
  --registry ./exported-registry.json \
  --out ./dist/story.json
```

Upload-ready minified build:

```bash
bunx milo-dsl ./my-story --minify --out ./dist/story.min.json
```

## Exit codes

- `0` on success.
- `1` on any error (missing input, bad registry path, story has no
  default export, build validation failure).

The CLI prints errors to stderr in the form `milo-dsl: <message>`.
