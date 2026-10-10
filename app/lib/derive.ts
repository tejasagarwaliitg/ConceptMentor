/**
 * Tiny dependency-free math evaluator used by the review tests.
 * Supports numbers, + - * / ^ ( ) and the functions sin cos tan sqrt abs atan asin acos round,
 * plus the constants pi and e. Purpose: re-derive every numeric item's answer from its
 * written derivation, so a wrong answer key fails the build instead of reaching a student.
 */
export function evaluate(expr: string, vars: Record<string, number> = {}): number {
  const src = expr.replace(/\s+/g, "");
  let i = 0;

  const peek = () => src[i];
  const eat = (c: string) => {
    if (src[i] !== c) throw new Error(`expected '${c}' at ${i} in "${expr}"`);
    i++;
  };

  function parsePrimary(): number {
    const c = peek();
    if (c === "(") {
      eat("(");
      const v = parseAddSub();
      eat(")");
      return v;
    }
    if (c === "-" || c === "+") {
      eat(c);
      return c === "-" ? -parsePrimary() : parsePrimary();
    }
    const num = /^[0-9]*\.?[0-9]+/.exec(src.slice(i));
    if (num) {
      i += num[0].length;
      return parseFloat(num[0]);
    }
    const name = /^[a-zA-Z_][a-zA-Z0-9_]*/.exec(src.slice(i));
    if (name) {
      i += name[0].length;
      const n = name[0];
      if (n === "pi") return Math.PI;
      if (n === "e") return Math.E;
      if (peek() === "(") {
        eat("(");
        const arg = parseAddSub();
        eat(")");
        switch (n) {
          case "sin": return Math.sin(arg);
          case "cos": return Math.cos(arg);
          case "tan": return Math.tan(arg);
          case "sqrt": return Math.sqrt(arg);
          case "abs": return Math.abs(arg);
          case "atan": return Math.atan(arg);
          case "asin": return Math.asin(arg);
          case "acos": return Math.acos(arg);
          case "round": return Math.round(arg);
          default: throw new Error(`unknown function '${n}'`);
        }
      }
      if (n in vars) return vars[n];
      throw new Error(`unknown variable '${n}' in "${expr}"`);
    }
    throw new Error(`unexpected '${c}' at ${i} in "${expr}"`);
  }

  function parsePower(): number {
    let base = parsePrimary();
    while (peek() === "^") {
      eat("^");
      base = Math.pow(base, parsePrimary());
    }
    return base;
  }

  function parseMulDiv(): number {
    let left = parsePower();
    while (peek() === "*" || peek() === "/") {
      const op = src[i++];
      const right = parsePower();
      left = op === "*" ? left * right : left / right;
    }
    return left;
  }

  function parseAddSub(): number {
    let left = parseMulDiv();
    while (peek() === "+" || peek() === "-") {
      const op = src[i++];
      const right = parseMulDiv();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  const value = parseAddSub();
  if (i !== src.length) throw new Error(`trailing input in "${expr}"`);
  return value;
}

/** Turn "$5\\sqrt{3}$ m" or "$-10\\sqrt{3}$ N" into a number. Returns null for anything symbolic or non-numeric. */
export function parseNumericOption(option: string, vars: Record<string, number> = {}): number | null {
  const blocks = [...option.matchAll(/\$([^$]+)\$/g)];
  if (blocks.length > 1) return null;
  let expr = blocks.length ? blocks[0][1] : option.trim().replace(/\s+(?:m|N|cm|s|deg)(?:\b|²|³)[\s\S]*$/, "");
  if (expr.includes(",") || /\\hat|\\vec/.test(expr)) return null;
  expr = expr.replace(/\^?\\circ|°/g, "")
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "(($1)/($2))")
    .replace(/\\sqrt\{([^{}]+)\}|√([0-9.]+)/g, (_, a, b) => `sqrt(${a ?? b})`)
    .replace(/\\times|\\cdot/g, "*").replace(/\s+/g, "")
    .replace(/([0-9.)])(?=sqrt\()/g, "$1*");
  for (const [name, value] of Object.entries(vars)) {
    expr = expr.replace(new RegExp(name, "g"), `(${value})`);
  }
  expr = expr.replace(/([0-9)])(?=\()/g, "$1*");
  if (!/^[0-9.e+*/^()\-sqrt]+$/.test(expr)) return null;
  try { const value = evaluate(expr); return Number.isFinite(value) ? value : null; }
  catch { return null; }
}

/** All numbers inside an option, in order. Used for coordinate-pair options. */
export function numbersIn(option: string): number[] {
  const cleaned = option
    .replace(/\\sqrt\{(-?[0-9]*\.?[0-9]+)\}/g, " sqrt($1) ")
    .replace(/[{}$\\^°]/g, " ");
  const out: number[] = [];
  for (const m of cleaned.matchAll(/-?[0-9]*\.?[0-9]+/g)) out.push(parseFloat(m[0]));
  return out;
}

/** Relative comparison, so "36.9 deg" matches atan(3/4) in degrees and 5sqrt(3) matches 8.66. */
export function closeEnough(computed: number, declared: number): boolean {
  const scale = Math.max(1, Math.abs(computed), Math.abs(declared));
  return Math.abs(computed - declared) / scale < 0.01;
}

const STOP = new Set(["a", "an", "the", "is", "of", "at", "to", "in", "on", "and", "or", "what", "how", "its", "it", "are", "for", "with", "that", "this", "does", "do", "by", "be", "as", "from"]);

/** Content-word signature of a stem, for near-duplicate detection. */
export function stemSignature(stem: string): Set<string> {
  const words = stem
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
  return new Set(words);
}

/** Jaccard overlap of two signatures. */
export function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared / (a.size + b.size - shared);
}
