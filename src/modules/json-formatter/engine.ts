export interface JsonValidationResult {
  isValid: boolean;
  error?: {
    message: string;
    line?: number;
    column?: number;
  };
  output?: string;
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

export function validateAndFormatJson(input: string, indent: number = 2): JsonValidationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: true, output: "" };
  }

  try {
    const parsed = JSON.parse(trimmed);
    const formatted = JSON.stringify(parsed, null, indent);
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

export const SAMPLE_JSON = JSON.stringify(
  {
    name: "Global Free Utility Tools Network",
    version: "1.0.0",
    features: ["Fast", "Client-Side", "Privacy-First", "Free"],
    settings: {
      theme: "light",
      offlineSupported: true,
      maxUploadMb: 50,
    },
    toolsCount: 10,
    active: true,
  },
  null,
  2
);
