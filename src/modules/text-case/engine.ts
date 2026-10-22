export function toUpperCase(text: string): string {
  return text.toUpperCase();
}

export function toLowerCase(text: string): string {
  return text.toLowerCase();
}

export function toTitleCase(text: string): string {
  const minorWords = new Set(["a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "from", "by", "over", "in", "of", "with"]);

  return text.replace(/\w\S*/g, (word, index) => {
    const lower = word.toLowerCase();
    if (index !== 0 && minorWords.has(lower)) {
      return lower;
    }
    return lower.charAt(0).toUpperCase() + lower.substring(1);
  });
}

export function toSentenceCase(text: string): string {
  return text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
}

export function toCapitalizedWords(text: string): string {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}

function getWords(text: string): string[] {
  return text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_\-]+/g, " ")
    .split(/[^a-zA-Z0-9]+/g)
    .filter(Boolean);
}

export function toCamelCase(text: string): string {
  const words = getWords(text);
  if (words.length === 0) return "";
  return words
    .map((word, i) =>
      i === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join("");
}

export function toPascalCase(text: string): string {
  const words = getWords(text);
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

export function toSnakeCase(text: string): string {
  return getWords(text)
    .map((w) => w.toLowerCase())
    .join("_");
}

export function toKebabCase(text: string): string {
  return getWords(text)
    .map((w) => w.toLowerCase())
    .join("-");
}

export function toConstantCase(text: string): string {
  return getWords(text)
    .map((w) => w.toUpperCase())
    .join("_");
}

export function toInvertCase(text: string): string {
  return text
    .split("")
    .map((char) =>
      char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()
    )
    .join("");
}

export function removeExtraSpaces(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function removeDuplicateLines(text: string): string {
  const lines = text.split("\n");
  const seen = new Set<string>();
  const uniqueLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!seen.has(trimmed) || trimmed === "") {
      if (trimmed !== "") {
        seen.add(trimmed);
      }
      uniqueLines.push(line);
    }
  }

  return uniqueLines.join("\n");
}
