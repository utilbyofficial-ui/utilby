import { describe, it, expect, vi } from "vitest";
import {
  generateSecureRandomPassword,
  generateMultiplePasswords,
  calculatePasswordEntropy,
  generatePassphrase,
  DEFAULT_PASSWORD_OPTIONS,
} from "./engine";

describe("Password Generator Engine", () => {
  it("generates password with requested length", () => {
    const res = generateSecureRandomPassword({ ...DEFAULT_PASSWORD_OPTIONS, length: 24 });
    expect(res.password.length).toBe(24);
  });

  it("calculates high entropy for standard 16-char mixed password", () => {
    const res = generateSecureRandomPassword(DEFAULT_PASSWORD_OPTIONS);
    const entropyResult = calculatePasswordEntropy(res.password, res.poolSize);
    expect(entropyResult.entropy).toBeGreaterThanOrEqual(80);
    expect(entropyResult.strength).toBe("Very Strong");
  });

  it("respects exclusion of ambiguous characters", () => {
    const res = generateSecureRandomPassword({
      ...DEFAULT_PASSWORD_OPTIONS,
      length: 50,
      excludeAmbiguous: true,
    });
    // Check ambiguous chars: 'O', '0', 'l', '1', 'I'
    expect(res.password).not.toMatch(/[O0l1I{}[\]()/\'`~,;:.<>]/);
  });

  it("generates memorable passphrases", () => {
    const passphrase = generatePassphrase(4, "-", true, true);
    const parts = passphrase.split("-");
    expect(parts.length).toBe(5); // 4 words + 1 number
  });

  it("fails closed when cryptographic randomness is unavailable", () => {
    vi.stubGlobal("crypto", undefined);
    try {
      expect(() => generateSecureRandomPassword(DEFAULT_PASSWORD_OPTIONS)).toThrow(/Secure random/);
      expect(() => generatePassphrase()).toThrow(/Secure random/);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("normalizes invalid lengths and batch sizes", () => {
    expect(generateSecureRandomPassword({ ...DEFAULT_PASSWORD_OPTIONS, length: Number.NaN }).password).toHaveLength(16);
    expect(generateMultiplePasswords(Number.NaN, DEFAULT_PASSWORD_OPTIONS)).toHaveLength(1);
    expect(generatePassphrase(Number.NaN).split("-")).toHaveLength(5);
  });
});
