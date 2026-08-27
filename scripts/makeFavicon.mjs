import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

const svg = await readFile("public/favicon.svg");
const sizes = [16, 32, 48];

const pngBuffers = await Promise.all(
  sizes.map((s) => sharp(svg).resize(s, s).png().toBuffer()),
);

// Multi-page Windows ICO.
function buildIco(pages) {
  const dirEntries = [];
  const bodies = [];
  let offset = 6 + pages.length * 16;

  for (const page of pages) {
    const width = page.readUInt32BE(16) & 0xff;
    const height = page.readUInt32BE(20) & 0xff;
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width === 0 ? 0 : width, 0);
    entry.writeUInt8(height === 0 ? 0 : height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(page.length, 8);
    entry.writeUInt32LE(offset, 12);
    dirEntries.push(entry);
    bodies.push(page);
    offset += page.length;
  }

  const header = Buffer.from([0, 0, 1, 0, pages.length, 0, 0, 0]);
  return Buffer.concat([header, Buffer.concat(dirEntries), Buffer.concat(bodies)]);
}

await writeFile("public/favicon.ico", buildIco(pngBuffers));

// Apple touch icon (opaque, 180x180)
await sharp(svg)
  .resize({ width: 180, height: 180, fit: "contain", background: "#e8f1ff" })
  .flatten({ background: "#e8f1ff" })
  .png()
  .toFile("public/apple-touch-icon.png");

// PWA icons: 192, 512 (opaque).
for (const size of [192, 512]) {
  await sharp(svg)
    .resize({ width: size, height: size, fit: "contain", background: "#e8f1ff" })
    .flatten({ background: "#e8f1ff" })
    .png()
    .toFile(`public/icon-${size}.png`);
}

console.log("Favicon + PWA icons written.");