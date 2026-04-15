import { build, loadAssets } from "../../src";
import story from "./story";

const assets = await loadAssets("./examples/04-full-tour/registry.json");
const output = build(story, assets);
await Bun.write(
  "./examples/04-full-tour/out.json",
  JSON.stringify(output, null, 2) + "\n"
);
console.log("wrote examples/04-full-tour/out.json");
