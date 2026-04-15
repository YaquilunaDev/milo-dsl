import { PAGE_REF_BRAND } from "./internal/brands.js";
import type { Command, PageRef, PageRegistration } from "./types.js";

export type PageCommands =
  | readonly Command[]
  | ((self: PageRef) => readonly Command[]);

export function page(id: string, commands: PageCommands): PageRegistration {
  if (!id) throw new Error("page(): id must be a non-empty string");
  const ref: PageRef = { [PAGE_REF_BRAND]: true, id };
  const cmds =
    typeof commands === "function" ? commands(ref) : commands;
  return { [PAGE_REF_BRAND]: true, id, commands: cmds };
}
