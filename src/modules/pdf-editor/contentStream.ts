/**
 * Minimal PDF content-stream tokenizer + text remover.
 *
 * Covering old text with a white box only hides it visually — the original words stay in the
 * file and still show up when someone searches, copies, or uses a screen reader. This module
 * removes the text-showing operators (Tj, TJ, ', ") whose glyphs start inside the given
 * rectangles, so edited / whited-out text is really gone from the PDF.
 *
 * Pure functions (no DOM, no pdf-lib) so it is fully unit-testable.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type Matrix = [number, number, number, number, number, number];

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/** PDF matrix product: result = m1 × m2 (row-vector convention used by the PDF spec). */
export function multiply(m1: Matrix, m2: Matrix): Matrix {
  const [a1, b1, c1, d1, e1, f1] = m1;
  const [a2, b2, c2, d2, e2, f2] = m2;
  return [
    a1 * a2 + b1 * c2,
    a1 * b2 + b1 * d2,
    c1 * a2 + d1 * c2,
    c1 * b2 + d1 * d2,
    e1 * a2 + f1 * c2 + e2,
    e1 * b2 + f1 * d2 + f2,
  ];
}

export function applyPoint(m: Matrix, x: number, y: number): { x: number; y: number } {
  return { x: x * m[0] + y * m[2] + m[4], y: x * m[1] + y * m[3] + m[5] };
}

function applyVector(m: Matrix, x: number, y: number): { x: number; y: number } {
  return { x: x * m[0] + y * m[2], y: x * m[1] + y * m[3] };
}

// ---------------------------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------------------------

export type TokenType = "number" | "string" | "hexstring" | "name" | "arrayStart" | "arrayEnd" | "dictStart" | "dictEnd" | "operator" | "other";

export interface Token {
  type: TokenType;
  /** Raw text of the token (latin1) */
  value: string;
  start: number;
  /** Exclusive end offset */
  end: number;
}

const isWhite = (c: number) => c === 0 || c === 9 || c === 10 || c === 12 || c === 13 || c === 32;
const isDelim = (c: number) =>
  c === 40 || c === 41 || c === 60 || c === 62 || c === 91 || c === 93 || c === 123 || c === 125 || c === 47 || c === 37;

/** Splits a content stream (as a latin1 string) into tokens. Inline image data is kept opaque. */
export function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  const n = src.length;
  let i = 0;

  while (i < n) {
    const c = src.charCodeAt(i);
    if (isWhite(c)) {
      i++;
      continue;
    }
    // comment
    if (c === 37) {
      while (i < n && src.charCodeAt(i) !== 10 && src.charCodeAt(i) !== 13) i++;
      continue;
    }
    const start = i;
    // literal string with nesting and escapes
    if (c === 40) {
      let depth = 1;
      i++;
      while (i < n && depth > 0) {
        const ch = src.charCodeAt(i);
        if (ch === 92) {
          i += 2;
          continue;
        }
        if (ch === 40) depth++;
        else if (ch === 41) depth--;
        i++;
      }
      tokens.push({ type: "string", value: src.slice(start, i), start, end: i });
      continue;
    }
    if (c === 60) {
      if (src.charCodeAt(i + 1) === 60) {
        tokens.push({ type: "dictStart", value: "<<", start, end: i + 2 });
        i += 2;
        continue;
      }
      i++;
      while (i < n && src.charCodeAt(i) !== 62) i++;
      i++;
      tokens.push({ type: "hexstring", value: src.slice(start, i), start, end: i });
      continue;
    }
    if (c === 62 && src.charCodeAt(i + 1) === 62) {
      tokens.push({ type: "dictEnd", value: ">>", start, end: i + 2 });
      i += 2;
      continue;
    }
    if (c === 91) {
      tokens.push({ type: "arrayStart", value: "[", start, end: i + 1 });
      i++;
      continue;
    }
    if (c === 93) {
      tokens.push({ type: "arrayEnd", value: "]", start, end: i + 1 });
      i++;
      continue;
    }
    if (c === 47) {
      i++;
      while (i < n && !isWhite(src.charCodeAt(i)) && !isDelim(src.charCodeAt(i))) i++;
      tokens.push({ type: "name", value: src.slice(start, i), start, end: i });
      continue;
    }
    if (c === 123 || c === 125 || c === 41 || c === 62) {
      // stray delimiters (PostScript calculator braces etc.) — keep as opaque
      tokens.push({ type: "other", value: src[i]!, start, end: i + 1 });
      i++;
      continue;
    }
    // regular token: number or operator keyword
    while (i < n && !isWhite(src.charCodeAt(i)) && !isDelim(src.charCodeAt(i))) i++;
    const word = src.slice(start, i);
    if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(word)) {
      tokens.push({ type: "number", value: word, start, end: i });
    } else {
      tokens.push({ type: "operator", value: word, start, end: i });
      // Inline image: skip raw binary data between ID and EI
      if (word === "ID") {
        i++; // single whitespace after ID
        const dataStart = i;
        let found = -1;
        for (let k = dataStart; k < n - 1; k++) {
          if (
            src.charCodeAt(k) === 69 && // E
            src.charCodeAt(k + 1) === 73 && // I
            (k === 0 || isWhite(src.charCodeAt(k - 1))) &&
            (k + 2 >= n || isWhite(src.charCodeAt(k + 2)) || isDelim(src.charCodeAt(k + 2)))
          ) {
            found = k;
            break;
          }
        }
        const eiAt = found === -1 ? n : found;
        tokens.push({ type: "other", value: "", start: dataStart, end: eiAt });
        if (found !== -1) {
          tokens.push({ type: "operator", value: "EI", start: eiAt, end: eiAt + 2 });
          i = eiAt + 2;
        } else {
          i = n;
        }
      }
    }
  }
  return tokens;
}

