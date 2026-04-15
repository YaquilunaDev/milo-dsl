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
