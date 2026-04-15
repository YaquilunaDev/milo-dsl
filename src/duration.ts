import { DURATION_BRAND } from "./internal/brands.js";
import type { Duration } from "./types.js";

const UNIT_RE = /^(\d+(?:\.\d+)?)(ms|s|m|h)$/;
const COMPOSITE_RE =
  /^(?:(\d+(?:\.\d+)?)h)?(?:(\d+(?:\.\d+)?)m)?(?:(\d+(?:\.\d+)?)s)?(?:(\d+(?:\.\d+)?)ms)?$/;

function isValidSingle(s: string): boolean {
  if (UNIT_RE.test(s)) return true;
  if (s === "") return false;
  return COMPOSITE_RE.test(s) && /\d/.test(s);
}

function brand(value: string): Duration {
  return { [DURATION_BRAND]: true, value };
}

export function duration(value: string): Duration {
  const [a, b, ...rest] = value.split("-");
  if (rest.length > 0) {
    throw new Error(`duration(): invalid format ${JSON.stringify(value)}`);
  }
  if (b !== undefined) {
    if (!isValidSingle(a!) || !isValidSingle(b)) {
      throw new Error(
        `duration(): invalid range ${JSON.stringify(value)}`
      );
    }
    return brand(`${a}-${b}`);
  }
  if (!isValidSingle(a!)) {
    throw new Error(`duration(): invalid format ${JSON.stringify(value)}`);
  }
  return brand(a!);
}

duration.range = function range(from: string, to: string): Duration {
  if (!isValidSingle(from) || !isValidSingle(to)) {
    throw new Error(
      `duration.range(): invalid format ${JSON.stringify(from)} / ${JSON.stringify(to)}`
    );
  }
  return brand(`${from}-${to}`);
};

export function seconds(n: number): Duration {
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`seconds(): invalid value ${n}`);
  }
  return brand(`${n}s`);
}

export interface MinutesBuilder extends Duration {
  seconds(n: number): Duration;
}

export function minutes(n: number): MinutesBuilder {
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
    throw new Error(`minutes(): invalid value ${n}`);
  }
  const base = brand(`${n}m`);
  return {
    ...base,
    seconds(s: number): Duration {
      if (!Number.isFinite(s) || s < 0) {
        throw new Error(`minutes().seconds(): invalid value ${s}`);
      }
      return brand(`${n}m${s}s`);
    },
  };
}
