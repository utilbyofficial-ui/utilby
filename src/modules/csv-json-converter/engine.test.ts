import { describe, expect, it } from "vitest";
import {
  cleanConversionFilename,
  convertCsvToJson,
  convertJsonToCsv,
  detectCsvDelimiter,
  parseCsv,
} from "./engine";

describe("CSV parsing", () => {
  it("handles BOM, CRLF rows, escaped quotes, commas, and newlines inside quotes", () => {
    expect(parseCsv('\uFEFFname,note\r\nAri,"Said ""hello,""\nand left"""\r\n', ",")).toEqual([
      ["name", "note"],
      ["Ari", 'Said "hello,"\nand left"'],
    ]);
  });

  it("detects tab, semicolon, and pipe delimiters without counting quoted separators", () => {
    expect(detectCsvDelimiter('name;note\nAda;"a,b;c"')).toBe(";");
    expect(detectCsvDelimiter("name\tcity\nRafi\tDhaka")).toBe("\t");
    expect(detectCsvDelimiter("name|city\nRafi|Dhaka")).toBe("|");
  });

  it("prefers a separator shared by rows over stray separators inside unquoted text", () => {
    expect(detectCsvDelimiter("name,note\nAri,one; two; three; four\nMaya,plain")).toBe(",");
  });

  it("keeps trailing empty cells and does not add a row after a final newline", () => {
    expect(parseCsv("a,b,\n1,2,\n", ",")).toEqual([["a", "b", ""], ["1", "2", ""]]);
  });

  it("reports unclosed and malformed quoted fields", () => {
    expect(() => parseCsv('name,note\nAri,"unfinished', ",")).toThrow("missing its closing quote");
    expect(() => parseCsv('name,no"te\n', ",")).toThrow("Unexpected quote");
    expect(() => parseCsv('name,note\nAri,"ok"tail', ",")).toThrow("after a closing quote");
  });
});

describe("CSV to JSON conversion", () => {
  it("converts rows to objects and fills missing cells with empty strings", () => {
    const result = convertCsvToJson("name,city\nRafi,Dhaka\nMaya", "auto", true);
    expect(JSON.parse(result.text)).toEqual([{ name: "Rafi", city: "Dhaka" }, { name: "Maya", city: "" }]);
    expect(result.rowCount).toBe(2);
    expect(result.delimiter).toBe(",");
  });

  it("makes blank and duplicate headers unique", () => {
    const result = convertCsvToJson(",Name,name\nx,a,b", ",", true);
    expect(JSON.parse(result.text)).toEqual([{ "Column 1": "x", Name: "a", "name (2)": "b" }]);
  });

  it("supports array-of-arrays output when the first row is not a header", () => {
    const result = convertCsvToJson("name,score\nAri,12", ",", false);
    expect(JSON.parse(result.text)).toEqual([["name", "score"], ["Ari", "12"]]);
  });

  it("returns an empty JSON array for empty input", () => {
    expect(convertCsvToJson("").text).toBe("[]");
  });
});

describe("JSON to CSV conversion", () => {
  it("uses the ordered union of object keys and escapes CSV cells", () => {
    const result = convertJsonToCsv(JSON.stringify([
      { name: "Ari", note: 'said "hello",\nthen left' },
      { city: "Dhaka", name: "Maya", note: null },
    ]));
    expect(result.text).toBe('name,note,city\r\nAri,"said ""hello"",\nthen left",\r\nMaya,,Dhaka');
    expect(result.rowCount).toBe(2);
    expect(result.columnCount).toBe(3);
  });

  it("supports array rows and nested JSON cell values", () => {
    const result = convertJsonToCsv('[["a,b", 2], ["plain", {"ok":true}]]');
    expect(result.text).toBe('"a,b",2\r\nplain,"{""ok"":true}"');
  });

  it("rejects invalid JSON, non-array roots, and mixed row shapes", () => {
    expect(() => convertJsonToCsv("{")).toThrow("Could not read JSON");
    expect(() => convertJsonToCsv('{"name":"Ari"}')).toThrow("must be an array");
    expect(() => convertJsonToCsv('[{"name":"Ari"}, ["Maya"]]')).toThrow("Mixed row types");
  });

  it("returns an empty result for an empty array", () => {
    expect(convertJsonToCsv("[]")).toEqual({ text: "", rowCount: 0, columnCount: 0 });
  });
});

describe("conversion filenames", () => {
  it("creates a safe output name", () => {
    expect(cleanConversionFilename("My data.csv")).toBe("My-data");
    expect(cleanConversionFilename(".csv")).toBe("converted-data");
  });
});
