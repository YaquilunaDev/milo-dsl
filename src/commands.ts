import {
  COMMAND_BRAND,
  NOTIFICATION_REF_BRAND,
  SOUND_REF_BRAND,
} from "./internal/brands.js";
import {
  isJs,
  isLocator,
  isDuration,
  isPageRef,
  isVarRef,
  isNotificationRef,
} from "./internal/guards.js";
import type {
  AudioPlayCommand,
  ChoiceCommand,
  ChoiceOption,
  Command,
  DisableCommand,
  Duration,
  EnableCommand,
  EndCommand,
  EvalCommand,
  FileAnyLocator,
  GotoCommand,
  IfCommand,
  ImageCommand,
  Js,
  Locator,
  NotificationCreateCommand,
  NotificationRef,
  NotificationRemoveCommand,
  PageRef,
  PromptCommand,
  SayCommand,
  SayMode,
  SoundRef,
  TimerCommand,
  TimerStyle,
  VarRef,
} from "./types.js";
import { normalizeLabel, type SayLabel } from "./html.js";

export type SayOpts =
  | { align?: "left" | "right" }
  | { align?: "left" | "right"; mode: "pause" | "instant" }
  | { align?: "left" | "right"; mode: "autoplay"; allowSkip?: boolean }
  | {
      align?: "left" | "right";
      mode: "custom";
      duration: Duration;
      allowSkip?: boolean;
    };

export function say(label: SayLabel, opts?: SayOpts): SayCommand {
  const { label: normalized, refs } = normalizeLabel(label);
  const o = (opts ?? {}) as {
    align?: "left" | "right";
    mode?: SayMode;
    duration?: Duration;
    allowSkip?: boolean;
  };
  const cmd: SayCommand = {
    [COMMAND_BRAND]: "say",
    label: normalized,
    refs,
    ...(o.align ? { align: o.align } : {}),
    ...(o.mode ? { mode: o.mode } : {}),
    ...(o.duration ? { duration: o.duration } : {}),
    ...(o.allowSkip !== undefined ? { allowSkip: o.allowSkip } : {}),
  };
  return cmd;
}

export function image(locator: Locator): ImageCommand {
  if (!isLocator(locator)) {
    throw new Error("image(): argument must be a Locator");
  }
  return { [COMMAND_BRAND]: "image", locator };
}

export function timer(
  dur: Duration,
  opts?: { style?: TimerStyle }
): TimerCommand {
  if (!isDuration(dur)) {
    throw new Error("timer(): first argument must be a Duration");
  }
  return {
    [COMMAND_BRAND]: "timer",
    duration: dur,
    ...(opts?.style ? { style: opts.style } : {}),
  };
}

export function ifCmd(
  condition: Js,
  commands: readonly Command[],
  elseCommands?: readonly Command[]
): IfCommand {
  if (!isJs(condition)) {
    throw new Error("ifCmd(): condition must be a Js value (js`...`)");
  }
  return {
    [COMMAND_BRAND]: "if",
    condition,
    commands,
    ...(elseCommands && elseCommands.length > 0 ? { elseCommands } : {}),
  };
}

export function option(
  label: string,
  commands: readonly Command[]
): ChoiceOption {
  return { label, commands };
}

export function choice(options: readonly ChoiceOption[]): ChoiceCommand {
  if (options.length === 0) {
    throw new Error("choice(): at least one option required");
  }
  return { [COMMAND_BRAND]: "choice", options };
}

export function goto(pageRef: PageRef): GotoCommand {
  if (!isPageRef(pageRef)) {
    throw new Error("goto(): argument must be a PageRef from page()");
  }
  return { [COMMAND_BRAND]: "goto", pageRef };
}

export function gotoScript(script: Js): GotoCommand {
  if (!isJs(script)) {
    throw new Error("gotoScript(): argument must be a Js value (js`...`)");
  }
  return { [COMMAND_BRAND]: "goto", script };
}

