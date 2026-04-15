# Asset workflow

Galleries and files are uploaded and managed through the platform's web
editor. The DSL does not upload anything; it references assets by
content-addressed hash (for gallery images) and by name (for files), and
resolves those references at build time against a registry you export
from the platform.

## End-to-end loop

1. **Upload** images and audio through the platform editor.
2. **Export** the platform's JSON. Its `galleries` and `files` sections
   now contain every uploaded asset with its server-assigned id, SHA-1
   hash, size, and (for images) dimensions.
3. **Save that file** somewhere the DSL build can read it (commonly
   `registry.json` in the project root or next to the story).
4. **Reference by hash / name** in the DSL.
5. **Build.** `build(config, registry)` resolves every locator and errors
   on anything it can't find.

```ts
const remi = gallery({ id: "12fb05bc-...", name: "Remi" });
image(remi.image("131e51ea87d7195f13df41f6babae33fbe6b2d3c"));
image(remi.random());
audioPlay({ locator: file("bgm.mp3") });
audioPlay({ locator: file.pattern("*.mp3") });
```

## Why hash, not id

The platform assigns integer ids on upload. They are not content-stable:
re-uploading the same image gets a new id. Hashes are content-stable, so
the DSL uses them as the key and resolves to id at build time.

## Registry shape

A subset of the platform's exported JSON:

```json
{
  "galleries": {
    "<uuid>": {
      "name": "Remi",
      "images": [
        { "id": 4010266, "hash": "131e51ea...", "size": 252250, "width": 853, "height": 1280 }
      ]
    }
  },
  "files": {
    "bgm.mp3": {
      "id": 4010358,
      "hash": "dcaa8815...",
      "size": 733645,
      "type": "audio/mpeg"
    }
  }
}
```

You can either hand-trim the exported JSON to just these two sections, or
point `loadAssets()` at the full export (it only reads `galleries` and
`files`).

## `loadAssets(path)`

```ts
import { loadAssets, build } from "milo-dsl";

const assets = await loadAssets("./registry.json");
const output = build(story, assets);
```

Uses `Bun.file(path).json()` under the hood.

## Error cases

`build()` aggregates errors and throws once with every failure it found:

- **Unknown gallery uuid** - the locator's gallery is not in the registry.
- **Unknown image hash** - the hash is not present in the named gallery.
- **Unknown file name** - `file(name)` points at a file the registry
  doesn't list.
- **Image id 0** - the registry entry exists but its id is `0`, which
  means the platform received the upload but has not finished processing
  it. Re-export the registry after the upload completes.

Patterns (`file.pattern("*.mp3")`) and gallery randoms (`remi.random()`)
are not validated against the registry; they are opaque globs and the
runtime resolves them.

## Emitted asset sections

`build()` only emits asset entries that the story actually references.
Unused galleries and files stay out of the output. Random-gallery usage
does pull in the gallery's full image list, matching the platform's
export behavior.
