import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const D = join(__dirname, '..', 'src', 'assets', 'characters', 'karua', 'animations', 'shaker')
const SHIFTS = { 'S1.png': -21, 'S2.png': -4, 'S3.png': -24, 'S4.png': -2 }
const SIZE = 649

async function shiftX(fp, dx) {
  const buf = await sharp(fp).ensureAlpha().raw().toBuffer()
  const out = Buffer.alloc(SIZE * SIZE * 4, 0)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const tx = x + dx
      if (tx < 0 || tx >= SIZE) continue
      const si = (y * SIZE + x) * 4
      if (buf[si + 3] === 0) continue
      const di = (y * SIZE + tx) * 4
      out[di] = buf[si]; out[di+1] = buf[si+1]; out[di+2] = buf[si+2]; out[di+3] = buf[si+3]
    }
  }
  return sharp(out, { raw: { width: SIZE, height: SIZE, channels: 4 } }).png().toBuffer()
}

for (const [f, dx] of Object.entries(SHIFTS)) {
  const fp = join(D, f)
  const result = await shiftX(fp, dx)
  writeFileSync(fp, result)
  console.log(`${f}: shifted X by ${dx}px`)
}
console.log('Done.')
