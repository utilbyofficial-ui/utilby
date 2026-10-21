import { describe, it, expect } from "vitest";
import {
  calculatePercentageOf,
  calculateWhatPercentageIs,
  calculatePercentageChange,
  calculateDiscount,
} from "./engine";

describe("Percentage Calculator Engine", () => {
  it("calculates percentage of a number", () => {
    const res = calculatePercentageOf(20, 150);
    expect(res.result).toBe(30);
  });

  it("calculates what percentage X is of Y", () => {
    const res = calculateWhatPercentageIs(25, 200);
    if ("result" in res) {
      expect(res.result).toBe(12.5);
    }
  });

  it("handles division by zero properly", () => {
    const res = calculateWhatPercentageIs(25, 0);
    expect("error" in res).toBe(true);
  });

  it("calculates percentage increase and decrease", () => {
    const inc = calculatePercentageChange(100, 150);
    if ("percentChange" in inc) {
      expect(inc.percentChange).toBe(50);
      expect(inc.type).toBe("increase");
    }

    const dec = calculatePercentageChange(200, 150);
    if ("percentChange" in dec) {
      expect(dec.percentChange).toBe(25);
      expect(dec.type).toBe("decrease");
    }
  });

  it("calculates discount and final price", () => {
    const res = calculateDiscount(100, 20);
    expect(res.discountAmount).toBe(20);
    expect(res.finalPrice).toBe(80);
  });
});
