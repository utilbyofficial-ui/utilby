import sharp from "sharp";
import fs from "fs";
import path from "path";

const files = [
  { in: "public/brand-kit/01-icon-only-transparent/utilby-icon-dark.svg", out: "public/brand-kit/01-icon-only-transparent/utilby-icon-dark-2048.png", w: 2048, h: 2048 },
  { in: "public/brand-kit/01-icon-only-transparent/utilby-icon-white.svg", out: "public/brand-kit/01-icon-only-transparent/utilby-icon-white-2048.png", w: 2048, h: 2048 },
  { in: "public/brand-kit/02-glassmorphism-badge/utilby-glassmorphism-dark.svg", out: "public/brand-kit/02-glassmorphism-badge/utilby-glassmorphism-dark-2048.png", w: 2048, h: 2048 },
  { in: "public/brand-kit/02-glassmorphism-badge/utilby-glassmorphism-transparent.svg", out: "public/brand-kit/02-glassmorphism-badge/utilby-glassmorphism-transparent-2048.png", w: 2048, h: 2048 },
  { in: "public/brand-kit/03-vertical-stacked/utilby-vertical-dark.svg", out: "public/brand-kit/03-vertical-stacked/utilby-vertical-dark-2048.png", w: 1800, h: 2100 },
  { in: "public/brand-kit/03-vertical-stacked/utilby-vertical-white.svg", out: "public/brand-kit/03-vertical-stacked/utilby-vertical-white-2048.png", w: 1800, h: 2100 },
  { in: "public/brand-kit/04-horizontal-lockup/utilby-horizontal-dark.svg", out: "public/brand-kit/04-horizontal-lockup/utilby-horizontal-dark-2048.png", w: 2880, h: 1024 },
  { in: "public/brand-kit/04-horizontal-lockup/utilby-horizontal-white.svg", out: "public/brand-kit/04-horizontal-lockup/utilby-horizontal-white-2048.png", w: 2880, h: 1024 },
  { in: "public/brand-kit/05-app-icon-squircle/utilby-app-icon-dark.svg", out: "public/brand-kit/05-app-icon-squircle/utilby-app-icon-dark-2048.png", w: 2048, h: 2048 },
  { in: "public/brand-kit/05-app-icon-squircle/utilby-app-icon-light.svg", out: "public/brand-kit/05-app-icon-squircle/utilby-app-icon-light-2048.png", w: 2048, h: 2048 },
];

async function main() {
  for (const item of files) {
    if (!fs.existsSync(item.in)) {
      console.warn("Skipping missing file:", item.in);
      continue;
    }
    await sharp(item.in, { density: 300 })
      .resize(item.w, item.h)
      .png({ compressionLevel: 9 })
      .toFile(item.out);
    console.log(`Generated: ${item.out} (${item.w}x${item.h})`);
  }
}

main().catch(console.error);
