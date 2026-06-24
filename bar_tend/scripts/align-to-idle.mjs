import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = join(__dirname, '..', 'src', 'assets', 'characters', 'karua')
const STATIC_D = join(BASE, 'static')
const SHAKER_D = join(BASE, 'animations', 'shaker')
const FILES = ['S1.png', 'S2.png', 'S3.png', 'S4.png']
const REF = 'Kaura.png'
const T = 60

async function headTop(fp) {
  const { data, info } = await sharp(fp).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  for (let y = 0; y < h; y++) {
    let c = 0
    for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 0) c++
    if (c >= T) return y
  }
  return h
}

async function shiftImage(srcPath, shiftY, targetSize) {
  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const out = Buffer.alloc(targetSize * targetSize * 4, 0)
  const yStart = Math.max(0, -shiftY)
  const yEnd = Math.min(h, targetSize - shiftY)
  for (let y = yStart; y < yEnd; y++) {
    const ty = y + shiftY
    for (let x = 0; x < Math.min(w, targetSize); x++) {
      const si = (y * w + x) * 4
      if (data[si + 3] === 0) continue
      const di = (ty * targetSize + x) * 4
      out[di] = data[si]; out[di+1] = data[si+1]; out[di+2] = data[si+2]; out[di+3] = data[si+3]
    }
  }
  return sharp(out, { raw: { width: targetSize, height: targetSize, channels: 4 } }).png().toBuffer()
}

const targetSize = 649
const refPath = join(STATIC_D, REF)
const refHT = await headTop(refPath)
console.log(`${REF} head top Y=${refHT}, target canvas ${targetSize}x${targetSize}`)

for (const f of FILES) {
  const fp = join(SHAKER_D, f)
  const ht = await headTop(fp)
  const shiftY = refHT - ht
  console.log(`${f}: head top Y=${ht}, shift ${shiftY >= 0 ? 'down' : 'up'} ${Math.abs(shiftY)}px`)
  const buf = await shiftImage(fp, shiftY, targetSize)
  writeFileSync(fp, buf)
}

const metaPath = join(SHAKER_D, 'karua_shaker_sprite_metadata.json')
const meta = JSON.parse(readFileSync(metaPath, 'utf-8'))
meta.frame_width = targetSize
meta.frame_height = targetSize
meta.anchor = 'head top aligned to idle sprite'
meta.notes = `Top margin aligned to ${REF} (head top Y=${refHT}). ${targetSize}x${targetSize}.`
writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n')

console.log('Sprite alignment done.')
