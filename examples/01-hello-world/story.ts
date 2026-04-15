import { defineStory, end, page, say } from "../../src";

export default defineStory({
  pages: [
    page("start", [say("Hello, world"), end()]),
  ],
});