// ---------------------------------------------------------------------------------------------
// Interpreter: find text-show operators that start inside the rectangles
// ---------------------------------------------------------------------------------------------

interface Operand {
  kind: "number" | "string" | "array" | "name" | "other";
  num?: number;
  start: number;
  end: number;
  /** For arrays: total chars and kerning used to estimate advance */
  approxChars?: number;
  kerning?: number;
}

function stringCharCount(tok: Token): number {
  if (tok.type === "hexstring") return Math.max(0, Math.floor((tok.value.replace(/[\s<>]/g, "").length) / 2));
  // literal: count bytes roughly (escapes count as one)
  return tok.value.slice(1, -1).replace(/\\(\d{1,3}|.)/g, "x").length;
}

function inRects(rects: Rect[], x: number, y: number): boolean {
  return rects.some((r) => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height);
}

export interface RemovalResult {
  /** New content (latin1 string) */
  content: string;
  /** How many text-show operators were blanked */
  removed: number;
}

/**
 * Blanks text-show operators whose first glyph lies inside any of the rectangles (default user space).
 * Everything else in the stream is kept byte-for-byte.
 */
export function removeTextInRects(content: string, rects: Rect[]): RemovalResult {
  if (!rects.length) return { content, removed: 0 };
  const tokens = tokenize(content);

  const stack: Matrix[] = [];
  let ctm: Matrix = [...IDENTITY];
  let tm: Matrix = [...IDENTITY];
  let tlm: Matrix = [...IDENTITY];
  let fontSize = 12;
  let leading = 0;
  let charSpacing = 0;
  let wordSpacing = 0;
  let hScale = 1;
  let rise = 0;

  const edits: { start: number; end: number; replacement: string }[] = [];
  let operands: Operand[] = [];
  let arrayDepth = 0;
  let arrayStart = -1;
  let arrayChars = 0;
  let arrayKerning = 0;
  let dictDepth = 0;

  const nums = () => operands.filter((o) => o.kind === "number").map((o) => o.num!);

  const translateLine = (tx: number, ty: number) => {
    tlm = multiply([1, 0, 0, 1, tx, ty], tlm);
    tm = [...tlm];
  };

  /** Returns true if the glyph run starting at the current text position is inside a rect. */
  const startsInRect = (): boolean => {
    const m = multiply(tm, ctm);
    const origin = applyPoint(m, 0, rise);
    const up = applyVector(m, 0, fontSize);
    const right = applyVector(m, fontSize, 0);
    // Probe slightly inside the first glyph (30% up, 15% right) so edge cases on the box border work.
    const px = origin.x + up.x * 0.3 + right.x * 0.15;
    const py = origin.y + up.y * 0.3 + right.y * 0.15;
    return inRects(rects, px, py);
  };

  const advance = (chars: number, kerning: number, spaces: number) => {
    // Rough advance estimate (no font metrics): average glyph ≈ 0.5em.
    const tx = ((chars * 0.5 - kerning / 1000) * fontSize + chars * charSpacing + spaces * wordSpacing) * hScale;
    tm = multiply([1, 0, 0, 1, tx, 0], tm);
  };

  for (let t = 0; t < tokens.length; t++) {
    const tok = tokens[t]!;

    if (dictDepth > 0) {
      if (tok.type === "dictStart") dictDepth++;
      else if (tok.type === "dictEnd") dictDepth--;
      if (dictDepth === 0) operands.push({ kind: "other", start: tok.start, end: tok.end });
      continue;
    }
    if (tok.type === "dictStart") {
      dictDepth = 1;
      continue;
    }

    if (arrayDepth > 0) {
      if (tok.type === "arrayStart") arrayDepth++;
      else if (tok.type === "arrayEnd") {
        arrayDepth--;
        if (arrayDepth === 0) {
          operands.push({ kind: "array", start: arrayStart, end: tok.end, approxChars: arrayChars, kerning: arrayKerning });
        }
      } else if (tok.type === "string" || tok.type === "hexstring") {
        arrayChars += stringCharCount(tok);
      } else if (tok.type === "number") {
        arrayKerning += parseFloat(tok.value);
      }
      continue;
    }

    switch (tok.type) {
      case "arrayStart":
        arrayDepth = 1;
        arrayStart = tok.start;
        arrayChars = 0;
        arrayKerning = 0;
        continue;
      case "number":
        operands.push({ kind: "number", num: parseFloat(tok.value), start: tok.start, end: tok.end });
        continue;
      case "string":
      case "hexstring":
        operands.push({ kind: "string", start: tok.start, end: tok.end, approxChars: stringCharCount(tok) });
        continue;
      case "name":
        operands.push({ kind: "name", start: tok.start, end: tok.end });
        continue;
      case "operator":
        break;
      default:
        operands.push({ kind: "other", start: tok.start, end: tok.end });
        continue;
    }

    const op = tok.value;
    const n = nums();
    switch (op) {
      case "q":
        stack.push([...ctm]);
        break;
      case "Q":
        ctm = stack.pop() ?? [...IDENTITY];
        break;
      case "cm":
        if (n.length >= 6) ctm = multiply(n.slice(-6) as Matrix, ctm);
        break;
      case "BT":
        tm = [...IDENTITY];
        tlm = [...IDENTITY];
        break;
      case "Tf":
        if (n.length >= 1) fontSize = n[n.length - 1]!;
        break;
      case "TL":
        if (n.length >= 1) leading = n[0]!;
        break;
      case "Tc":
        if (n.length >= 1) charSpacing = n[0]!;
        break;
      case "Tw":
        if (n.length >= 1) wordSpacing = n[0]!;
        break;
      case "Tz":
        if (n.length >= 1) hScale = n[0]! / 100;
        break;
      case "Ts":
        if (n.length >= 1) rise = n[0]!;
        break;
      case "Td":
        if (n.length >= 2) translateLine(n[0]!, n[1]!);
        break;
      case "TD":
        if (n.length >= 2) {
          leading = -n[1]!;
          translateLine(n[0]!, n[1]!);
        }
        break;
      case "Tm":
        if (n.length >= 6) {
          tlm = n.slice(-6) as Matrix;
          tm = [...tlm];
        }
        break;
      case "T*":
        translateLine(0, -leading);
        break;
      case "Tj":
      case "'":
      case '"': {
        if (op === '"' && n.length >= 2) {
          wordSpacing = n[0]!;
          charSpacing = n[1]!;
        }
        if (op === "'" || op === '"') translateLine(0, -leading);
        const str = [...operands].reverse().find((o) => o.kind === "string");
        if (str) {
          if (startsInRect()) edits.push({ start: str.start, end: str.end, replacement: "()" });
          advance(str.approxChars ?? 0, 0, 0);
        }
        break;
      }
      case "TJ": {
        const arr = [...operands].reverse().find((o) => o.kind === "array");
        if (arr) {
          if (startsInRect()) edits.push({ start: arr.start, end: arr.end, replacement: "[]" });
          advance(arr.approxChars ?? 0, arr.kerning ?? 0, 0);
        }
        break;
      }
      default:
        break;
    }
    operands = [];
  }

  if (!edits.length) return { content, removed: 0 };
  edits.sort((a, b) => a.start - b.start);
  let out = "";
  let cursor = 0;
  for (const e of edits) {
    out += content.slice(cursor, e.start) + e.replacement;
    cursor = e.end;
  }
  out += content.slice(cursor);
  return { content: out, removed: edits.length };
}

/** Uint8Array → latin1 string (1 char per byte) without blowing the call stack. */
export function bytesToLatin1(bytes: Uint8Array): string {
  let s = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
  }
  return s;
}

export function latin1ToBytes(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  return out;
}
