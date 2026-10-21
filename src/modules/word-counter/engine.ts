export interface WordStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
  topKeywords: { word: string; count: number; percentage: number }[];
}

export function analyzeText(text: string): WordStats {
  if (!text || text.trim() === "") {
    return {
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      readingTimeMinutes: 0,
      speakingTimeMinutes: 0,
      topKeywords: [],
    };
  }

  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;

  // Words matching (matches sequences of unicode letters/numbers, including hyphenated words)
  const wordsArray = text
    .trim()
    .split(/[\s\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-./:;<=>?@\[\]^_`{|}~]+/u)
    .filter((w) => w.length > 0);
  const words = wordsArray.length;

  // Sentences: match ending punctuation followed by space or end of text
  const rawSentences = text
    .split(/[.!?]+(?=\s|$)/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const sentences = rawSentences.length;

  // Paragraphs: non-empty chunks separated by one or more newlines
  const paragraphs = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0).length;

  // Reading time: ~200 words per minute
  const readingTimeMinutes = Math.ceil(words / 200);

  // Speaking time: ~130 words per minute
  const speakingTimeMinutes = Math.ceil(words / 130);

  // Keyword density (words > 2 characters)
  const wordFrequency: Record<string, number> = {};
  for (const rawWord of wordsArray) {
    const word = rawWord.toLowerCase();
    if (word.length > 2) {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }
  }

  const sortedKeywords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => ({
      word,
      count,
      percentage: words > 0 ? Number(((count / words) * 100).toFixed(1)) : 0,
    }));

  return {
    words,
    characters,
    charactersNoSpaces,
    sentences: sentences > 0 ? sentences : words > 0 ? 1 : 0,
    paragraphs: paragraphs > 0 ? paragraphs : words > 0 ? 1 : 0,
    readingTimeMinutes,
    speakingTimeMinutes,
    topKeywords: sortedKeywords,
  };
}
