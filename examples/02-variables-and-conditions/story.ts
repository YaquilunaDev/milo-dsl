import {
  defineStory,
  end,
  goto,
  html,
  ifCmd,
  js,
  page,
  prompt,
  say,
  variable,
} from "../../src";

const name = variable<string>("name");
const greetings = variable<number>("greetings", { initial: 0 });

const bye = page("bye", [say(html.p("Goodbye, ", html.evalVar(name))), end()]);

const start = page("start", (self) => [
  prompt(name),
  say(html.p("Hello, ", html.evalVar(name), "!")),
  ifCmd(
    js`${name} == "stop"`,
    [goto(bye)],
    [say(html.p("You have greeted me ", html.evalVar(greetings), " times.")), goto(self)]
  ),
]);

export default defineStory({
  variables: [name, greetings],
  pages: [start, bye],
});
