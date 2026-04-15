# Commands

Every builder returns a `Command` variant. Pages are arrays of commands.

## Output

### `say(label, opts?)`

Emits a line of dialogue or narration.

```ts
say("Hello");                                         // auto-wraps in <p>
say(html.p("Hello, ", html.evalVar(name)));           // explicit HTML
say(html.p("Timed"), { mode: "custom", duration: duration("3s") });
say("Quiet", { mode: "autoplay", allowSkip: true });
```

`opts.mode` accepts `"pause" | "instant" | "autoplay" | "custom"`. The
argument type is a discriminated union, so TS rejects `duration` without
`mode: "custom"` and `allowSkip` on non-autoplay/custom modes.

```json
{ "say": { "label": "<p>Hello</p>" } }
```

### `image(locator)`

Displays an image. `locator` is produced by `gallery(...).image(hash)` or
`gallery(...).random()`.

```ts
const remi = gallery({ id: "UUID", name: "Remi" });
image(remi.image("<sha1>"));
image(remi.random());
```

```json
{ "image": { "locator": "gallery:UUID/12345" } }
{ "image": { "locator": "gallery:UUID/*" } }
```

### `timer(duration, opts?)`

Displays a countdown. `opts.style` is `"secret" | "hidden"` (both optional;
omitted means visible).

```ts
timer(duration("10s"));
timer(duration("1.1s-8.1s"));
timer(duration("5s"), { style: "secret" });
```

## Control flow

### `ifCmd(condition, commands, elseCommands?)`

```ts
ifCmd(js`${score} > 10`, [say("High score!")], [say("Try again.")]);
```

`condition` is a `js` template; elseCommands is optional.

### `choice(options)` and `option(label, commands)`

```ts
choice([
  option("Yes", [goto(good)]),
  option("No", [goto(bad)]),
]);
```

### `goto(pageRef)` and `gotoScript(js`...`)`

Plain jump:

```ts
goto(someOtherPage);
```

Scripted target (runs JS to decide where to go):

```ts
gotoScript(js`pages.goto('somePage'); pages.disable('start')`);
```

Multi-line content is flattened at build time (required by the server's
single-line target regex). See `docs/js-scope.md`.

### `enable(pageRef)` / `disable(pageRef)` / `end()`

```ts
enable(somePage);
disable(somePage);
end();
```

## Input

### `prompt(varRef)`

Captures free-form text into a declared variable.

```ts
const name = variable<string>("name");
prompt(name);
```

## Side effects

### `evalCmd(js`...`)`

Runs arbitrary JS against the runtime scope. Multi-line allowed; comments
pass through verbatim.

```ts
evalCmd(js`
  // stash the current page id
  teaseStorage.setItem("lastPage", pages.getCurrentPageId());
`);
```

### `audioPlay({ locator, id?, loops? })`

Requires `modules.audio: true`. Pass `file("name.mp3")` or
`file.pattern("*.mp3")`. When `id` is provided, the return value carries
a `.ref: SoundRef` you can interpolate into later `js` blocks.

```ts
const bg = audioPlay({
  locator: file("bgm.mp3"),
  id: "bgm",
  loops: 1,
});
// later:
evalCmd(js`Sound.get(${bg.ref}).pause()`);
```

### `notificationCreate({ title, id?, buttonLabel?, buttonCommands? })`

Requires `modules.notification: true`. With an `id`, returns a
`.ref: NotificationRef` usable by `notificationRemove`.

```ts
const toast = notificationCreate({
  title: "Hi!",
  id: "greet",
  buttonLabel: "Dismiss",
  buttonCommands: [say("thanks!")],
});
// later:
notificationRemove(toast.ref);
```

### `notificationRemove(ref)`

Takes the `ref` from a `notificationCreate(...)` call. Calling it on a
notification that was created without an `id` is a compile error.

## See also

- [docs/variables.md](./variables.md)
- [docs/js-scope.md](./js-scope.md)
- [docs/assets.md](./assets.md)
