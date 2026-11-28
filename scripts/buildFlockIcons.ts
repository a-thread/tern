/**
 * Builds the ternary flock's tern icons in assets/flock/ from the "Arctic Tern Flying Logo"
 * silhouettes (2000×2000 PNGs, navy on transparent). Each pose is recoloured to its colour
 * in `flockColors` (src/shared/theme), in the order below, keeping the transparency; cropped
 * to the bird, centred on a square and scaled to 96 px.
 *
 *   npx tsx scripts/buildFlockIcons.ts "path/to/Arctic Tern Flying Logo"
 *
 * jimp-compact comes with Expo's image tools, so nothing extra needs installing. Change the
 * order here and `FlockIcons.SOURCES` in JourneyMap.tsx together.
 */
import { join } from 'node:path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Jimp = require('jimp-compact');
import { flockColors } from '../src/shared/theme';

const POSES = [
  'Banking Turn',
  'Curving Flight',
  'Downstroke',
  'Level Glide',
  'Rising Arc',
  'Sharp Sweep',
  'Streamlined Flight',
  'Upward Sweep',
];
const SIZE = 96;
const OUT = join(__dirname, '..', 'assets', 'flock');

const rgb = (hex: string) => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
});

async function main() {
  const source = process.argv[2];
  if (!source) throw new Error('Pass the folder of tern silhouettes');
  for (const [i, pose] of POSES.entries()) {
    const ink = rgb(flockColors[i]);
    const img = await Jimp.read(join(source, `${pose}.png`));
    const { width, height, data } = img.bitmap;
    let minX = width, minY = height, maxX = 0, maxY = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = (y * width + x) * 4;
        if (data[p + 3] > 10) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
        data[p] = ink.r;
        data[p + 1] = ink.g;
        data[p + 2] = ink.b;
      }
    }
    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    const side = Math.max(w, h);
    img.crop(minX, minY, w, h);
    const square = new Jimp(side, side, 0x00000000);
    square.composite(img, Math.round((side - w) / 2), Math.round((side - h) / 2));
    square.resize(SIZE, SIZE, Jimp.RESIZE_BICUBIC);
    const name = `flock-${pose.toLowerCase().replace(/\s+/g, '-')}.png`;
    await square.writeAsync(join(OUT, name));
    console.log(`${name} in ${flockColors[i]}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
