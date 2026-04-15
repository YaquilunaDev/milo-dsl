# Migrating from raw JSON

If you already have stories authored as raw JSON, the DSL is a
drop-in replacement for authoring while producing the same shape of
output. Port one page at a time; nothing forces a big-bang rewrite.

## 1. Variables

Before:

```json
{ "prompt": { "variable": "name" } }
```

After:

```ts
const name = variable<string>("name");

// ...

prompt(name);
```

Declare once at the top of your module, register in
`defineStory({ variables: [name] })`, then pass the ref to `prompt` and
into `js`...`` interpolations.

## 2. `say` with HTML

Before:

```json
{ "say": { "label": "<p>Hello, <eval>name</eval>!</p>" } }
```

After:

```ts
say(html.p("Hello, ", html.evalVar(name), "!"));
```

Or pass the raw string if you prefer:

```ts
say("<p>Hello, <eval>name</eval>!</p>");
```

Raw strings pass through unescaped. Strings that do not start with `<`
get auto-wrapped in `<p>…</p>`.

## 3. Conditionals

Before:

```json
{
  "if": {
    "condition": "name == \"stop\"",
    "commands": [{ "goto": { "target": "bye" } }]
  }
}
```

After:

```ts
const bye = page("bye", [...]);

ifCmd(js`${name} == "stop"`, [goto(bye)]);
```

`goto(bye)` is typed: passing a raw string fails at compile time, and
referring to a page that was never declared is a build error.

## 4. Common gotchas

- **Page order.** Cross-page references (`goto(other)`) require `other`
  to be declared before the page that uses it. For self-references, use
  the callback form: `page("start", (self) => [goto(self)])`.
- **Multi-line `gotoScript`.** The server regex rejects line terminators
  in `goto.target`. The DSL flattens comments to block form and joins
  statements with `;`. If you want to preserve the author-written
  formatting of complex logic, put it in a helper function in
  `initExtra` and call the helper from `gotoScript`.
- **Modules.** Enable only what you use. Using `audioPlay` without
  `modules: { audio: true }` is a build error, same for notifications.
- **Assets.** Upload through the platform, export the JSON, and point
  `loadAssets()` at it. See [docs/assets.md](./assets.md).

## 5. A side-by-side minimal port

Before (`story.json`):

```json
{
  "pages": {
    "start": [
      { "prompt": { "variable": "name" } },
      { "say": { "label": "<p>Hello, <eval>name</eval>!</p>" } }
    ]
  },
  "init": "let greetings = 0"
}
```

After (`story.ts`):

```ts
import { build, defineStory, html, page, prompt, say, variable } from "milo-dsl";

const name = variable<string>("name");
const greetings = variable<number>("greetings", { initial: 0 });

const start = page("start", [
  prompt(name),
  say(html.p("Hello, ", html.evalVar(name), "!")),
]);

const story = defineStory({
  variables: [name, greetings],
  pages: [start],
});

export default story;
```

Build with `build(story, registry)` to produce the JSON.
