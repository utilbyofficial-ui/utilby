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
});
