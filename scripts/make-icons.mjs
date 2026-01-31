import fs from "fs";
import path from "path";
import sharp from "sharp";

const outDir = path.join(process.cwd(), "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

// Un SVG simple (logo micro + texte)
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0ea5e9"/>
      <stop offset="1" stop-color="#1d4ed8"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <rect x="128" y="120" width="256" height="272" rx="48" fill="#0b1220" opacity="0.92"/>
  <path d="M256 178c-28 0-50 22-50 50v58c0 28 22 50 50 50s50-22 50-50v-58c0-28-22-50-50-50z"
        fill="#fff" opacity="0.95"/>
  <path d="M184 276c0 40 32 72 72 72s72-32 72-72"
        fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round" opacity="0.95"/>
  <path d="M256 348v44" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round" opacity="0.95"/>
  <path d="M220 392h72" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round" opacity="0.95"/>
</svg>
`;

async function main() {
  const base = sharp(Buffer.from(svg));

  // 512 icon
  await base.clone().resize(512, 512).png().toFile(path.join(outDir, "icon-512.png"));

  // 192 icon
  await base.clone().resize(192, 192).png().toFile(path.join(outDir, "icon-192.png"));

  // Apple touch icon (180)
  await base.clone().resize(180, 180).png().toFile(path.join(outDir, "apple-touch-icon.png"));

  // Maskable (512) : un peu plus “plein” (on garde pareil pour l’instant)
  await base.clone().resize(512, 512).png().toFile(path.join(outDir, "maskable-512.png"));

  console.log("✅ Icons generated in public/icons/");
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
