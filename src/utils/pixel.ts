/** Internal game resolution — wide 16:9 playfield, scaled up to fill the screen */
export const GAME_WIDTH = 1280
export const GAME_HEIGHT = 720

/** Size of one drawable pixel block in game coordinates */
export const PIXEL = 3

/** Snap value to integer pixel grid */
export function px(n: number): number {
  return Math.round(n)
}

/** Snap to PIXEL grid */
export function pxg(n: number): number {
  return Math.round(n / PIXEL) * PIXEL
}

/** Discrete animation frame 0..frames-1 from continuous phase */
export function stepFrame(phase: number, frames: number): number {
  return Math.floor(phase) % frames
}

/** Stepped triangle wave for bobbing / pulsing */
export function stepWave(phase: number, steps = 4): number {
  const f = stepFrame(phase, steps)
  return f < steps / 2 ? f : steps - 1 - f
}

export function setupPixelContext(ctx: CanvasRenderingContext2D): void {
  ctx.imageSmoothingEnabled = false
}

export function fillPixelRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.fillRect(pxg(x), pxg(y), px(w), px(h))
}

/**
 * Stretch game canvas to fill the entire container edge-to-edge (original fullscreen).
 */
export function stretchPixelCanvas(canvas: HTMLCanvasElement, container: HTMLElement): void {
  canvas.width = GAME_WIDTH
  canvas.height = GAME_HEIGHT

  canvas.style.position = 'absolute'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.imageRendering = 'pixelated'
  canvas.style.display = 'block'

  const ctx = canvas.getContext('2d')
  if (ctx) setupPixelContext(ctx)

  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative'
  }
}

/** Boost so hand travel reaches screen edges */
const AIM_GAIN = 1.5

function expandAim(v: number, gain = AIM_GAIN): number {
  return Math.max(0, Math.min(1, (v - 0.5) * gain + 0.5))
}

/** Map normalized hand position (0–1, mirrored X) to full game coordinates */
export function handToGame(
  normX: number,
  normY: number,
  aimGain = AIM_GAIN,
): { x: number; y: number } {
  const x = expandAim(normX, aimGain)
  const y = expandAim(normY, aimGain)

  return {
    x: px(x * (GAME_WIDTH - 1)),
    y: px(y * (GAME_HEIGHT - 1)),
  }
}

/** Convert game coords back to 0–100% for UI overlays */
export function gameToPercent(x: number, y: number): { x: number; y: number } {
  return {
    x: (x / (GAME_WIDTH - 1)) * 100,
    y: (y / (GAME_HEIGHT - 1)) * 100,
  }
}

/** Fixed height of the green ground band at the bottom (game pixels) */
export const GRASS_BAND_HEIGHT = 52

export function getGrassY(h: number = GAME_HEIGHT): number {
  return px(h - GRASS_BAND_HEIGHT)
}

export function getSkyBounds(h: number = GAME_HEIGHT): {
  grassY: number
  minY: number
  maxY: number
} {
  const grassY = getGrassY(h)
  const minY = PIXEL * 3
  const maxY = grassY - PIXEL * 10
  return { grassY, minY, maxY }
}

/** Random Y position within the sky zone */
export function randomSkyY(h: number = GAME_HEIGHT): number {
  const { minY, maxY } = getSkyBounds(h)
  return px(minY + Math.random() * Math.max(PIXEL, maxY - minY))
}

/** Clamp a Y value to stay in the sky */
export function clampSkyY(y: number, h: number = GAME_HEIGHT): number {
  const { minY, maxY } = getSkyBounds(h)
  return Math.max(minY, Math.min(maxY, y))
}
/** Classic NES-style banded sky */
export function drawPixelSky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): number {
  const grassY = getGrassY(h)
  const bands = ['#5c94fc', '#4a84ec', '#3a74dc', '#2a64cc']
  const bandH = Math.max(PIXEL, px(grassY / bands.length))
  bands.forEach((color, i) => {
    ctx.fillStyle = color
    ctx.fillRect(0, i * bandH, w, bandH + 1)
  })
  return grassY
}

export function drawPixelCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale = 3,
): void {
  const s = PIXEL * scale
  ctx.fillStyle = '#fcfcfc'
  const blocks = [
    [2, 1], [3, 0], [4, 0], [5, 0], [6, 0], [7, 1], [8, 1], [9, 2],
    [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2],
    [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3],
    [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4],
    [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5],
    [3, 6], [4, 6], [5, 6], [6, 6], [7, 6], [8, 6],
    [4, 7], [5, 7], [6, 7], [7, 7],
  ]
  for (const [bx, by] of blocks) {
    fillPixelRect(ctx, x + bx * s, y + by * s, s, s)
  }
  ctx.fillStyle = '#ececec'
  fillPixelRect(ctx, x + 3 * s, y + 5 * s, s * 3, s)
  fillPixelRect(ctx, x + 6 * s, y + 5 * s, s * 3, s)
  ctx.fillStyle = '#d8d8d8'
  fillPixelRect(ctx, x + 4 * s, y + 6 * s, s * 4, s)
  fillPixelRect(ctx, x + 5 * s, y + 7 * s, s * 2, s)
}

export function drawPixelSun(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number): void {
  const s = PIXEL
  ctx.fillStyle = '#fcd800'
  fillPixelRect(ctx, x - s, y - s, s * 3, s * 3)
  fillPixelRect(ctx, x - s * 2, y, s, s)
  fillPixelRect(ctx, x + s * 2, y, s, s)
  fillPixelRect(ctx, x, y - s * 2, s, s)
  fillPixelRect(ctx, x, y + s * 2, s, s)
  if (frame % 2 === 0) {
    ctx.fillStyle = '#f8b800'
    fillPixelRect(ctx, x - s * 3, y, s, s)
    fillPixelRect(ctx, x + s * 3, y, s, s)
    fillPixelRect(ctx, x, y - s * 3, s, s)
    fillPixelRect(ctx, x, y + s * 3, s, s)
  }
}

export function drawPixelCrosshair(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number): void {
  const s = PIXEL
  const arm = s * 6
  const thick = s * 3
  const cx = pxg(x)
  const cy = pxg(y)
  const pulse = frame % 2 === 0 ? 0 : s

  ctx.fillStyle = '#e40000'
  fillPixelRect(ctx, cx - arm - pulse, cy - thick / 2, thick, thick)
  fillPixelRect(ctx, cx + s + pulse, cy - thick / 2, thick, thick)
  fillPixelRect(ctx, cx - thick / 2, cy - arm - pulse, thick, thick)
  fillPixelRect(ctx, cx - thick / 2, cy + s + pulse, thick, thick)
  ctx.fillStyle = '#fff'
  fillPixelRect(ctx, cx - thick / 2, cy - thick / 2, thick, thick)
  ctx.fillStyle = '#e40000'
  fillPixelRect(ctx, cx - s / 2, cy - s / 2, s, s)
}

/** CRT scanline overlay drawn on top of game buffer */
export function drawScanlines(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.12)'
  for (let y = 0; y < h; y += PIXEL) {
    if (y % (PIXEL * 2) === 0) ctx.fillRect(0, y, w, PIXEL / 2)
  }
}

/** Darken vignette corners */
export function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const s = PIXEL * 3
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  fillPixelRect(ctx, 0, 0, w, s)
  fillPixelRect(ctx, 0, h - s, w, s)
  fillPixelRect(ctx, 0, 0, s, h)
  fillPixelRect(ctx, w - s, 0, s, h)
}
