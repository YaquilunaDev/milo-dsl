import {
  JS_BRAND,
  DURATION_BRAND,
  LOCATOR_BRAND,
  PAGE_REF_BRAND,
  VAR_REF_BRAND,
  SOUND_REF_BRAND,
  NOTIFICATION_REF_BRAND,
  HTML_BRAND,
  COMMAND_BRAND,
} from "./internal/brands.js";

export interface Js {
  readonly [JS_BRAND]: true;
  readonly source: string;
  readonly refs: readonly VarRef<unknown>[];
}

export interface Duration {
  readonly [DURATION_BRAND]: true;
  readonly value: string;
}

export type LocatorKind =
  | "galleryImage"
  | "galleryRandom"
  | "file"
  | "filePattern";

export interface GalleryImageLocator {
  readonly [LOCATOR_BRAND]: true;
  readonly kind: "galleryImage";
  readonly galleryId: string;
  readonly hash: string;
}

export interface GalleryRandomLocator {
  readonly [LOCATOR_BRAND]: true;
  readonly kind: "galleryRandom";
  readonly galleryId: string;
}

export interface FileLocator {
  readonly [LOCATOR_BRAND]: true;
  readonly kind: "file";
  readonly name: string;
}

export interface FilePatternLocator {
  readonly [LOCATOR_BRAND]: true;
  readonly kind: "filePattern";
  readonly pattern: string;
}

export type Locator =
  | GalleryImageLocator
  | GalleryRandomLocator
  | FileLocator
  | FilePatternLocator;

export type FileAnyLocator = FileLocator | FilePatternLocator;

export interface PageRef {
  readonly [PAGE_REF_BRAND]: true;
  readonly id: string;
}

export interface VarRef<T> {
  readonly [VAR_REF_BRAND]: true;
  readonly name: string;
  readonly initial?: T;
  readonly hasInitial: boolean;
  readonly __phantom?: T;
}

export interface SoundRef {
  readonly [SOUND_REF_BRAND]: true;
  readonly id: string;
}

export interface NotificationRef {
  readonly [NOTIFICATION_REF_BRAND]: true;
  readonly id: string;
}

export interface Html {
  readonly [HTML_BRAND]: true;
  readonly html: string;
  readonly refs: readonly VarRef<unknown>[];
}

export type Align = "left" | "right";
export type SayMode = "pause" | "instant" | "autoplay" | "custom";
export type TimerStyle = "secret" | "hidden";

export type SayCommand = {
  readonly [COMMAND_BRAND]: "say";
  readonly label: string;
  readonly align?: Align;
  readonly mode?: SayMode;
  readonly duration?: Duration;
  readonly allowSkip?: boolean;
  readonly refs: readonly VarRef<unknown>[];
};

export type ImageCommand = {
  readonly [COMMAND_BRAND]: "image";
  readonly locator: Locator;
};

export type TimerCommand = {
  readonly [COMMAND_BRAND]: "timer";
  readonly duration: Duration;
  readonly style?: TimerStyle;
};

export type IfCommand = {
  readonly [COMMAND_BRAND]: "if";
  readonly condition: Js;
  readonly commands: readonly Command[];
  readonly elseCommands?: readonly Command[];
};

export type ChoiceOption = {
  readonly label: string;
  readonly commands: readonly Command[];
};

export type ChoiceCommand = {
  readonly [COMMAND_BRAND]: "choice";
  readonly options: readonly ChoiceOption[];
};

export type GotoCommand = {
  readonly [COMMAND_BRAND]: "goto";
  readonly pageRef?: PageRef;
  readonly script?: Js;
};

export type EvalCommand = {
  readonly [COMMAND_BRAND]: "eval";
  readonly script: Js;
};

export type EndCommand = {
  readonly [COMMAND_BRAND]: "end";
};

export type EnableCommand = {
  readonly [COMMAND_BRAND]: "enable";
  readonly pageRef: PageRef;
};

export type DisableCommand = {
  readonly [COMMAND_BRAND]: "disable";
  readonly pageRef: PageRef;
};

export type PromptCommand = {
  readonly [COMMAND_BRAND]: "prompt";
  readonly variable: VarRef<unknown>;
};

export type NotificationCreateCommand = {
  readonly [COMMAND_BRAND]: "notification.create";
  readonly title: string;
  readonly id?: string;
  readonly buttonLabel?: string;
  readonly buttonCommands?: readonly Command[];
};

export type NotificationRemoveCommand = {
  readonly [COMMAND_BRAND]: "notification.remove";
  readonly id: string;
};

export type AudioPlayCommand = {
  readonly [COMMAND_BRAND]: "audio.play";
  readonly locator: FileAnyLocator;
  readonly id?: string;
  readonly loops?: number;
};

export type Command =
  | SayCommand
  | ImageCommand
  | TimerCommand
  | IfCommand
  | ChoiceCommand
  | GotoCommand
  | EvalCommand
  | EndCommand
  | EnableCommand
  | DisableCommand
  | PromptCommand
  | NotificationCreateCommand
  | NotificationRemoveCommand
  | AudioPlayCommand;

export type ModulesConfig = {
  audio?: boolean;
  storage?: boolean;
  notification?: boolean;
};

export interface PageRegistration extends PageRef {
  readonly commands: readonly Command[];
}

export interface StoryConfig {
  modules?: ModulesConfig;
  variables?: readonly VarRef<any>[];
  initExtra?: Js;
  pages: readonly PageRegistration[];
}

export interface GalleryImage {
  id: number;
  hash: string;
  size: number;
  width: number;
  height: number;
}

export interface GalleryEntry {
  name: string;
  images: GalleryImage[];
}

export interface FileEntry {
  id: number;
  hash: string;
  size: number;
  type: string;
}

export interface AssetRegistry {
  galleries: Record<string, GalleryEntry>;
  files: Record<string, FileEntry>;
}
