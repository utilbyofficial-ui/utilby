export interface JsonValidationResult {
  isValid: boolean;
  error?: {
    message: string;
    line?: number;
    column?: number;
  };
  output?: string;
}

export interface JsonStats {
  sizeBytes: number;
  keyCount: number;
  maxDepth: number;
  type: "object" | "array" | "primitive" | "empty";
}

export const MAX_JSON_BYTES = 5 * 1024 * 1024;

function utf8ByteLength(input: string, limit = Number.POSITIVE_INFINITY): number {
  let bytes = 0;
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if (code < 0x80) bytes++;
    else if (code < 0x800) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff && i + 1 < input.length) {
      const next = input.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) { bytes += 4; i++; }
      else bytes += 3;
    } else bytes += 3;
    if (bytes > limit) return limit + 1;
  }
  return bytes;
}

function exceedsJsonLimit(input: string): boolean {
  return utf8ByteLength(input, MAX_JSON_BYTES) > MAX_JSON_BYTES;
}

export function parseJsonError(errorMessage: string, input: string): { line?: number; column?: number } {
  // Typical modern V8 error format: "Unexpected token 'x', ... at position 42"
  const positionMatch = errorMessage.match(/at position (\d+)/i);
  if (positionMatch && positionMatch[1]) {
    const position = parseInt(positionMatch[1], 10);
    const textUpToPosition = input.slice(0, position);
    const lines = textUpToPosition.split("\n");
    const line = lines.length;
    const column = (lines[lines.length - 1]?.length || 0) + 1;
    return { line, column };
  }

  // Older format: "line X column Y"
  const lineColMatch = errorMessage.match(/line (\d+) column (\d+)/i);
  if (lineColMatch && lineColMatch[1] && lineColMatch[2]) {
    return {
      line: parseInt(lineColMatch[1], 10),
      column: parseInt(lineColMatch[2], 10),
    };
  }

  return {};
}

export function validateAndFormatJson(input: string, indent: number | string = 2): JsonValidationResult {
  if (exceedsJsonLimit(input)) {
    return { isValid: false, error: { message: "JSON input exceeds the 5 MB processing limit." } };
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: true, output: "" };
  }

  try {
    const parsed = JSON.parse(trimmed);
    const indentValue = typeof indent === "string" ? indent : indent;
    const formatted = JSON.stringify(parsed, null, indentValue);
    return {
      isValid: true,
      output: formatted,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid JSON";
    const { line, column } = parseJsonError(message, input);

    return {
      isValid: false,
      error: {
        message,
        line,
        column,
      },
    };
  }
}

export function minifyJson(input: string): JsonValidationResult {
  if (exceedsJsonLimit(input)) {
    return { isValid: false, error: { message: "JSON input exceeds the 5 MB processing limit." } };
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: true, output: "" };
  }

  try {
    const parsed = JSON.parse(trimmed);
    const minified = JSON.stringify(parsed);
    return {
      isValid: true,
      output: minified,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid JSON";
    const { line, column } = parseJsonError(message, input);

    return {
      isValid: false,
      error: {
        message,
        line,
        column,
      },
    };
  }
}

export function repairCommonJsonMistakes(input: string): string {
  if (exceedsJsonLimit(input)) return input;
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    // Repair only common syntax issues below.
  }

  // Strip comments only outside strings, so URLs and text like "//" survive.
  let source = "";
  let quote: '"' | "'" | null = null;
  let escaped = false;
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i]!;
    if (quote) {
      source += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
    } else if (char === '"' || char === "'") {
      quote = char;
      source += char;
    } else if (char === "/" && trimmed[i + 1] === "/") {
      while (i < trimmed.length && trimmed[i] !== "\n") i++;
      if (i < trimmed.length) source += "\n";
    } else if (char === "/" && trimmed[i + 1] === "*") {
      i += 2;
      while (i < trimmed.length && !(trimmed[i] === "*" && trimmed[i + 1] === "/")) {
        if (trimmed[i] === "\n") source += "\n";
        i++;
      }
      if (i < trimmed.length) i++;
    } else source += char;
  }

  let repaired = "";
  quote = null;
  escaped = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i]!;
    if (quote === '"') {
      repaired += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quote = null;
    } else if (quote === "'") {
      if (escaped) {
        const replacements: Record<string, string> = { "'": "'", '"': '\\"', "\\": "\\\\", n: "\\n", r: "\\r", t: "\\t" };
        repaired += replacements[char] ?? `\\${char}`;
        escaped = false;
      } else if (char === "\\") escaped = true;
      else if (char === "'") {
        repaired += '"';
        quote = null;
      } else if (char === '"') repaired += '\\"';
      else if (char === "\n") repaired += "\\n";
      else if (char === "\r") repaired += "\\r";
      else repaired += char;
    } else if (char === '"' || char === "'") {
      quote = char;
      repaired += char === "'" ? '"' : char;
    } else if (char === ",") {
      let next = i + 1;
      while (/\s/.test(source[next] ?? "")) next++;
      if (source[next] !== "}" && source[next] !== "]") repaired += char;
    } else repaired += char;
  }
  if (quote === "'") repaired += '"';
  return repaired;
}

export function analyzeJsonStructure(input: string): JsonStats {
  const sizeBytes = utf8ByteLength(input, MAX_JSON_BYTES);
  if (sizeBytes > MAX_JSON_BYTES) return { sizeBytes, keyCount: 0, maxDepth: 0, type: "empty" };
  const trimmed = input.trim();
  if (!trimmed) {
    return { sizeBytes: 0, keyCount: 0, maxDepth: 0, type: "empty" };
  }

  try {
    const parsed = JSON.parse(trimmed);
    let keyCount = 0;
    let maxDepth = 0;

    const stack: Array<{ value: unknown; depth: number }> = [{ value: parsed, depth: 1 }];
    while (stack.length) {
      const { value, depth } = stack.pop()!;
      maxDepth = Math.max(maxDepth, depth);
      if (!value || typeof value !== "object") continue;
      if (Array.isArray(value)) {
        for (const item of value) stack.push({ value: item, depth: depth + 1 });
      } else {
        const record = value as Record<string, unknown>;
        const keys = Object.keys(record);
        keyCount += keys.length;
        for (const key of keys) stack.push({ value: record[key], depth: depth + 1 });
      }
    }

    const type = Array.isArray(parsed) ? "array" : typeof parsed === "object" && parsed !== null ? "object" : "primitive";

    return {
      sizeBytes,
      keyCount,
      maxDepth,
      type,
    };
  } catch {
    return { sizeBytes, keyCount: 0, maxDepth: 0, type: "empty" };
  }
}

export const SAMPLE_JSON = JSON.stringify(
  {
    name: "Utilby Network",
    version: "1.0.0",
    features: ["Fast", "Client-Side", "Privacy-First", "Free"],
    settings: {
      theme: "light",
      offlineSupported: true,
      maxUploadMb: 50,
    },
    analytics: {
      enabled: true,
      cookieFree: true,
    },
  },
  null,
  2
);
