import {
  JS_BRAND,
  DURATION_BRAND,
  LOCATOR_BRAND,
  PAGE_REF_BRAND,
  VAR_REF_BRAND,
  SOUND_REF_BRAND,
  NOTIFICATION_REF_BRAND,
  HTML_BRAND,
} from "./brands";
import type {
  Js,
  Duration,
  Locator,
  PageRef,
  VarRef,
  SoundRef,
  NotificationRef,
  Html,
} from "../types";

export function isJs(v: unknown): v is Js {
  return typeof v === "object" && v !== null && (v as any)[JS_BRAND] === true;
}
export function isVarRef(v: unknown): v is VarRef<unknown> {
  return (
    typeof v === "object" && v !== null && (v as any)[VAR_REF_BRAND] === true
  );
}
export function isSoundRef(v: unknown): v is SoundRef {
  return (
    typeof v === "object" && v !== null && (v as any)[SOUND_REF_BRAND] === true
  );
}
export function isNotificationRef(v: unknown): v is NotificationRef {
  return (
    typeof v === "object" &&
    v !== null &&
    (v as any)[NOTIFICATION_REF_BRAND] === true
  );
}
export function isPageRef(v: unknown): v is PageRef {
  return (
    typeof v === "object" && v !== null && (v as any)[PAGE_REF_BRAND] === true
  );
}
export function isHtml(v: unknown): v is Html {
  return typeof v === "object" && v !== null && (v as any)[HTML_BRAND] === true;
}
export function isLocator(v: unknown): v is Locator {
  return (
    typeof v === "object" && v !== null && (v as any)[LOCATOR_BRAND] === true
  );
}
export function isDuration(v: unknown): v is Duration {
  return (
    typeof v === "object" && v !== null && (v as any)[DURATION_BRAND] === true
  );
}
