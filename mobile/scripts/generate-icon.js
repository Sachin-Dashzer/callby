// Zero-dependency icon generator — creates assets/icon.png, adaptive-icon.png, splash.png
// Design: indigo (#4F46E5) background with white "CT" block letters
// Run: node scripts/generate-icon.js

const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');

// ── CRC32 ──────────────────────────────────────────────────────────────────
const CRC = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC[i] = c;
}
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const mkChunk = (type, data) => {
  const t   = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
};

// ── PNG builder (RGBA, no alpha = full opaque) ─────────────────────────────
function buildPNG(size, pixels) {
  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA

  const stride = 1 + size * 4;
  const raw    = Buffer.alloc(size * stride);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const rgba = pixels[y * size + x];
      const off  = y * stride + 1 + x * 4;
      raw[off]   = (rgba >>> 24) & 255; // R
      raw[off+1] = (rgba >>> 16) & 255; // G
      raw[off+2] = (rgba >>> 8)  & 255; // B
      raw[off+3] =  rgba         & 255; // A
    }
  }
  const idat = mkChunk('IDAT', zlib.deflateSync(raw, { level: 6 }));
  return Buffer.concat([sig, mkChunk('IHDR', ihdr), idat, mkChunk('IEND', Buffer.alloc(0))]);
}

// ── Bitmap font (5 cols × 7 rows) ─────────────────────────────────────────
const GLYPHS = {
  C: [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,1],
    [0,1,1,1,0],
  ],
  T: [
    [1,1,1,1,1],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
  ],
};

// ── Icon pixel builder ─────────────────────────────────────────────────────
const SIZE   = 1024;
const INDIGO = 0x4F46E5FF; // background
const WHITE  = 0xFFFFFFFF; // letters

function makeIconPixels() {
  const pixels = new Uint32Array(SIZE * SIZE).fill(INDIGO);

  const cell = 74;  // px per bitmap cell
  const gap  = 52;  // space between C and T
  const COLS = 5, ROWS = 7;

  // Total text block dimensions
  const totalW = COLS * cell * 2 + gap;
  const totalH = ROWS * cell;
  const originX = ((SIZE - totalW) / 2) | 0;
  const originY = ((SIZE - totalH) / 2) | 0;

  const drawGlyph = (glyph, offX, offY) => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!glyph[r][c]) continue;
        for (let dy = 0; dy < cell; dy++) {
          for (let dx = 0; dx < cell; dx++) {
            const px = offX + c * cell + dx;
            const py = offY + r * cell + dy;
            if (px >= 0 && px < SIZE && py >= 0 && py < SIZE)
              pixels[py * SIZE + px] = WHITE;
          }
        }
      }
    }
  };

  drawGlyph(GLYPHS.C, originX, originY);
  drawGlyph(GLYPHS.T, originX + COLS * cell + gap, originY);

  return pixels;
}

// ── Splash pixel builder (just solid indigo, no text) ─────────────────────
function makeSplashPixels() {
  return new Uint32Array(SIZE * SIZE).fill(INDIGO);
}

// ── Write files ─────────────────────────────────────────────────────────────
const dir = path.resolve(__dirname, '..', 'assets');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

process.stdout.write('Generating icon… ');
const iconPng = buildPNG(SIZE, makeIconPixels());
fs.writeFileSync(path.join(dir, 'icon.png'), iconPng);
fs.writeFileSync(path.join(dir, 'adaptive-icon.png'), iconPng);
console.log('done');

process.stdout.write('Generating splash… ');
const splashPng = buildPNG(SIZE, makeSplashPixels());
fs.writeFileSync(path.join(dir, 'splash.png'), splashPng);
console.log('done');

console.log('\nFiles written:');
console.log('  assets/icon.png            (1024×1024)');
console.log('  assets/adaptive-icon.png   (1024×1024)');
console.log('  assets/splash.png          (1024×1024)');
console.log('\nNext step:');
console.log('  npx expo prebuild --clean');
console.log('  eas build --platform android --profile preview');
