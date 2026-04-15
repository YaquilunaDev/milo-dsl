import { build } from "../../src";
import story from "./story";

const output = build(story, { galleries: {}, files: {} });
await Bun.write(
  "./examples/01-hello-world/out.json",
  JSON.stringify(output, null, 2) + "\n"
);
console.log("wrote examples/01-hello-world/out.json");
