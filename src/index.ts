// Entry & build pipeline.
export { defineStory } from "./story";
export { build } from "./build";
export { loadAssets } from "./registry";

// Authoring primitives.
export { page } from "./page";
export { variable } from "./variables";
export { gallery, file } from "./locator";
export { duration, seconds, minutes } from "./duration";
export { js } from "./js";
export { html } from "./html";

// Command builders.
export {
  say,
  image,
  timer,
  ifCmd,
  choice,
  option,
  goto,
  gotoScript,
  evalCmd,
  end,
  enable,
  disable,
  prompt,
  audioPlay,
  notificationCreate,
  notificationRemove,
} from "./commands";

// Public types.
export type {
  Align,
  AssetRegistry,
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
  FileEntry,
  FileLocator,
  FilePatternLocator,
  GalleryEntry,
  GalleryImage,
  GalleryImageLocator,
  GalleryRandomLocator,
  GotoCommand,
  Html,
  IfCommand,
  ImageCommand,
  Js,
  Locator,
  LocatorKind,
  ModulesConfig,
  NotificationCreateCommand,
  NotificationRef,
  NotificationRemoveCommand,
  PageRef,
  PageRegistration,
  PromptCommand,
  SayCommand,
  SayMode,
  SoundRef,
  StoryConfig,
  TimerCommand,
  TimerStyle,
  VarRef,
} from "./types";

export type {
  AudioPlayOpts,
  AudioPlayOptsWithId,
  AudioPlayResult,
  NotificationCreateOpts,
  NotificationCreateOptsWithId,
  NotificationCreateResult,
  SayOpts,
} from "./commands";

export type { SayLabel, HtmlChild } from "./html";
export type { VariableOptions } from "./variables";
export type { GalleryHandle, GalleryOptions } from "./locator";
export type { PageCommands } from "./page";
export type { BuildOutput } from "./build";