export function evalCmd(script: Js): EvalCommand {
  if (!isJs(script)) {
    throw new Error("evalCmd(): argument must be a Js value (js`...`)");
  }
  return { [COMMAND_BRAND]: "eval", script };
}

export function end(): EndCommand {
  return { [COMMAND_BRAND]: "end" };
}

export function enable(pageRef: PageRef): EnableCommand {
  if (!isPageRef(pageRef)) {
    throw new Error("enable(): argument must be a PageRef from page()");
  }
  return { [COMMAND_BRAND]: "enable", pageRef };
}

export function disable(pageRef: PageRef): DisableCommand {
  if (!isPageRef(pageRef)) {
    throw new Error("disable(): argument must be a PageRef from page()");
  }
  return { [COMMAND_BRAND]: "disable", pageRef };
}

export function prompt<T>(variable: VarRef<T>): PromptCommand {
  if (!isVarRef(variable)) {
    throw new Error("prompt(): argument must be a VarRef from variable()");
  }
  return { [COMMAND_BRAND]: "prompt", variable };
}

export interface NotificationCreateOpts {
  title: string;
  buttonLabel?: string;
  buttonCommands?: readonly Command[];
}

export interface NotificationCreateOptsWithId extends NotificationCreateOpts {
  id: string;
}

export type NotificationCreateResult = NotificationCreateCommand & {
  ref: NotificationRef;
};

export function notificationCreate(
  opts: NotificationCreateOptsWithId
): NotificationCreateResult;
export function notificationCreate(
  opts: NotificationCreateOpts
): NotificationCreateCommand;
export function notificationCreate(
  opts: NotificationCreateOpts & { id?: string }
): NotificationCreateCommand {
  if (!opts.title) {
    throw new Error("notificationCreate(): title is required");
  }
  const base: NotificationCreateCommand = {
    [COMMAND_BRAND]: "notification.create",
    title: opts.title,
    ...(opts.id ? { id: opts.id } : {}),
    ...(opts.buttonLabel ? { buttonLabel: opts.buttonLabel } : {}),
    ...(opts.buttonCommands ? { buttonCommands: opts.buttonCommands } : {}),
  };
  if (opts.id) {
    const ref: NotificationRef = {
      [NOTIFICATION_REF_BRAND]: true,
      id: opts.id,
    };
    return Object.assign({}, base, { ref });
  }
  return base;
}

export function notificationRemove(
  ref: NotificationRef
): NotificationRemoveCommand {
  if (!isNotificationRef(ref)) {
    throw new Error(
      "notificationRemove(): argument must be a NotificationRef. " +
        "Only notificationCreate() calls with an `id` produce one."
    );
  }
  return { [COMMAND_BRAND]: "notification.remove", id: ref.id };
}

export interface AudioPlayOpts {
  locator: FileAnyLocator;
  loops?: number;
}

export interface AudioPlayOptsWithId extends AudioPlayOpts {
  id: string;
}

export type AudioPlayResult = AudioPlayCommand & { ref: SoundRef };

export function audioPlay(opts: AudioPlayOptsWithId): AudioPlayResult;
export function audioPlay(opts: AudioPlayOpts): AudioPlayCommand;
export function audioPlay(
  opts: AudioPlayOpts & { id?: string }
): AudioPlayCommand {
  if (!isLocator(opts.locator)) {
    throw new Error("audioPlay(): locator must be a file locator");
  }
  if (opts.locator.kind !== "file" && opts.locator.kind !== "filePattern") {
    throw new Error(
      "audioPlay(): locator must come from file(...) or file.pattern(...)"
    );
  }
  const base: AudioPlayCommand = {
    [COMMAND_BRAND]: "audio.play",
    locator: opts.locator,
    ...(opts.id ? { id: opts.id } : {}),
    ...(opts.loops !== undefined ? { loops: opts.loops } : {}),
  };
  if (opts.id) {
    const ref: SoundRef = { [SOUND_REF_BRAND]: true, id: opts.id };
    return Object.assign({}, base, { ref });
  }
  return base;
}
