import {
  audioPlay,
  defineStory,
  end,
  file,
  gallery,
  image,
  page,
  say,
} from "../../src";

const remi = gallery({
  id: "12fb05bc-9183-4826-93f3-150a674a228e",
  name: "Remi",
});

export default defineStory({
  modules: { audio: true },
  pages: [
    page("start", [
      say("Specific image by hash:"),
      image(remi.image("131e51ea87d7195f13df41f6babae33fbe6b2d3c")),
      say("Random image from the gallery:"),
      image(remi.random()),
      audioPlay({ locator: file("file-example-mp3-700kb.mp3"), loops: 1 }),
      end(),
    ]),
  ],
});
