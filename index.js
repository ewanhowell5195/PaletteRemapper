import { loadImage, Canvas } from "skia-canvas"
import fs from "fs"
import path from "path"

const inputDir = "input"
const outputDir = "output"
const sourcePath = "source.png"
const fromMapPath = "map_from.png"
const toMapPath = "map_to.png"

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)

const srcImg = await loadImage(sourcePath)

const fromMapImg = await loadImage(fromMapPath)
const fromCtx = new Canvas(fromMapImg.width, fromMapImg.height).getContext("2d")
fromCtx.drawImage(fromMapImg, 0, 0)
const fromData = fromCtx.getImageData(0, 0, fromMapImg.width, fromMapImg.height).data
const fromMap = new Map()
for (let y = 0; y < fromMapImg.height; y++) {
  for (let x = 0; x < fromMapImg.width; x++) {
    const i = (y * fromMapImg.width + x) * 4
    if (fromData[i + 3] === 0) continue
    const key = `${fromData[i]},${fromData[i + 1]},${fromData[i + 2]},${fromData[i + 3]}`
    if (!fromMap.has(key)) fromMap.set(key, { x, y })
  }
}
console.log("Built mapping with", fromMap.size, "entries")

const toMapImg = await loadImage(toMapPath)
const toMapCtx = new Canvas(toMapImg.width, toMapImg.height).getContext("2d")
toMapCtx.drawImage(toMapImg, 0, 0)
const toMapData = toMapCtx.getImageData(0, 0, toMapImg.width, toMapImg.height).data

for (const file of fs.readdirSync(inputDir)) {
  if (!file.endsWith(".png")) continue

  const donorImg = await loadImage(path.join(inputDir, file))
  const donorCtx = new Canvas(donorImg.width, donorImg.height).getContext("2d")
  donorCtx.drawImage(donorImg, 0, 0)
  const donorData = donorCtx.getImageData(0, 0, donorImg.width, donorImg.height).data

  const donorColors = new Map()
  for (const [key, pos] of fromMap) {
    const i = (pos.y * fromMapImg.width + pos.x) * 4
    donorColors.set(key, [
      donorData[i],
      donorData[i + 1],
      donorData[i + 2],
      donorData[i + 3]
    ])
  }

  const srcCtx = new Canvas(srcImg.width, srcImg.height).getContext("2d")
  srcCtx.drawImage(srcImg, 0, 0)
  const srcData = srcCtx.getImageData(0, 0, srcImg.width, srcImg.height)

  let changed = 0
  for (const [key] of fromMap) {
    if (!donorColors.has(key)) continue

    let baseColor = null
    for (let y = 0; y < toMapImg.height && !baseColor; y++) {
      for (let x = 0; x < toMapImg.width; x++) {
        const i = (y * toMapImg.width + x) * 4
        const mapKey = `${toMapData[i]},${toMapData[i + 1]},${toMapData[i + 2]},${toMapData[i + 3]}`
        if (mapKey === key) {
          const si = (y * toMapImg.width + x) * 4
          baseColor = [
            srcData.data[si],
            srcData.data[si + 1],
            srcData.data[si + 2],
            srcData.data[si + 3]
          ]
          break
        }
      }
    }
    if (!baseColor) continue

    const replacement = donorColors.get(key)
    for (let j = 0; j < srcData.data.length; j += 4) {
      if (
        srcData.data[j] === baseColor[0] &&
        srcData.data[j + 1] === baseColor[1] &&
        srcData.data[j + 2] === baseColor[2] &&
        srcData.data[j + 3] === baseColor[3]
      ) {
        srcData.data[j] = replacement[0]
        srcData.data[j + 1] = replacement[1]
        srcData.data[j + 2] = replacement[2]
        srcData.data[j + 3] = replacement[3]
        changed++
      }
    }
  }

  console.log(`Generated recolored source.png using ${file} (${changed} pixels updated)`)
  srcCtx.putImageData(srcData, 0, 0)
  await srcCtx.canvas.toFile(path.join(outputDir, file))
}
