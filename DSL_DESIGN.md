# MiloDSL design

A TypeScript DSL for authoring the interactive-narrative runtime's JSON
export format with strong types, autocomplete, and build-time validation.

## Why Bun

- Direct TS execution (no compile step for scripts/tests).
- Built-in test runner (`bun:test`) with Jest-style API.
- First-class I/O via `Bun.file()` / `Bun.write()`.
- `bun-types` for DOM-free typing.

APIs used: `Bun.file(path).json()`, `Bun.write(path, string)`, `bun:test`.
No `node:fs`, `node:crypto`, `node:path`.

## Runtime scope (opaque to the DSL)

Embedded JS runs against the runtime's scope. The DSL does not model these
APIs structurally; authors reach them via `` js`…` `` strings.

- `pages`: `goto(id)`, `disable(id)`, `enable(id)`, `isEnabled(id): boolean`,
  `getCurrentPageId(): string`, `dispatchEvent(type)`.
- `Sound` (requires `modules.audio`): `Sound.get(id)` returns a sound handle
  for a previously started `audioPlay` whose `id` was set.
- `teaseStorage` (requires `modules.storage`): `getItem(key)` /
  `setItem(key, value)`, localStorage-like persistence.
- Author-declared variables: reachable by bare name in any JS context.

## Inferred schema

Commands are single-key objects: the key is the command kind, the value is
the payload. The DSL models these as a discriminated union internally and
emits the correct (possibly dotted) key at serialization time.

| Kind                   | Emitted key            | Payload fields                                                            |
|------------------------|------------------------|---------------------------------------------------------------------------|
| prompt                 | `prompt`               | `variable: string`                                                        |
| say                    | `say`                  | `label: string(HTML)`, `mode?`, `align?`, `duration?`, `allowSkip?`       |
| if                     | `if`                   | `condition: string(JS)`, `commands: Command[]`, `elseCommands?: Command[]`|
| image                  | `image`                | `locator: string`                                                         |
| timer                  | `timer`                | `duration: string`, `style?`                                              |
| choice                 | `choice`               | `options: { label: string, commands: Command[] }[]`                       |
| goto                   | `goto`                 | `target: string` (plain page id, or `"$" + JS` for script form)           |
| end                    | `end`                  | `{}`                                                                      |
| eval                   | `eval`                 | `script: string(JS)`                                                      |
| enable                 | `enable`               | `target: string` (page id)                                                |
| disable                | `disable`              | `target: string` (page id)                                                |
| notification.create    | `notification.create`  | `title: string`, `id?`, `buttonLabel?`, `buttonCommands?: Command[]`      |
| notification.remove    | `notification.remove`  | `id: string`                                                              |
| audio.play             | `audio.play`           | `locator: string`, `id?: string`, `loops?: number`                        |

### Enums
- `say.mode`: `"pause" | "instant" | "autoplay" | "custom"` (omitted = default).
- `say.align`: `"left" | "right"` (omitted = centered).
- `timer.style`: `"secret" | "hidden"` (omitted = visible).

### Conditional fields (inferred)
- `say.duration` only when `mode === "custom"`.
- `say.allowSkip` only when `mode === "autoplay" | "custom"`.

The DSL expresses these as a TypeScript discriminated union on the `say`
options argument, so invalid combinations are compile errors.

