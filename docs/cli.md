# CLI

The `milo-dsl` command builds a story file to JSON without hand-writing
a build script.

```
milo-dsl <input> [options]
```

Runs under Node (>= 18) and Bun. Under Node, `.ts` stories are
transpiled on the fly via `esbuild`, which is a runtime dependency of
milo-dsl and installed automatically. Under Bun, the native `.ts`
loader is used; `esbuild` is never invoked.

Installation:

```bash
npm install github:YaquilunaDev/milo-dsl
# or
bun add github:YaquilunaDev/milo-dsl
```

For Bun installs, trust the package so the `prepare` step can build
`dist/`:

```bash
bun pm trust milo-dsl
```

Invoke the binary via any of:

- `npx milo-dsl ...`
- `./node_modules/.bin/milo-dsl ...`
- a `package.json` script: `"build": "milo-dsl ..."`, then
  `npm run build` or `bun run build`.

Avoid `bunx milo-dsl` for GitHub-installed builds. Bun consults the
public npm registry before falling back to the local bin, and since
`milo-dsl` is not published there the request 404s:
`error: GET https://registry.npmjs.org/milo-dsl - 404`.

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
