import {
  COMMAND_BRAND,
  type AssetRegistry,
  type Command,
  type GalleryEntry,
  type FileEntry,
  type Locator,
  type StoryConfig,
  type VarRef,
} from "./types";

type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [k: string]: Json };

export interface BuildOutput {
  pages: Record<string, Json[]>;
  modules: Record<string, object>;
  init?: string;
  galleries: Record<string, GalleryEntry>;
  editor: { recentImages: [] };
  files: Record<string, FileEntry>;
}

// Server constraint: `goto.target`'s `$`-prefixed script form is validated
// against `^\$.*$`, which forbids line terminators. The runtime does not
// expose `eval`/`atob`/`Function` in a way that lets us tunnel multiline
// code, so we flatten in this field only. Author content in `if.condition`,
// `eval.script`, `init`, and `initExtra` is untouched.
export function flattenGotoScript(src: string): string {
  let s = src.replace(/\/\/([^\n]*)\n/g, "/*$1*/;");
  s = s.replace(/\r?\n/g, ";");
  s = s.replace(/;{2,}/g, ";");
  s = s.replace(/^;+|;+$/g, "");
  return s;
}

export function build(
  config: StoryConfig,
  registry: AssetRegistry
): BuildOutput {
  const errors: string[] = [];
  const declaredVars = new Set<string>();
  const declaredPages = new Set<string>();
  for (const v of config.variables ?? []) declaredVars.add(v.name);
  for (const p of config.pages) declaredPages.add(p.id);

  const usedGalleryIds = new Set<string>();
  const usedFileNames = new Set<string>();

  const modules = config.modules ?? {};
  const audioEnabled = !!modules.audio;
  const notificationEnabled = !!modules.notification;

  function err(msg: string) {
    errors.push(msg);
  }

  function serializeLocator(loc: Locator, ctx: string): string {
    switch (loc.kind) {
      case "galleryImage": {
        const g = registry.galleries[loc.galleryId];
        if (!g) {
          err(
            `${ctx}: gallery ${loc.galleryId} not found in registry`
          );
          return `gallery:${loc.galleryId}/?`;
        }
        usedGalleryIds.add(loc.galleryId);
        const img = g.images.find((i) => i.hash === loc.hash);
        if (!img) {
          err(
            `${ctx}: hash ${loc.hash} not found in gallery ${loc.galleryId} (${g.name})`
          );
          return `gallery:${loc.galleryId}/?`;
        }
        if (img.id === 0) {
          err(
            `${ctx}: image with hash ${loc.hash} has id 0 (placeholder upload); re-upload before building`
          );
          return `gallery:${loc.galleryId}/0`;
        }
        return `gallery:${loc.galleryId}/${img.id}`;
      }
      case "galleryRandom": {
        const g = registry.galleries[loc.galleryId];
        if (!g) {
          err(`${ctx}: gallery ${loc.galleryId} not found in registry`);
          return `gallery:${loc.galleryId}/*`;
        }
        usedGalleryIds.add(loc.galleryId);
        return `gallery:${loc.galleryId}/*`;
      }
      case "file": {
        const f = registry.files[loc.name];
        if (!f) {
          err(`${ctx}: file ${JSON.stringify(loc.name)} not found in registry`);
          return `file:${loc.name}`;
        }
        usedFileNames.add(loc.name);
        return `file:${loc.name}`;
      }
      case "filePattern":
        return `file:${loc.pattern}`;
    }
  }

  function checkVarRef(ref: VarRef<unknown>, ctx: string) {
    if (!declaredVars.has(ref.name)) {
      err(
        `${ctx}: variable ${JSON.stringify(ref.name)} is used but not declared in defineStory.variables`
      );
    }
  }

  function checkPageId(id: string, ctx: string) {
    if (!declaredPages.has(id)) {
      err(`${ctx}: page ${JSON.stringify(id)} is referenced but not declared`);
    }
  }

  function serializeCommand(cmd: Command, path: string): Json {
    const kind = cmd[COMMAND_BRAND];
    switch (kind) {
      case "prompt": {
        checkVarRef(cmd.variable, `${path} prompt`);
        return { prompt: { variable: cmd.variable.name } };
      }
      case "say": {
        for (const r of cmd.refs) checkVarRef(r, `${path} say.label`);
        const payload: Record<string, Json> = { label: cmd.label };
        if (cmd.mode) payload.mode = cmd.mode;
        if (cmd.align) payload.align = cmd.align;
        if (cmd.duration) payload.duration = cmd.duration.value;
        if (cmd.allowSkip !== undefined) payload.allowSkip = cmd.allowSkip;
        return { say: payload };
      }
      case "image":
        return {
          image: { locator: serializeLocator(cmd.locator, `${path} image`) },
        };
      case "timer": {
        const payload: Record<string, Json> = {
          duration: cmd.duration.value,
        };
        if (cmd.style) payload.style = cmd.style;
        return { timer: payload };
      }
      case "if": {
        for (const r of cmd.condition.refs) checkVarRef(r, `${path} if.condition`);
        const payload: Record<string, Json> = {
          condition: cmd.condition.source,
          commands: cmd.commands.map((c, i) =>
            serializeCommand(c, `${path} if.commands[${i}]`)
          ),
        };
        if (cmd.elseCommands && cmd.elseCommands.length > 0) {
          payload.elseCommands = cmd.elseCommands.map((c, i) =>
            serializeCommand(c, `${path} if.elseCommands[${i}]`)
          );
        }
        return { if: payload };
      }
      case "choice": {
        return {
          choice: {
            options: cmd.options.map((o, i) => ({
              label: o.label,
              commands: o.commands.map((c, j) =>
                serializeCommand(c, `${path} choice[${i}].commands[${j}]`)
              ),
            })),
          },
        };
      }
      case "goto": {
        if (cmd.pageRef) {
          checkPageId(cmd.pageRef.id, `${path} goto`);
          return { goto: { target: cmd.pageRef.id } };
        }
        if (cmd.script) {
          for (const r of cmd.script.refs) checkVarRef(r, `${path} goto.script`);
          return { goto: { target: "$" + flattenGotoScript(cmd.script.source) } };
        }
        err(`${path} goto: neither pageRef nor script present`);
        return { goto: { target: "" } };
      }
      case "eval":
        for (const r of cmd.script.refs) checkVarRef(r, `${path} eval.script`);
        return { eval: { script: cmd.script.source } };
      case "end":
        return { end: {} };
      case "enable":
        checkPageId(cmd.pageRef.id, `${path} enable`);
        return { enable: { target: cmd.pageRef.id } };
      case "disable":
        checkPageId(cmd.pageRef.id, `${path} disable`);
        return { disable: { target: cmd.pageRef.id } };
      case "notification.create": {
        if (!notificationEnabled) {
          err(
            `${path} notificationCreate: requires modules.notification: true`
          );
        }
        const payload: Record<string, Json> = { title: cmd.title };
        if (cmd.id) payload.id = cmd.id;
        if (cmd.buttonCommands) {
          payload.buttonCommands = cmd.buttonCommands.map((c, i) =>
            serializeCommand(c, `${path} notification.create.buttonCommands[${i}]`)
          );
        }
        if (cmd.buttonLabel) payload.buttonLabel = cmd.buttonLabel;
        return { "notification.create": payload };
      }
      case "notification.remove": {
        if (!notificationEnabled) {
          err(
            `${path} notificationRemove: requires modules.notification: true`
          );
        }
        return { "notification.remove": { id: cmd.id } };
      }
      case "audio.play": {
        if (!audioEnabled) {
          err(`${path} audioPlay: requires modules.audio: true`);
        }
        const payload: Record<string, Json> = {
          locator: serializeLocator(cmd.locator, `${path} audio.play`),
        };
        if (cmd.id) payload.id = cmd.id;
        if (cmd.loops !== undefined) payload.loops = cmd.loops;
        return { "audio.play": payload };
      }
    }
  }

  const pages: Record<string, Json[]> = {};
  for (const page of config.pages) {
    pages[page.id] = page.commands.map((c, i) =>
      serializeCommand(c, `page(${page.id})[${i}]`)
    );
  }

  const modulesOut: Record<string, object> = {};
  if (modules.audio) modulesOut.audio = {};
  if (modules.storage) modulesOut.storage = {};
  if (modules.notification) modulesOut.notification = {};

  const initLines: string[] = [];
  for (const v of config.variables ?? []) {
    if (v.hasInitial) {
      initLines.push(`let ${v.name} = ${JSON.stringify(v.initial)};`);
    }
  }
  let init: string | undefined;
  if (initLines.length > 0 || config.initExtra) {
    const parts: string[] = [];
    if (initLines.length > 0) parts.push(initLines.join("\n"));
    if (config.initExtra) parts.push(config.initExtra.source);
    init = parts.join("\n");
  }

  const emittedGalleries: Record<string, GalleryEntry> = {};
  for (const id of usedGalleryIds) {
    const g = registry.galleries[id];
    if (g) emittedGalleries[id] = g;
  }

  const emittedFiles: Record<string, FileEntry> = {};
  for (const name of usedFileNames) {
    const f = registry.files[name];
    if (f) emittedFiles[name] = f;
  }

  if (errors.length > 0) {
    throw new Error(
      `build failed with ${errors.length} error(s):\n - ` + errors.join("\n - ")
    );
  }

  const out: BuildOutput = {
    pages,
    modules: modulesOut,
    ...(init !== undefined ? { init } : {}),
    galleries: emittedGalleries,
    editor: { recentImages: [] },
    files: emittedFiles,
  } as BuildOutput;

  return out;
}
