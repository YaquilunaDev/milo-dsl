import {
  audioPlay,
  choice,
  defineStory,
  disable,
  duration,
  enable,
  end,
  evalCmd,
  file,
  gallery,
  goto,
  gotoScript,
  html,
  ifCmd,
  image,
  js,
  notificationCreate,
  notificationRemove,
  option,
  page,
  prompt,
  say,
  timer,
  variable,
} from "../src";

const userInputVar = variable<string>("userInputVar");
const testYes = variable<string>("testYes", { initial: "test" });

const remi = gallery({
  id: "12fb05bc-9183-4826-93f3-150a674a228e",
  name: "Remi",
});

const page1 = page("page1", [image(remi.random())]);

const notif = notificationCreate({
  title: "Test Notifcation with Java Script Identifier",
  id: "myFunnyUserGivenIdentifier",
});

const start = page("start", (self) => [
  prompt(userInputVar),
  say([html.p("Test 123 ", html.evalVar(userInputVar))]),
  ifCmd(
    js`// This is a JS 'condition' block where
// Info from the page:
// "The If action evaluates a JavaScript boolean expression and if true, executes a set of commands.""
${userInputVar} == "yaaas"`,
    [say(html.p("Okay boomer"))],
    [say(html.p("Cringe"))]
  ),
  image(remi.image("131e51ea87d7195f13df41f6babae33fbe6b2d3c")),
  say(html.p("TestMessageCentered")),
  say(html.p("TestMessageLeft"), { align: "left" }),
  say(html.p("TestMessageRight"), { align: "right" }),
  say(html.p("TestMessagePause"), { mode: "pause" }),
  say(html.p("TestMessageInstant"), { mode: "instant" }),
  say(html.p("TestMessageAutoPlayNoSkip"), { mode: "autoplay" }),
  say(html.p("TestMessageAutoPlayerSkip"), { mode: "autoplay", allowSkip: true }),
  say(html.p("TestMessageAutoPlayCustomNoSkip"), {
    mode: "custom",
    duration: duration("2m40s"),
  }),
  say(html.p("TestMessageAutoPlayCustomSkip"), {
    mode: "custom",
    duration: duration("1m"),
    allowSkip: true,
  }),
  timer(duration("10s")),
  timer(duration("1.1s-8.1s")),
  timer(duration("10s"), { style: "secret" }),
  timer(duration("10s"), { style: "hidden" }),
  timer(duration("3s-22s"), { style: "secret" }),
  choice([
    option("Button 1", [goto(self)]),
    option("Button 2", [image(remi.random()), say(html.p("Inside Choice Say"))]),
  ]),
  end(),
  goto(page1),
  gotoScript(js`// This is a code block
pages.goto('page1')
pages.disable('start')`),
  say(html.p(html.bold("Bold"))),
  say(html.p(html.italic("Italic"))),
  say(
    html.p(
      html.color("#26a69a", "Text Color "),
      html.color("#e64a19", "Text Color 2")
    )
  ),
  say(html.p(html.underline("Underline"))),
  evalCmd(js`// Java Script Code
// Available Page functions
// This is a code block
pages.getCurrentPageId()
pages.disable('page1')
pages.dispatchEvent('')
pages.enable("user defined pageID")
pages.goto('user defined pageID')
pages.isEnabled("pageID")
// pages.removeEventListener('event type, ) (IDK HOW IT WORKS)
// Sound API
Sound.get('SoundID')`),
  enable(page1),
  disable(page1),
  notificationCreate({ title: "Test Notifcation" }),
  notif,
  notificationCreate({
    title: "Test with Button",
    buttonCommands: [
      image(remi.image("2affb51808fabb6ece046cf7690ef58788bf6d86")),
      say(html.p("Test say in notifcation")),
    ],
    buttonLabel: "Button Lable",
  }),
  notificationRemove(notif.ref),
  audioPlay({ locator: file.pattern("*.mp3"), id: "randomSound" }),
  audioPlay({ locator: file("file-example-mp3-700kb.mp3"), loops: 5 }),
]);

// initExtra is appended after the auto-generated `let testYes = "test";` line.
// The input JSON's init block has a leading comment instead; per DSL design we
// emit variable decls canonically and accept this structural difference.

export default defineStory({
  modules: { audio: true, storage: true, notification: true },
  variables: [userInputVar, testYes],
  pages: [start, page1],
});
