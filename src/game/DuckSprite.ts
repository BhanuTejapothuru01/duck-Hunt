import { px, stepFrame } from '../utils/pixel'

const SHEET_SRC = '/assets/duck-fly-sheet.png'

/** Sprite sheet extracted from https://pin.it/6oZ9kPNkQ */
const DUCK_FRAME_COUNT = 4
const DUCK_FRAME_W = 284
const DUCK_FRAME_H = 208
const DUCK_DRAW_WIDTH = 96

let sheetImage: HTMLImageElement | null = null
let loadPromise: Promise<HTMLImageElement | null> | null = null

export function getDuckDrawSize(scale = 1): { width: number; height: number } {
  const width = px(DUCK_DRAW_WIDTH * scale)
  const height = px((DUCK_DRAW_WIDTH * DUCK_FRAME_H) / DUCK_FRAME_W * scale)
  return { width, height }
}

export function preloadDuckSprite(): Promise<HTMLImageElement | null> {
  if (sheetImage) return Promise.resolve(sheetImage)
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      sheetImage = img
      resolve(img)
    }
    img.onerror = () => resolve(null)
    img.src = SHEET_SRC
  })

  return loadPromise
}

interface AnimatedDuckDrawOptions {
  wingFrame: number
  flash?: boolean
  scale?: number
  filter?: string
}

/** Draw Pinterest mallard wing flap at local origin (0, 0). Caller handles position / flip. */
export function drawAnimatedDuck(
  ctx: CanvasRenderingContext2D,
  options: AnimatedDuckDrawOptions,
): void {
  if (!sheetImage) {
    preloadDuckSprite()
    return
  }

  const { wingFrame, flash = false, scale = 1, filter } = options
  const frame = stepFrame(wingFrame, DUCK_FRAME_COUNT)
  const { width, height } = getDuckDrawSize(scale)

  ctx.save()
  ctx.imageSmoothingEnabled = false
  if (filter) ctx.filter = filter
  if (flash) {
    ctx.globalCompositeOperation = 'source-over'
    ctx.drawImage(
      sheetImage,
      frame * DUCK_FRAME_W,
      0,
      DUCK_FRAME_W,
      DUCK_FRAME_H,
      0,
      0,
      width,
      height,
    )
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = 0.75
    ctx.drawImage(
      sheetImage,
      frame * DUCK_FRAME_W,
      0,
      DUCK_FRAME_W,
      DUCK_FRAME_H,
      0,
      0,
      width,
      height,
    )
  } else {
    ctx.drawImage(
      sheetImage,
      frame * DUCK_FRAME_W,
      0,
      DUCK_FRAME_W,
      DUCK_FRAME_H,
      0,
      0,
      width,
      height,
    )
  }
  ctx.restore()
}

/** Hue-rotate filter for decorative ducks on the home screen */
export function duckTintFilter(color: string): string | undefined {
  const map: Record<string, string> = {
    '#8b4513': 'none',
    '#cd853f': 'hue-rotate(-8deg) saturate(1.1)',
    '#fcd800': 'hue-rotate(35deg) saturate(1.35) brightness(1.08)',
  }
  const filter = map[color.toLowerCase()]
  return filter && filter !== 'none' ? filter : undefined
}
