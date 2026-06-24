import { fillPixelRect, PIXEL, px, pxg, stepFrame, stepWave } from '../utils/pixel'

/** Animated grass drawn inside the bottom ground band only */
export function drawAnimatedGrassField(
  ctx: CanvasRenderingContext2D,
  w: number,
  grassY: number,
  h: number,
  worldTime: number,
): void {
  const s = PIXEL
  const bandH = h - grassY

  // Solid ground fill — this is the "grass box"
  ctx.fillStyle = '#007000'
  ctx.fillRect(0, grassY, w, bandH)
  ctx.fillStyle = '#005800'
  for (let i = 0; i < w; i += s * 4) {
    fillPixelRect(ctx, i, grassY + s, s * 2, s)
  }

  // Horizon edge
  ctx.fillStyle = '#00c000'
  ctx.fillRect(0, grassY, w, s)

  // Tufts along the horizon (can poke slightly into sky)
  for (let i = 0; i < w; i += s) {
    const phase = i * 0.07 + worldTime * 0.002
    const sway = stepWave(phase, 6) * s
    const bladeH = s * 2 + (i % 3) * s + stepFrame(phase, 3) * s
    const shade = i % (s * 4) === 0 ? '#008800' : i % (s * 2) === 0 ? '#00a800' : '#00b800'

    ctx.fillStyle = shade
    fillPixelRect(ctx, i, grassY, s, Math.min(s, bandH))

    ctx.fillStyle = i % 2 === 0 ? '#00d800' : '#00c800'
    fillPixelRect(ctx, px(i + sway), grassY - bladeH + s, s, bladeH)
  }
}

/** Low round bush cluster on the horizon */
function drawPixelBush(
  ctx: CanvasRenderingContext2D,
  bx: number,
  grassY: number,
  sway: number,
  worldTime: number,
  variant = 0,
  scale = 1.4,
): void {
  const s = PIXEL * scale
  const ox = pxg(sway)
  const bob = stepWave(worldTime * 0.004 + variant, 4) * (s / 3)
  const shades = ['#145214', '#1a6b1a', '#228b22', '#2e9e2e', '#3cb03c']
  const clusters = [
    [-2, 1], [-1, 0], [0, 0], [1, 0], [2, 1],
    [-2, 2], [-1, 1], [0, 1], [1, 1], [2, 2],
    [-1, 3], [0, 2], [1, 3],
    [0, 3],
  ]
  const extra = variant % 3
  clusters.forEach(([cx, cy], i) => {
    ctx.fillStyle = shades[(i + variant + extra) % shades.length]
    fillPixelRect(ctx, bx + cx * s + ox, grassY - (cy + 1) * s + bob, s, s)
  })
  // wispy twigs on top
  if (stepFrame(worldTime * 0.006 + variant, 3) === 0) {
    ctx.fillStyle = '#0d4d0d'
    fillPixelRect(ctx, bx - s + ox, grassY - s * 5 + bob, s / 2, s)
    fillPixelRect(ctx, bx + s + ox, grassY - s * 4 + bob, s / 2, s)
  }
}

/** Bushes scattered along the tree line */
export function drawHorizonBushes(
  ctx: CanvasRenderingContext2D,
  w: number,
  grassY: number,
  worldTime: number,
): void {
  const bushCount = 14
  for (let i = 0; i < bushCount; i++) {
    const bx = px((i * 47 + 18) % w)
    const sway = stepWave(worldTime * 0.003 + i * 2.1, 5) * 4
    drawPixelBush(ctx, bx, grassY, sway, worldTime, i, 1.2 + (i % 3) * 0.2)
  }
}
