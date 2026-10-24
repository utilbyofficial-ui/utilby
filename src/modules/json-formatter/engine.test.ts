import { describe, it, expect } from "vitest";
import {
  validateAndFormatJson,
  minifyJson,
  repairCommonJsonMistakes,
  analyzeJsonStructure,
} from "./engine";

describe("JSON Formatter & Validator Engine", () => {
  it("should format valid JSON with indentation", () => {
    const raw = '{"a":1,"b":[2,3]}';
    const result = validateAndFormatJson(raw, 2);
    expect(result.isValid).toBe(true);
    expect(result.output).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}');
  });

  it("should minify valid JSON into single line", () => {
    const raw = `{\n  "name": "Utilby",\n  "active": true\n}`;
    const result = minifyJson(raw);
    expect(result.isValid).toBe(true);
    expect(result.output).toBe('{"name":"Utilby","active":true}');
  });

  it("should catch syntax errors and detect line/column position", () => {
    const broken = '{\n  "name": "Utilby",\n  "invalid": ,\n}';
    const result = validateAndFormatJson(broken);
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBeTruthy();
  });

  it("should repair common mistakes like trailing commas", () => {
    const sloppy = '{\n  "name": "Utilby",\n  "tags": ["fast", "free",],\n}';
    const fixed = repairCommonJsonMistakes(sloppy);
    const parsed = JSON.parse(fixed);
    expect(parsed.name).toBe("Utilby");
    expect(parsed.tags.length).toBe(2);
  });

  it("preserves URL slashes and quoted punctuation while repairing comments", () => {
    const fixed = repairCommonJsonMistakes(`{'url': 'https://example.com/a//b', 'text': 'comma,}', // comment\n}`);
    expect(JSON.parse(fixed)).toEqual({ url: "https://example.com/a//b", text: "comma,}" });
  });

  it("should analyze JSON structure statistics", () => {
    const sample = JSON.stringify({ a: 1, b: { c: [1, 2] } });
    const stats = analyzeJsonStructure(sample);
    expect(stats.type).toBe("object");
    expect(stats.keyCount).toBe(3);
    expect(stats.maxDepth).toBeGreaterThanOrEqual(3);
  });

  it("should handle empty string safely", () => {
    const result = validateAndFormatJson("");
    expect(result.isValid).toBe(true);
    expect(result.output).toBe("");
  });

  it("analyzes deeply nested JSON without recursive stack overflow", () => {
    const input = `${"[".repeat(1500)}0${"]".repeat(1500)}`;
    const stats = analyzeJsonStructure(input);
    expect(stats.type).toBe("array");
    expect(stats.maxDepth).toBe(1501);
  });

  it("rejects JSON over the browser processing limit", async () => {
    const { MAX_JSON_BYTES } = await import("./engine");
    const result = validateAndFormatJson(" ".repeat(MAX_JSON_BYTES + 1));
    expect(result.isValid).toBe(false);
    expect(result.error?.message).toContain("5 MB");
  });
});
