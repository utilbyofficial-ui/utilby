export interface WordStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
  readingTimeFormatted: string;
  speakingTimeFormatted: string;
  topKeywords: { word: string; count: number; percentage: number }[];
}

export const COMMON_STOP_WORDS = new Set([
  "the", "and", "a", "an", "in", "to", "of", "for", "with", "at", "by", "from", "up",
  "about", "into", "over", "after", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "but", "or", "as", "if", "when", "than",
  "so", "no", "not", "only", "own", "same", "can", "will", "just", "don", "should", "now",
  "it", "its", "this", "that", "these", "those", "you", "your", "he", "she", "they", "we",
  "i", "me", "my", "our", "all", "more"
]);

export function formatTimeEstimate(words: number, wpm: number): string {
  if (words <= 0) return "0 sec";
  const seconds = Math.round((words / wpm) * 60);
  if (seconds < 15) return "< 15 sec";
  if (seconds < 45) return `~${seconds} sec`;
  if (seconds < 90) return "~1 min";
  const minutes = Math.round(words / wpm);
  return `${minutes} min`;
}

export function analyzeText(text: string, options: { filterStopWords?: boolean } = {}): WordStats {
  const filterStopWords = options.filterStopWords ?? false;

  if (!text || text.trim() === "") {
    return {
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      readingTimeMinutes: 0,
      speakingTimeMinutes: 0,
      readingTimeFormatted: "0 sec",
      speakingTimeFormatted: "0 sec",
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
  const readingTimeFormatted = formatTimeEstimate(words, 200);

  // Speaking time: ~130 words per minute
  const speakingTimeMinutes = Math.ceil(words / 130);
  const speakingTimeFormatted = formatTimeEstimate(words, 130);

  // Keyword density
  const wordFrequency: Record<string, number> = {};
  for (const rawWord of wordsArray) {
    const word = rawWord.toLowerCase();
    if (word.length > 2) {
      if (filterStopWords && COMMON_STOP_WORDS.has(word)) {
        continue;
      }
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
    readingTimeFormatted,
    speakingTimeFormatted,
    topKeywords: sortedKeywords,
  };
}
