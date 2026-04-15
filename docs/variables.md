# Variables

Every variable used at runtime must be declared through `variable<T>()`
and registered in `defineStory({ variables })`. Forgetting to register a
variable that is referenced elsewhere is a build error.

## Declaring

```ts
// Prompt-captured: no initial value.
const name = variable<string>("name");

// Init-declared: initial value set by defineStory's auto-generated init.
const greetings = variable<number>("greetings", { initial: 0 });
```

`T` is a phantom type. The PoC supports primitives only (`string`,
`number`, `boolean`, `null`) because values are emitted via
`JSON.stringify`.

## Registering

```ts
defineStory({
  variables: [name, greetings],
  pages: [...],
});
```

Any variable referenced by `prompt`, by `js`...``, or by `html.evalVar`
but not present in this list throws a build error identifying the site.

## Init block

`build()` auto-generates the `init` JS string from registered variables
that have an `initial` value:

```js
const greetings = 0;
```

Declarations use `const` because the runtime only honors constants in the
`init` block; `let` bindings don't propagate to the scope used by
`if.condition`, `eval.script`, and friends. If you need a mutable counter
or flag, declare it through `initExtra` instead (see below) and mutate it
from an `evalCmd`.

If you need more setup (setting up `teaseStorage` keys, bootstrapping
derived state), append `initExtra`:

```ts
defineStory({
  variables: [greetings],
  initExtra: js`
    if (!teaseStorage.getItem("first")) {
      teaseStorage.setItem("first", new Date().toISOString());
    }
  `,
  pages: [...],
});
```

Output `init` becomes the auto-generated lines followed by `initExtra`.

## Using in expressions

### Inside `js`...`` (for `if`, `eval`, `gotoScript`)

A `VarRef` interpolated into a `js` template renders as the bare
identifier:

```ts
ifCmd(js`${name} == "stop"`, [...], [...]);
// condition: `name == "stop"`
```

### Inside `say(...)` labels

Use `html.evalVar(ref)` for substitution into dialogue:

```ts
say(html.p("Welcome, ", html.evalVar(name), "!"));
// <p>Welcome, <eval>name</eval>!</p>
```

`html.evalExpr(js`...`)` lets you embed an arbitrary JS expression:

```ts
say(html.p("Greetings: ", html.evalExpr(js`${greetings} + 1`)));
// <p>Greetings: <eval>greetings + 1</eval></p>
```

### Inside `prompt(...)`

`prompt(name)` writes the user's input into `name`:

```ts
prompt(name);                     // { "prompt": { "variable": "name" } }
say(html.p("Hi, ", html.evalVar(name)));
```

## Scope

Variables live in the runtime's JS scope and are mutated by normal JS
assignment inside `evalCmd` or `gotoScript`. They are not session-scoped
in the DSL sense; persistence across sessions is the runtime's concern
(use `teaseStorage` for that; see [docs/js-scope.md](./js-scope.md)).
