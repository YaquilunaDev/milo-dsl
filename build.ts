import { build, loadAssets } from "./src";
import story from "./examples/demo.story";

const registryPath = "./examples/registry.json";
const outPath = "./out.json";

const assets = await loadAssets(registryPath);
const output = build(story, assets);

await Bun.write(outPath, JSON.stringify(output, null, 2) + "\n");
console.log(`wrote ${outPath}`);
