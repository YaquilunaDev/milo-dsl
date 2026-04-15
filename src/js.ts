import { JS_BRAND } from "./internal/brands";
import {
  isVarRef,
  isSoundRef,
  isNotificationRef,
  isPageRef,
  isJs,
} from "./internal/guards";
import type { Js, VarRef } from "./types";

function renderValue(v: unknown, refs: VarRef<unknown>[]): string {
  if (isVarRef(v)) {
    refs.push(v);
    return v.name;
  }
  if (isSoundRef(v)) return JSON.stringify(v.id);
  if (isNotificationRef(v)) return JSON.stringify(v.id);
  if (isPageRef(v)) return JSON.stringify(v.id);
  if (isJs(v)) {
    for (const r of v.refs) refs.push(r);
    return v.source;
  }
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "number") {
    if (!Number.isFinite(v)) {
      throw new Error(`js\`\` interpolation: non-finite number ${v}`);
    }
    return String(v);
  }
  if (typeof v === "boolean") return v ? "true" : "false";
  if (v === null) return "null";
  if (v === undefined) {
    throw new Error(
      "js`` interpolation: undefined value. If you meant a variable reference, pass a VarRef."
    );
  }
  throw new Error(
    `js\`\` interpolation: unsupported type ${Object.prototype.toString.call(v)}. ` +
      "Allowed: VarRef, SoundRef, NotificationRef, PageRef, Js, string, number, boolean, null."
  );
}

export function js(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Js {
  let out = "";
  const refs: VarRef<unknown>[] = [];
  for (let i = 0; i < strings.length; i++) {
    out += strings[i];
    if (i < values.length) out += renderValue(values[i], refs);
  }
  return { [JS_BRAND]: true, source: out, refs };
}

export function rawJs(source: string): Js {
  return { [JS_BRAND]: true, source, refs: [] };
}
