import { build, loadAssets } from "../../src";
import story from "./story";

// The 03-assets example reuses the 04-full-tour registry to avoid duplicating
// the full asset slice. Point this at your own exported registry in practice.
const assets = await loadAssets("./examples/04-full-tour/registry.json");
const output = build(story, assets);
await Bun.write(
  "./examples/03-assets/out.json",
  JSON.stringify(output, null, 2) + "\n"
);
console.log("wrote examples/03-assets/out.json");
