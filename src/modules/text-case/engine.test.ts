import { describe, it, expect } from "vitest";
import {
  toUpperCase,
  toLowerCase,
  toTitleCase,
  toSentenceCase,
  toCapitalizedWords,
  removeExtraSpaces,
  removeDuplicateLines,
} from "./engine";

describe("Text Case Converter Engine", () => {
  it("converts to UPPERCASE and lowercase", () => {
    expect(toUpperCase("hello world")).toBe("HELLO WORLD");
    expect(toLowerCase("HELLO WORLD")).toBe("hello world");
  });

  it("converts to Title Case adhering to standard rules", () => {
    expect(toTitleCase("the lord of the rings")).toBe("The Lord of the Rings");
  });

  it("converts to Sentence case across multiple sentences", () => {
    expect(toSentenceCase("hello world. how ARE you? i am fine!")).toBe(
      "Hello world. How are you? I am fine!"
    );
  });

  it("capitalizes every word", () => {
    expect(toCapitalizedWords("quick brown fox")).toBe("Quick Brown Fox");
  });

  it("removes redundant whitespace", () => {
    expect(removeExtraSpaces("  hello    world   \n\n\n\n  new   line  ")).toBe(
      "hello world\n\nnew line"
    );
  });

  it("removes duplicate lines preserving order", () => {
    const input = "apple\nbanana\napple\norange\nbanana";
    expect(removeDuplicateLines(input)).toBe("apple\nbanana\norange");
  });
});
