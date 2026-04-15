import { build } from "../../src";
import story from "./story";

const output = build(story, { galleries: {}, files: {} });
await Bun.write(
  "./examples/02-variables-and-conditions/out.json",
  JSON.stringify(output, null, 2) + "\n"
);
console.log("wrote examples/02-variables-and-conditions/out.json");
