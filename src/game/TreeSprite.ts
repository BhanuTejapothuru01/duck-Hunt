import { px, pxg, stepWave } from '../utils/pixel'

const TREE_SRC = '/assets/tree.png'

let treeImage: HTMLImageElement | null = null
let loadPromise: Promise<HTMLImageElement | null> | null = null

export function preloadTreeSprite(): Promise<HTMLImageElement | null> {
  if (treeImage) return Promise.resolve(treeImage)
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      treeImage = img
      resolve(img)
    }
    img.onerror = () => resolve(null)
    img.src = TREE_SRC
  })

  return loadPromise
}

/** Draw the tree sprite with gentle sway animation, rooted at grassY */
export function drawRealisticPixelTree(
  ctx: CanvasRenderingContext2D,
  tx: number,
  grassY: number,
  sway: number,
  worldTime: number,
  variant = 0,
  scale = 2,
): void {
  if (!treeImage) {
    preloadTreeSprite()
    return
  }

  const sizeScale = 0.55 + (variant % 3) * 0.12
  const treeH = px(58 * scale * sizeScale)
  const treeW = px((treeImage.width / treeImage.height) * treeH)

  const bob = stepWave(worldTime * 0.003 + variant * 1.3, 6) * 2
  const swayRad = (sway + bob) * 0.008

  ctx.save()
  ctx.imageSmoothingEnabled = true
  ctx.translate(pxg(tx), grassY)
  ctx.rotate(swayRad)
  ctx.drawImage(treeImage, -treeW / 2, -treeH, treeW, treeH)
  ctx.restore()
}
