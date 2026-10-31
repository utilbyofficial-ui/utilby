export type CsvDelimiter = "," | ";" | "\t" | "|";
export type CsvDelimiterOption = CsvDelimiter | "auto";

export const MAX_CSV_JSON_BYTES = 5 * 1024 * 1024;

export interface CsvToJsonResult {
  text: string;
  rowCount: number;
  delimiter: CsvDelimiter;
}

export interface JsonToCsvResult {
  text: string;
  rowCount: number;
  columnCount: number;
}

const DELIMITERS: CsvDelimiter[] = [",", "\t", ";", "|"];

function isDelimiter(value: string): value is CsvDelimiter {
  return DELIMITERS.includes(value as CsvDelimiter);
}

/** Finds the most consistent separator across the first few non-empty CSV rows. */
export function detectCsvDelimiter(input: string): CsvDelimiter {
  const sample = input.replace(/^\uFEFF/, "").slice(0, 64 * 1024);
  const lineCounts: Map<CsvDelimiter, number>[] = [];
  let counts = new Map<CsvDelimiter, number>(DELIMITERS.map((delimiter) => [delimiter, 0]));
  let quoted = false;
  let lineHasContent = false;

  for (let index = 0; index < sample.length && lineCounts.length < 8; index += 1) {
    const char = sample[index];
    if (char === '"') {
      if (quoted && sample[index + 1] === '"') index += 1;
      else quoted = !quoted;
      lineHasContent = true;
      continue;
    }
    if (!quoted && isDelimiter(char)) {
      counts.set(char, (counts.get(char) ?? 0) + 1);
      lineHasContent = true;
      continue;
    }
    if (!quoted && (char === "\n" || char === "\r")) {
      if (lineHasContent) lineCounts.push(counts);
      counts = new Map<CsvDelimiter, number>(DELIMITERS.map((delimiter) => [delimiter, 0]));
      lineHasContent = false;
      if (char === "\r" && sample[index + 1] === "\n") index += 1;
      continue;
    }
    if (!/\s/.test(char)) lineHasContent = true;
  }
  if (lineHasContent && lineCounts.length < 8) lineCounts.push(counts);

  let best = "," as CsvDelimiter;
  let bestActiveRows = 0;
  let bestConsistency = 0;
  let bestTotal = 0;
  for (const delimiter of DELIMITERS) {
    const rowCounts = lineCounts.map((row) => row.get(delimiter) ?? 0);
    const activeRows = rowCounts.filter((count) => count > 0).length;
    const frequencies = new Map<number, number>();
    for (const count of rowCounts) {
      if (count > 0) frequencies.set(count, (frequencies.get(count) ?? 0) + 1);
    }
    const consistency = Math.max(0, ...frequencies.values());
    const total = rowCounts.reduce((sum, count) => sum + count, 0);
    if (activeRows > bestActiveRows
      || (activeRows === bestActiveRows && consistency > bestConsistency)
      || (activeRows === bestActiveRows && consistency === bestConsistency && total > bestTotal)) {
      best = delimiter;
      bestActiveRows = activeRows;
      bestConsistency = consistency;
      bestTotal = total;
    }
  }
  return best;
}

/** Parses RFC 4180-style delimited text, including escaped quotes and line breaks in cells. */
export function parseCsv(input: string, delimiter: CsvDelimiter): string[][] {
  const text = input.replace(/^\uFEFF/, "");
  if (!text.length) return [];

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let fieldStarted = false;
  let closedQuotedField = false;
  let rowTouched = false;

  const finishField = () => {
    row.push(field);
    field = "";
    fieldStarted = false;
    closedQuotedField = false;
  };
  const finishRow = () => {
    finishField();
    rows.push(row);
    row = [];
    rowTouched = false;
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
          closedQuotedField = true;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      if (fieldStarted || field.length > 0) {
        throw new Error(`Unexpected quote in an unquoted field near character ${index + 1}.`);
      }
      inQuotes = true;
      fieldStarted = true;
      rowTouched = true;
      continue;
    }

    if (char === delimiter) {
      finishField();
      rowTouched = true;
      continue;
    }

    if (char === "\n" || char === "\r") {
      finishRow();
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      continue;
    }

    if (closedQuotedField) {
      if (char === " " || char === "\t") continue;
      throw new Error(`Unexpected text after a closing quote near character ${index + 1}.`);
    }

    field += char;
    fieldStarted = true;
    rowTouched = true;
  }

  if (inQuotes) throw new Error("A quoted field is missing its closing quote.");
  if (rowTouched || row.length > 0 || field.length > 0 || fieldStarted) finishRow();
  return rows;
}

function createHeaders(values: string[], columnCount: number): string[] {
  const used = new Set<string>();
  return Array.from({ length: columnCount }, (_, index) => {
    const base = values[index]?.trim() || `Column ${index + 1}`;
    let header = base;
    let suffix = 2;
    while (used.has(header.toLowerCase())) {
      header = `${base} (${suffix})`;
      suffix += 1;
    }
    used.add(header.toLowerCase());
    return header;
  });
}

export function convertCsvToJson(
  input: string,
  delimiterOption: CsvDelimiterOption = "auto",
  firstRowIsHeader = true
): CsvToJsonResult {
  const delimiter = delimiterOption === "auto" ? detectCsvDelimiter(input) : delimiterOption;
  const rows = parseCsv(input, delimiter);
  if (rows.length === 0) return { text: "[]", rowCount: 0, delimiter };

  let values: unknown;
  let dataRows: string[][];
  if (firstRowIsHeader) {
    const columnCount = Math.max(...rows.map((row) => row.length));
    const headers = createHeaders(rows[0], columnCount);
    dataRows = rows.slice(1);
    values = dataRows.map((row) => Object.fromEntries(
      headers.map((header, index) => [header, row[index] ?? ""])
    ));
  } else {
    dataRows = rows;
    values = rows;
  }

  return { text: JSON.stringify(values, null, 2), rowCount: dataRows.length, delimiter };
}

function cellToCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function convertJsonToCsv(input: string): JsonToCsvResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Invalid JSON.";
    throw new Error(`Could not read JSON: ${reason}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("JSON must be an array of objects or an array of arrays to convert to CSV.");
  }
  if (parsed.length === 0) return { text: "", rowCount: 0, columnCount: 0 };

  const isObjectRows = parsed.every((value) => value !== null && typeof value === "object" && !Array.isArray(value));
  const isArrayRows = parsed.every(Array.isArray);
  if (!isObjectRows && !isArrayRows) {
    throw new Error("Use rows that are all objects or all arrays. Mixed row types cannot be converted safely.");
  }

  let table: unknown[][];
  if (isObjectRows) {
    const headers: string[] = [];
    const seen = new Set<string>();
    for (const row of parsed as Record<string, unknown>[]) {
      for (const key of Object.keys(row)) {
        if (!seen.has(key)) {
          seen.add(key);
          headers.push(key);
        }
      }
    }
    table = [headers, ...(parsed as Record<string, unknown>[]).map((row) => headers.map((header) => row[header]))];
  } else {
    table = parsed as unknown[][];
  }

  const text = table.map((row) => row.map(cellToCsv).join(",")).join("\r\n");
  return { text, rowCount: parsed.length, columnCount: Math.max(...table.map((row) => row.length), 0) };
}

export function cleanConversionFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").trim();
  const safe = base.replace(/[^\p{L}\p{M}\p{N} _.-]/gu, "").replace(/\s+/g, "-").replace(/-+/g, "-");
  return safe || "converted-data";
}
