import { describe, it, expect } from "vitest";
import {
  generateSecureRandomPassword,
  calculatePasswordEntropy,
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
});
