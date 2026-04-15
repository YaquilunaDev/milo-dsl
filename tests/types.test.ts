import { test, expect } from "bun:test";
import {
  goto,
  notificationCreate,
  notificationRemove,
  page,
  prompt,
  say,
  variable,
} from "../src";

// These are TYPE-LEVEL assertions. The `if (false)` wrapper keeps the bad
// calls from executing at runtime while still letting `tsc --noEmit` verify
// that every `@ts-expect-error` is actually an error.
test("type-level: @ts-expect-error sites are flagged by tsc", () => {
  if (false as boolean) {
    // 1. goto() rejects raw strings.
    // @ts-expect-error raw string is not a PageRef
    goto("start");

    // 2. notificationRemove() rejects a notif made without an id.
    const noIdNotif = notificationCreate({ title: "x" });
    // @ts-expect-error `ref` does not exist on a no-id notification
    notificationRemove(noIdNotif.ref);

    // 3. prompt rejects non-VarRef.
    // @ts-expect-error raw string is not a VarRef
    prompt("foo");

    // 4. say rejects duration without custom mode.
    // @ts-expect-error duration only valid with mode:"custom"
    say("hi", { mode: "instant", duration: { value: "1s" } as any });

    // 5. say rejects allowSkip with mode:"pause".
    // @ts-expect-error allowSkip only valid with mode:"autoplay"|"custom"
    say("hi", { mode: "pause", allowSkip: true });

    // 6. page is a PageRef and goto accepts it directly.
    const p = page("p", []);
    goto(p); // ok

    // 7. variable<T> carries T so .initial is typed.
    const n = variable<number>("n", { initial: 1 });
    // @ts-expect-error number does not assign to string
    const ignore: string = n.initial as number;
    void ignore;
  }

  expect(true).toBe(true);
});
