import { describe, it, expect } from "vitest";
import { analyzeText } from "./engine";

describe("Word Counter Engine", () => {
  it("should handle empty or whitespace text", () => {
    const stats = analyzeText("");
    expect(stats.words).toBe(0);
    expect(stats.characters).toBe(0);
    expect(stats.sentences).toBe(0);

    const whitespaceStats = analyzeText("   \n\t  ");
    expect(whitespaceStats.words).toBe(0);
  });

  it("should correctly count words, characters and sentences", () => {
    const text = "Hello world! This is a simple test. How are you today?";
    const stats = analyzeText(text);

    expect(stats.words).toBe(11);
    expect(stats.sentences).toBe(3);
    expect(stats.paragraphs).toBe(1);
    expect(stats.characters).toBe(text.length);
    expect(stats.charactersNoSpaces).toBe(text.replace(/\s/g, "").length);
  });

  it("should count paragraphs across newlines", () => {
    const text = "Paragraph one is here.\n\nParagraph two is here.\n\nParagraph three.";
    const stats = analyzeText(text);

    expect(stats.paragraphs).toBe(3);
  });

  it("should calculate reading and speaking time", () => {
    const longText = new Array(400).fill("word").join(" ");
    const stats = analyzeText(longText);

    expect(stats.words).toBe(400);
    expect(stats.readingTimeMinutes).toBe(2); // 400 / 200 = 2
    expect(stats.speakingTimeMinutes).toBe(4); // 400 / 130 = 3.07 -> ceil 4
  });

  it("counts Unicode words and prototype-named keywords safely", () => {
    const stats = analyzeText("café naïve constructor constructor বাংলা বাংলা");
    expect(stats.words).toBe(6);
    expect(stats.topKeywords.find((item) => item.word === "constructor")?.count).toBe(2);
  });

  it("caps analysis work while preserving the full character count", () => {
    const text = "word ".repeat(250_001);
    const stats = analyzeText(text);
    expect(stats.inputTooLarge).toBe(true);
    expect(stats.characters).toBe(text.length);
    expect(stats.words).toBeLessThan(250_001);
  });
});
