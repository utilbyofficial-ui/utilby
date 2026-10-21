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
  if (!password || poolSize <= 0) {
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

  const length = Math.max(6, Math.min(64, options.length));
  const chars: string[] = [];

  // Guarantee at least one character from each active category
  const guaranteedPools: string[] = [];
  if (upper) guaranteedPools.push(upper);
  if (lower) guaranteedPools.push(lower);
  if (numbers) guaranteedPools.push(numbers);
  if (symbols) guaranteedPools.push(symbols);

  // Secure randomness buffer using crypto
  const getRandomUint32 = (): number => {
    if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
      const arr = new Uint32Array(1);
      window.crypto.getRandomValues(arr);
      return arr[0]!;
    }
    // Node.js or fallback
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const cryptoNode = require("crypto");
      return cryptoNode.randomInt(0, 0xffffffff);
    } catch {
      return Math.floor(Math.random() * 0xffffffff);
    }
  };

  // Add guaranteed chars
  for (const pool of guaranteedPools) {
    if (chars.length < length) {
      const randIndex = getRandomUint32() % pool.length;
      chars.push(pool[randIndex]!);
    }
  }

  // Fill remaining length
  while (chars.length < length) {
    const randIndex = getRandomUint32() % fullPool.length;
    chars.push(fullPool[randIndex]!);
  }

  // Fisher-Yates shuffle with CSPRNG
  for (let i = chars.length - 1; i > 0; i--) {
    const j = getRandomUint32() % (i + 1);
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
  const safeCount = Math.max(1, Math.min(10, count));
  const passwords: string[] = [];
  for (let i = 0; i < safeCount; i++) {
    passwords.push(generateSecureRandomPassword(options).password);
  }
  return passwords;
}
