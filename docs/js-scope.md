# Embedded JS scope

The runtime evaluates JS strings from `if.condition`, `eval.script`,
`goto.target` (`$`-prefixed form), `init`, and `<eval>…</eval>` tags
inside `say.label`. The DSL does not model the runtime's API as typed
objects; you reach them through `js`...`` templates.

## What's in scope

### `pages`

Page manipulation, always available.

- `pages.goto(id: string): void`
- `pages.enable(id: string): void`
- `pages.disable(id: string): void`
- `pages.isEnabled(id: string): boolean`
- `pages.getCurrentPageId(): string`
- `pages.dispatchEvent(type: string): void`

### `Sound` (requires `modules.audio: true`)

Access handles for sounds started via `audioPlay({ id: ... })`.

- `Sound.get(id: string)` returns a sound handle.

### `teaseStorage` (requires `modules.storage: true`)

Persistent key-value storage (localStorage-like).

- `teaseStorage.getItem(key: string): string | null`
- `teaseStorage.setItem(key: string, value: string): void`

Note: the DSL cannot statically check that `teaseStorage` is only used
when enabled, because it only appears inside opaque JS strings.

### Variables

Every variable registered via `defineStory({ variables: [...] })` is
available by bare name inside any JS context.

## Interpolation rules

| Interpolated value | Renders as                    | Example                   |
|-------------------|-------------------------------|---------------------------|
| `VarRef<T>`       | bare identifier               | `userInput`               |
| `PageRef`         | JSON string literal           | `"start"`                 |
| `SoundRef`        | JSON string literal           | `"bgm"`                   |
| `NotificationRef` | JSON string literal           | `"toast"`                 |
| `string`          | JSON.stringify                | `"hi \"there\""`          |
| `number`          | numeric literal               | `42`                      |
| `boolean`         | `true` / `false`              | `true`                    |
| `null`            | `null`                        | `null`                    |
| another `js`      | raw source (refs propagate)   | `<nested>`                |
| anything else     | build-time error              | (caught eagerly)          |

Comments and whitespace pass through verbatim.

## Expressions vs scripts

The runtime does not distinguish. `if.condition` is normally an
expression, `eval.script` normally a series of statements, but the DSL
uses the same `js` tag for both. Authors decide which shape makes sense
per call site.

## The `gotoScript` flatten

`goto.target`'s `$`-script form is validated by the server against
`^\$.*$`, which forbids line terminators. The DSL flattens this field
only:

- `// comment\n` becomes `/* comment */;`
- remaining newlines become `;`
- repeated `;` collapse, leading/trailing `;` trim.

All other JS contexts are verbatim. If you need multi-statement `goto`
targets, prefer calling a helper declared in `initExtra`:

```ts
defineStory({
  initExtra: js`
    function gotoPage1AndDisableStart() {
      pages.goto('page1');
      pages.disable('start');
    }
  `,
  pages: [
    page("start", [gotoScript(js`gotoPage1AndDisableStart()`)]),
  ],
});
```

## Common patterns

### Branching on variable equality

```ts
ifCmd(js`${answer} == "yes"`, [...], [...]);
```

### Persistent counter

```ts
const count = variable<number>("count", { initial: 0 });

evalCmd(js`
  ${count} = ${count} + 1;
  teaseStorage.setItem("count", String(${count}));
`);
```

### Pausing a named sound

```ts
const bgm = audioPlay({ locator: file("bgm.mp3"), id: "bgm", loops: 1 });
// later:
evalCmd(js`Sound.get(${bgm.ref}).pause()`);
```

### Checking if a page is enabled

```ts
ifCmd(js`pages.isEnabled(${someOtherPage})`, [goto(someOtherPage)]);
```
