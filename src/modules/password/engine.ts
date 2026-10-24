export interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeAmbiguous: boolean;
}

export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  excludeAmbiguous: false,
};

const UPPERCASE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE_CHARS = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS_CHARS = "0123456789";
const SYMBOLS_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const AMBIGUOUS_CHARS = new Set(["{", "}", "[", "]", "(", ")", "/", "\\", "'", '"', "`", "~", ",", ";", ":", ".", "<", ">", "l", "1", "I", "O", "0", "o"]);

/** Returns an unbiased cryptographically secure integer in [0, max). */
function secureRandomInt(max: number): number {
  if (!Number.isSafeInteger(max) || max < 1 || max > 0x1_0000_0000) {
    throw new RangeError("The requested random range is invalid.");
  }
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== "function") {
    throw new Error("Secure random number generation is unavailable in this browser.");
  }
  const range = 0x1_0000_0000;
  const limit = Math.floor(range / max) * max;
  const value = new Uint32Array(1);
  do {
    cryptoApi.getRandomValues(value);
  } while (value[0]! >= limit);
  return value[0]! % max;
}

function filterChars(charSet: string, excludeAmbiguous: boolean): string {
  if (!excludeAmbiguous) return charSet;
  return charSet
    .split("")
    .filter((char) => !AMBIGUOUS_CHARS.has(char))
    .join("");
}

export function calculatePasswordEntropy(password: string, poolSize: number): {
  entropy: number;
  strength: "Very Weak" | "Weak" | "Strong" | "Very Strong";
  colorClass: string;
} {
  if (!password || !Number.isFinite(poolSize) || poolSize <= 0) {
    return { entropy: 0, strength: "Very Weak", colorClass: "text-red-500" };
  }

  const length = password.length;
  // Entropy = L * log2(PoolSize)
  const entropy = Math.round(length * (Math.log(poolSize) / Math.LN2));

  if (entropy < 36) {
    return { entropy, strength: "Very Weak", colorClass: "text-red-500" };
  } else if (entropy < 60) {
    return { entropy, strength: "Weak", colorClass: "text-amber-500" };
  } else if (entropy < 80) {
    return { entropy, strength: "Strong", colorClass: "text-emerald-500" };
  } else {
    return { entropy, strength: "Very Strong", colorClass: "text-green-600 font-semibold" };
  }
}

export function generateSecureRandomPassword(options: PasswordOptions): { password: string; poolSize: number } {
  let upper = options.includeUppercase ? filterChars(UPPERCASE_CHARS, options.excludeAmbiguous) : "";
  let lower = options.includeLowercase ? filterChars(LOWERCASE_CHARS, options.excludeAmbiguous) : "";
  let numbers = options.includeNumbers ? filterChars(NUMBERS_CHARS, options.excludeAmbiguous) : "";
  let symbols = options.includeSymbols ? filterChars(SYMBOLS_CHARS, options.excludeAmbiguous) : "";

  let fullPool = upper + lower + numbers + symbols;

  // Fallback if user unchecks all
  if (fullPool.length === 0) {
    lower = filterChars(LOWERCASE_CHARS, options.excludeAmbiguous);
    fullPool = lower;
  }

  const requestedLength = Number.isFinite(options.length) ? options.length : DEFAULT_PASSWORD_OPTIONS.length;
  const length = Math.max(6, Math.min(64, Math.round(requestedLength)));
  const chars: string[] = [];

  // Guarantee at least one character from each active category
  const guaranteedPools: string[] = [];
  if (upper) guaranteedPools.push(upper);
  if (lower) guaranteedPools.push(lower);
  if (numbers) guaranteedPools.push(numbers);
  if (symbols) guaranteedPools.push(symbols);

  // Add guaranteed chars
  for (const pool of guaranteedPools) {
    if (chars.length < length) {
      const randIndex = secureRandomInt(pool.length);
      chars.push(pool[randIndex]!);
    }
  }

  // Fill remaining length
  while (chars.length < length) {
    const randIndex = secureRandomInt(fullPool.length);
    chars.push(fullPool[randIndex]!);
  }

  // Fisher-Yates shuffle with CSPRNG
  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    const temp = chars[i]!;
    chars[i] = chars[j]!;
    chars[j] = temp;
  }

  return {
    password: chars.join(""),
    poolSize: fullPool.length,
  };
}

export function generateMultiplePasswords(count: number, options: PasswordOptions): string[] {
  const safeCount = Math.max(1, Math.min(10, Math.round(Number.isFinite(count) ? count : 1)));
  const passwords: string[] = [];
  for (let i = 0; i < safeCount; i++) {
    passwords.push(generateSecureRandomPassword(options).password);
  }
  return passwords;
}

export const PASSPHRASE_WORDS = [
  "amber", "apple", "beacon", "breeze", "bright", "cactus", "canyon", "castle",
  "cedar", "cloud", "clover", "comet", "coral", "crystal", "delta", "desert",
  "dolphin", "dragon", "eagle", "ember", "falcon", "feather", "forest", "galaxy",
  "glacier", "gold", "granite", "harbor", "haven", "hawk", "horizon", "island",
  "jasper", "journey", "jungle", "lagoon", "lantern", "leopard", "meadow", "meteor",
  "moon", "mountain", "nebula", "oasis", "ocean", "orbit", "otter", "panther",
  "pebble", "phoenix", "planet", "prairie", "quartz", "quiver", "radiant", "raven",
  "river", "rover", "ruby", "safari", "sailor", "shadow", "silver", "solar",
  "spark", "spirit", "spring", "stellar", "stream", "summit", "sunset", "thunder",
  "tiger", "timber", "titan", "topaz", "trail", "valley", "vessel", "vortex",
  "voyage", "walnut", "wave", "whisper", "willow", "winter", "wizard", "zenith"
];

export function generatePassphrase(
  wordCount: number = 4,
  separator: string = "-",
  capitalize: boolean = false,
  includeNumber: boolean = true
): string {
  const safeCount = Math.max(3, Math.min(8, Math.round(Number.isFinite(wordCount) ? wordCount : 4)));
  const words: string[] = [];

  for (let i = 0; i < safeCount; i++) {
    let word = PASSPHRASE_WORDS[secureRandomInt(PASSPHRASE_WORDS.length)]!;
    if (capitalize) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }
    words.push(word);
  }

  let result = words.join(separator);
  if (includeNumber) {
    const num = secureRandomInt(100);
    result += `${separator}${num}`;
  }
  return result;
}
