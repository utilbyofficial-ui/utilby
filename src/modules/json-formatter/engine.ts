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
  let repaired = input.trim();
  // Remove single line comments
  repaired = repaired.replace(/\/\/.*$/gm, "");
  // Replace single-quoted property keys: 'key': -> "key":
  repaired = repaired.replace(/'([a-zA-Z0-9_$]+)'\s*:/g, '"$1":');
  // Replace single-quoted values: : 'value' -> : "value"
  repaired = repaired.replace(/:\s*'([^']*)'/g, ': "$1"');
  // Remove trailing commas in objects and arrays: , } -> } and , ] -> ]
  repaired = repaired.replace(/,\s*([}\]])/g, "$1");
  return repaired;
}

export function analyzeJsonStructure(input: string): JsonStats {
  const sizeBytes = new TextEncoder().encode(input).length;
  const trimmed = input.trim();
  if (!trimmed) {
    return { sizeBytes: 0, keyCount: 0, maxDepth: 0, type: "empty" };
  }

  try {
    const parsed = JSON.parse(trimmed);
    let keyCount = 0;
    let maxDepth = 0;

    function traverse(val: unknown, currentDepth: number) {
      if (currentDepth > maxDepth) maxDepth = currentDepth;
      if (val && typeof val === "object") {
        if (Array.isArray(val)) {
          for (const item of val) {
            traverse(item, currentDepth + 1);
          }
        } else {
          const keys = Object.keys(val as Record<string, unknown>);
          keyCount += keys.length;
          for (const k of keys) {
            traverse((val as Record<string, unknown>)[k], currentDepth + 1);
          }
        }
      }
    }

    traverse(parsed, 1);

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
