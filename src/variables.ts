import { VAR_REF_BRAND } from "./internal/brands";
import type { VarRef } from "./types";

export interface VariableOptions<T> {
  initial?: T;
}

export function variable<T>(name: string, options?: VariableOptions<T>): VarRef<T> {
  if (!name || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) {
    throw new Error(
      `variable(): name ${JSON.stringify(name)} is not a valid JS identifier`
    );
  }
  const hasInitial = options !== undefined && "initial" in options;
  const ref: VarRef<T> = {
    [VAR_REF_BRAND]: true,
    name,
    hasInitial,
    ...(hasInitial ? { initial: options!.initial as T } : {}),
  };
  return ref;
}
