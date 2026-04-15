// Entry & build pipeline.
export { defineStory } from "./story.js";
export { build } from "./build.js";
export { loadAssets } from "./registry.js";

// Authoring primitives.
export { page } from "./page.js";
export { variable } from "./variables.js";
export { gallery, file } from "./locator.js";
export { duration, seconds, minutes } from "./duration.js";
export { js } from "./js.js";
export { html } from "./html.js";

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
} from "./commands.js";

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
} from "./types.js";

export type {
  AudioPlayOpts,
  AudioPlayOptsWithId,
  AudioPlayResult,
  NotificationCreateOpts,
  NotificationCreateOptsWithId,
  NotificationCreateResult,
  SayOpts,
} from "./commands.js";

export type { SayLabel, HtmlChild } from "./html.js";
export type { VariableOptions } from "./variables.js";
export type { GalleryHandle, GalleryOptions } from "./locator.js";
export type { PageCommands } from "./page.js";
export type { BuildOutput } from "./build.js";