### Locator grammar
- `gallery:<uuid>/<imageId>`: specific image by integer id (resolved from
  the author's hash via the registry).
- `gallery:<uuid>/*`: random image.
- `file:<name>`: named file.
- `file:<glob>`: glob pattern (e.g. `*.mp3`).

### Duration grammar
- `<n>s`, `<n>m`, `<n>ms`, `<n>h` single unit.
- Composite like `2m40s`, `1h30m`.
- Fractional seconds: `1.1s`.
- Ranges: `"1.1s-8.1s"` as a single string, or `duration.range("1.1s", "8.1s")`.

### HTML in `say.label`
Observed: `<p>`, `<strong>`, `<em>`, `<u>`, `<span style="color: #rrggbb">`,
and `<eval>…</eval>` for runtime variable/expression substitution. The DSL
provides `html.p`, `html.bold`, `html.italic`, `html.underline`, `html.color`,
`html.evalVar`, `html.evalExpr`. Text content is HTML-escaped; branded
helper output passes through unchanged. Raw strings to `say(...)` are not
escaped, but if they do not start with `<` the builder auto-wraps them in
`<p>...</p>`.

### Which fields are which kind of payload
- **JS scripts** (multi-line, evaluated for side effects): `eval.script`,
  `goto.target` (script form, `$`-prefixed), `init`, `initExtra`.
- **JS expressions** (single value): `if.condition`, `<eval>…</eval>` tag
  bodies. The DSL uses the same `` js`…` `` template for both — the runtime
  does not distinguish. Intended usage is documented per call site.
- **HTML**: `say.label`, `choice.option.label` (plain string, no helpers).
- **Plain data**: everything else.

## Variable system

- `variable<T>(name, options?)` returns a `VarRef<T>`. `options.initial`
  triggers auto-init.
- `defineStory({ variables: [...], initExtra?: js`...` })`.
- `init` output = `let <name> = <JSON.stringify(initial)>;` lines
  concatenated (in registration order), followed by `initExtra.source` if
  set. `init` is omitted entirely if nothing would be emitted.
- VarRefs interpolated into `` js`…` `` render as the bare identifier.
- VarRefs passed to `html.evalVar(...)` render `<eval>name</eval>` in the
  label.
- VarRefs used anywhere but not in `defineStory.variables` → build error.
- Tracking is automatic: both `js`…` `` and `html.*` collect the VarRefs
  they see and attach them to the resulting `Js`/`Html` value; command
  builders roll these up. The build walker validates against the declared
  set.

## Module / command consistency
- `audioPlay` requires `modules.audio: true`.
- `notificationCreate` / `notificationRemove` require
  `modules.notification: true`.
- `modules.storage` can't be statically checked because it is only reached
  via opaque `` js`…` `` strings; document-only.

## Asset workflow (PoC)
1. Author uploads gallery images and audio files through the website's
   editor.
2. Author exports the resulting JSON. A hand-extracted slice of its
   `galleries` + `files` sections becomes `registry.json`.
3. DSL author references images by SHA-1 hash and files by name;
   `build(config, registry)` resolves them to the server-assigned ids.
4. Build errors surface on:
   - unknown gallery id / image hash / file name,
   - any image with `id: 0` (placeholder upload),
   - commands from disabled modules,
   - references to undeclared pages or variables.
5. The emitted JSON `galleries` and `files` sections contain only entries
   referenced by the story (same as the observed input).

### Naming

Spec said `loadAssets`; kept that name. Internally the parameter is called
`registry` to make clear it's metadata (ids + hashes), not raw bytes.

## Page references

- `page(id, commands)` creates and registers the page. Its return value is
  both a `PageRef` and a `PageRegistration`, so `goto(start)` accepts it
  directly.
- `commands` may be an array or a callback `(self) => Command[]`; the
  callback form lets a page reference itself without forward-declaring.
- Cross-page references require the target page to be declared first.
  This is enforced structurally: a `PageRef` can only be obtained from
  `page()`, and the build walker errors if a referenced id isn't in the
  declared set.
- Output page order is determined by the `defineStory.pages` array, not
  declaration order.

## Editor field

- On input: ignored (the registry loader reads only `galleries` and
  `files`).
- On output: always emit `{ "recentImages": [] }`.

## Known intentional differences between input JSON and DSL output

- **`editor.recentImages`**: always empty in output.
- **`init` format**: the input's `init` may contain prelude comments and
  omit trailing semicolons (`// comment\nlet testYes = "test"`). The DSL
  emits canonical `let testYes = "test";` lines, optionally followed by
  `initExtra` source. The structural test compares variable-name → value
  pairs, not raw text.
- **`gotoScript` flattening (scoped exception to "don't reformat JS")**:
  the server validates `goto.target`'s `$`-prefixed script form against
  `^\$.*$`, which in regex does not allow line terminators. Browser
  globals that could tunnel multiline code through a single-line envelope
  (`eval`, `atob`, `Function`) are not available on the runtime page, so
  encoding isn't an option either. The DSL flattens this field at build
  time:
  - each `// line comment\n` becomes `/* line comment */;`
  - each remaining newline becomes `;`
  - repeated `;` collapse, leading/trailing `;` are trimmed
  `if.condition`, `eval.script`, `init`, and `initExtra` are NOT touched.
  The structural test applies the same flatten to the reference input so
  comparisons reflect semantics rather than transport.

## Open questions / ambiguities

- `enable` / `disable`: only the plain-string form is observed; a
  `$`-prefixed script form may or may not be supported. If it is, add
  `enableScript` / `disableScript` mirroring `gotoScript`.
- `SoundRef` / `NotificationRef` / `PageRef` interpolation in `` js`…` ``
  currently renders as a JSON-quoted string literal (e.g. `"randomSound"`),
  matching typical runtime usage (`Sound.get('randomSound')`,
  `pages.goto('start')`). The spec text said "bare identifier/ID" which
  could be read either way; the quoted form is what the example runtime
  calls look like.
- `choice.option.label` is plain text in the example. If it ever needs
  HTML, revisit.
- `audio.play.loops`: assumed `number` (0 or positive integer). No upper
  bound validated.
- Initial values for `variable<T>()`: PoC supports primitives only
  (anything `JSON.stringify` can round-trip). No typed arrays or objects
  yet.
- The runtime's exact semantics for `say.mode` defaults, `timer.style`
  defaults, and the non-custom-mode duration behavior are not documented in
  the sample; the DSL models them as optional fields whose absence means
  "runtime default."

## File layout

```
src/
  types.ts         brands + command discriminated union + registry shapes
  js.ts            js`` tag, rawJs, ref collection
  variables.ts     variable<T>()
  duration.ts      duration(), duration.range, seconds(), minutes()
  locator.ts       gallery(), file(), file.pattern()
  html.ts          html.* helpers, escaping, label normalization
  page.ts          page(id, commands)
  commands.ts      all command builders
  story.ts         defineStory()
  build.ts         build() walker + validation + serialization
  registry.ts      loadAssets()
  index.ts         re-exports
examples/
  demo.story.ts    reproduces the reference JSON
  registry.json    asset registry slice
tests/
  build.test.ts
  types.test.ts
build.ts           top-level: import demo, load registry, emit out.json
package.json
tsconfig.json
DSL_DESIGN.md
```

## Verification

- `bun run typecheck` → `tsc --noEmit` clean.
- `bun test` → 29 passing.
- `bun run build` → writes `out.json` that structurally matches
  `dls-tests-2026-04-15.json` minus the documented differences.
