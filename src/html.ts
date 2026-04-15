import { HTML_BRAND } from "./internal/brands";
import { isHtml, isJs, isVarRef } from "./internal/guards";
import type { Html, Js, VarRef } from "./types";

export type HtmlChild = string | Html;

function escapeText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderChildren(
  children: readonly HtmlChild[],
  refs: VarRef<unknown>[]
): string {
  let out = "";
  for (const c of children) {
    if (typeof c === "string") out += escapeText(c);
    else if (isHtml(c)) {
      out += c.html;
      for (const r of c.refs) refs.push(r);
    } else {
      throw new Error(
        `html: unsupported child type ${Object.prototype.toString.call(c)}`
      );
    }
  }
  return out;
}

function brand(html: string, refs: readonly VarRef<unknown>[]): Html {
  return { [HTML_BRAND]: true, html, refs };
}

function tag(name: string, ...children: HtmlChild[]): Html {
  const refs: VarRef<unknown>[] = [];
  const inner = renderChildren(children, refs);
  return brand(`<${name}>${inner}</${name}>`, refs);
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export const html = {
  p: (...children: HtmlChild[]): Html => tag("p", ...children),
  bold: (...children: HtmlChild[]): Html => tag("strong", ...children),
  italic: (...children: HtmlChild[]): Html => tag("em", ...children),
  underline: (...children: HtmlChild[]): Html => tag("u", ...children),
  color(color: string, ...children: HtmlChild[]): Html {
    if (!HEX_COLOR_RE.test(color)) {
      throw new Error(
        `html.color(): expected #rrggbb hex, got ${JSON.stringify(color)}`
      );
    }
    const refs: VarRef<unknown>[] = [];
    const inner = renderChildren(children, refs);
    return brand(`<span style="color: ${color}">${inner}</span>`, refs);
  },
  evalVar(ref: VarRef<unknown>): Html {
    if (!isVarRef(ref)) {
      throw new Error("html.evalVar(): argument must be a VarRef");
    }
    return brand(`<eval>${ref.name}</eval>`, [ref]);
  },
  evalExpr(expr: Js): Html {
    if (!isJs(expr)) {
      throw new Error("html.evalExpr(): argument must be a Js value (js`...`)");
    }
    return brand(`<eval>${expr.source}</eval>`, [...expr.refs]);
  },
};

export type SayLabel = string | Html | readonly (string | Html)[];

export interface NormalizedLabel {
  label: string;
  refs: readonly VarRef<unknown>[];
}

export function normalizeLabel(label: SayLabel): NormalizedLabel {
  let raw: string;
  const refs: VarRef<unknown>[] = [];
  if (typeof label === "string") raw = label;
  else if (isHtml(label)) {
    raw = label.html;
    for (const r of label.refs) refs.push(r);
  } else {
    let out = "";
    for (const part of label) {
      if (typeof part === "string") out += part;
      else if (isHtml(part)) {
        out += part.html;
        for (const r of part.refs) refs.push(r);
      } else
        throw new Error(
          `say(): unsupported label part ${Object.prototype.toString.call(part)}`
        );
    }
    raw = out;
  }
  if (raw.length > 0 && !raw.startsWith("<")) {
    raw = `<p>${raw}</p>`;
  }
  return { label: raw, refs };
}
