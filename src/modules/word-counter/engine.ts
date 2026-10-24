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
  inputTooLarge: boolean;
}

export const MAX_TEXT_ANALYSIS_CHARACTERS = 1_000_000;

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
  const inputTooLarge = text.length > MAX_TEXT_ANALYSIS_CHARACTERS;
  const analysisText = inputTooLarge ? text.slice(0, MAX_TEXT_ANALYSIS_CHARACTERS) : text;

  if (!analysisText || analysisText.trim() === "") {
    return {
      words: 0,
      characters: text.length,
      charactersNoSpaces: text.replace(/\s/g, "").length,
      sentences: 0,
      paragraphs: 0,
      readingTimeMinutes: 0,
      speakingTimeMinutes: 0,
      readingTimeFormatted: "0 sec",
      speakingTimeFormatted: "0 sec",
      topKeywords: [],
      inputTooLarge,
    };
  }

  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;

  // Unicode-aware tokens with internal apostrophes and hyphens treated as one word.
  const wordsArray = analysisText.match(/[\p{L}\p{M}\p{N}]+(?:['’\-][\p{L}\p{M}\p{N}]+)*/gu) ?? [];
  const words = wordsArray.length;

  // Sentences: match ending punctuation followed by space or end of text
  const rawSentences = analysisText
    .split(/[.!?]+(?=\s|$)/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const sentences = rawSentences.length;

  // Paragraphs: non-empty chunks separated by one or more newlines
  const paragraphs = analysisText
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
  const wordFrequency = new Map<string, number>();
  for (const rawWord of wordsArray) {
    const word = rawWord.toLowerCase();
    if (word.length > 2) {
      if (filterStopWords && COMMON_STOP_WORDS.has(word)) {
        continue;
      }
      wordFrequency.set(word, (wordFrequency.get(word) ?? 0) + 1);
    }
  }

  const sortedKeywords = Array.from(wordFrequency.entries())
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
    inputTooLarge,
  };
}
