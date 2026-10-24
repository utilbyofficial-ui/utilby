import { describe, it, expect } from "vitest";
import {
  planFit,
  planResize,
  heightForWidth,
  widthForHeight,
  buildResizedFilename,
  downscaleSteps,
  DEFAULT_RESIZE_SETTINGS,
} from "./engine";

const S = DEFAULT_RESIZE_SETTINGS;

describe("Image Resizer Engine", () => {
  it("cover crops the center to the target aspect", () => {
    const p = planFit(4000, 3000, 1080, 1080, "cover");
    expect(p).toMatchObject({ width: 1080, height: 1080, sx: 500, sy: 0, sw: 3000, sh: 3000, padded: false });
  });

  it("contain letterboxes without cropping", () => {
    const p = planFit(4000, 2000, 1000, 1000, "contain");
    expect(p).toMatchObject({ width: 1000, height: 1000, dx: 0, dy: 250, dw: 1000, dh: 500, padded: true });
  });

  it("stretch uses the full source and target", () => {
    const p = planFit(800, 600, 300, 300, "stretch");
    expect(p).toMatchObject({ sw: 800, sh: 600, dw: 300, dh: 300 });
  });

  it("pixel mode with locked aspect fits inside the box", () => {
    expect(planResize(4000, 3000, { ...S, width: 1920, height: 1080, lockAspect: true })).toMatchObject({
      width: 1440,
      height: 1080,
    });
    expect(planResize(4000, 3000, { ...S, width: 1000, height: 0, lockAspect: true })).toMatchObject({
      width: 1000,
      height: 750,
    });
  });

  it("percent mode scales both sides", () => {
    expect(planResize(3000, 2000, { ...S, mode: "percent", percent: 25 })).toMatchObject({ width: 750, height: 500 });
  });

  it("preset mode uses exact preset size", () => {
    expect(planResize(4000, 3000, { ...S, mode: "preset", presetId: "yt-thumb", fit: "cover" })).toMatchObject({
      width: 1280,
      height: 720,
    });
  });

  it("does not enlarge when noEnlarge is on", () => {
    expect(planResize(800, 600, { ...S, width: 1920, height: 1080, noEnlarge: true })).toMatchObject({
      width: 800,
      height: 600,
    });
  });

  it("computes linked dimensions and filenames", () => {
    expect(heightForWidth(1920, 4000, 3000)).toBe(1440);
    expect(widthForHeight(1080, 4000, 3000)).toBe(1440);
    expect(buildResizedFilename("trip.photo.JPG", 1080, 1080, "image/jpeg")).toBe("trip.photo-1080x1080.jpg");
  });

  it("chooses halving steps for big downscales", () => {
    expect(downscaleSteps(1, 1)).toBe(0);
    expect(downscaleSteps(5, 1)).toBe(2);
  });

  it("keeps requested canvas sizes inside the pixel memory budget", () => {
    const plan = planFit(1000, 1000, 16384, 16384, "stretch");
    expect(plan.width * plan.height).toBeLessThanOrEqual(32_000_000);
  });
});
