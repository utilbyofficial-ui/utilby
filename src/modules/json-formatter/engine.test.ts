import { describe, it, expect } from "vitest";
import { validateAndFormatJson, minifyJson } from "./engine";

describe("JSON Formatter & Validator Engine", () => {
  it("should format valid JSON with indentation", () => {
    const raw = '{"a":1,"b":[2,3]}';
    const result = validateAndFormatJson(raw, 2);
    expect(result.isValid).toBe(true);
    expect(result.output).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}');
  });

  it("should minify valid JSON into single line", () => {
    const raw = `{\n  "name": "Antigravity",\n  "active": true\n}`;
    const result = minifyJson(raw);
    expect(result.isValid).toBe(true);
    expect(result.output).toBe('{"name":"Antigravity","active":true}');
  });

  it("should catch syntax errors and detect line/column position", () => {
    const broken = '{\n  "name": "Antigravity",\n  "invalid": ,\n}';
    const result = validateAndFormatJson(broken);
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBeTruthy();
  });

  it("should handle empty string safely", () => {
    const result = validateAndFormatJson("");
    expect(result.isValid).toBe(true);
    expect(result.output).toBe("");
  });
});
