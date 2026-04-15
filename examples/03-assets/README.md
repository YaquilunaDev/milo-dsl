# 03 - assets

Gallery image by hash, random image from a gallery, and audio playback
against a named file. Uses the registry exported from the platform to
resolve hash → server-assigned id at build time.

This example reuses `04-full-tour/registry.json` so it doesn't duplicate
the asset slice. In your own project, point `loadAssets()` at the JSON you
exported from the platform.

## Run

```bash
bun run examples/03-assets/build.ts
```
