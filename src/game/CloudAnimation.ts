import { px, stepWave } from '../utils/pixel'

interface CloudPuff {
  ox: number
  oy: number
  rx: number
  ry: number
  alpha: number
}

const CLOUD_LAYOUTS: CloudPuff[][] = [
  [
    { ox: 0, oy: 0, rx: 34, ry: 18, alpha: 0.94 },
    { ox: -28, oy: 8, rx: 24, ry: 14, alpha: 0.88 },
    { ox: 30, oy: 6, rx: 26, ry: 15, alpha: 0.9 },
    { ox: -12, oy: -6, rx: 20, ry: 12, alpha: 0.82 },
    { ox: 16, oy: -4, rx: 22, ry: 13, alpha: 0.85 },
    { ox: 0, oy: 14, rx: 38, ry: 10, alpha: 0.35 },
  ],
  [
    { ox: 0, oy: 0, rx: 28, ry: 16, alpha: 0.92 },
    { ox: -22, oy: 5, rx: 20, ry: 12, alpha: 0.86 },
    { ox: 24, oy: 4, rx: 22, ry: 13, alpha: 0.88 },
    { ox: 8, oy: 12, rx: 30, ry: 9, alpha: 0.32 },
  ],
  [
    { ox: 0, oy: 0, rx: 40, ry: 20, alpha: 0.93 },
    { ox: -34, oy: 10, rx: 26, ry: 14, alpha: 0.87 },
    { ox: 36, oy: 8, rx: 28, ry: 15, alpha: 0.89 },
    { ox: -8, oy: -8, rx: 24, ry: 14, alpha: 0.8 },
    { ox: 0, oy: 16, rx: 44, ry: 11, alpha: 0.34 },
  ],
]

/** Soft layered cumulus with gentle bob and drift */
export function drawRealisticCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  worldTimeMs: number,
  variant: number,
): void {
  const layout = CLOUD_LAYOUTS[variant % CLOUD_LAYOUTS.length]
  const bob = stepWave(worldTimeMs * 0.00035 + variant * 1.4, 8) * 3
  const sway = Math.sin(worldTimeMs * 0.00055 + variant * 2.1) * 2
  const breathe = 1 + Math.sin(worldTimeMs * 0.00045 + variant) * 0.035

  ctx.save()
  ctx.imageSmoothingEnabled = true
  ctx.translate(x + sway, y + bob)

  for (const puff of layout) {
    const rx = puff.rx * scale * breathe
    const ry = puff.ry * scale * breathe
    ctx.beginPath()
    ctx.ellipse(puff.ox * scale, puff.oy * scale, rx, ry, 0, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(252, 252, 255, ${puff.alpha})`
    ctx.fill()
  }

  ctx.restore()
}

export function drawRealisticCloudLayer(
  ctx: CanvasRenderingContext2D,
  w: number,
  cloudOffset: number,
  worldTimeMs: number,
  minY: number,
  maxY: number,
  layer: { count: number; speed: number; alpha: number; scale: number; yBias: number },
): void {
  ctx.save()
  ctx.globalAlpha = layer.alpha

  for (let i = 0; i < layer.count; i++) {
    const speed = layer.speed * (0.85 + (i % 3) * 0.08)
    const cx = px(((i * 380 + cloudOffset * speed) % (w + 320)) - 160)
    const cy = px(minY + layer.yBias + (i * (maxY - minY)) / (layer.count + 1))
    drawRealisticCloud(ctx, cx, cy, layer.scale * (0.9 + (i % 2) * 0.15), worldTimeMs, i + layer.count)
  }

  ctx.restore()
}

export function drawSkyClouds(
  ctx: CanvasRenderingContext2D,
  w: number,
  cloudOffset: number,
  worldTimeMs: number,
  minY: number,
  maxY: number,
): void {
  drawRealisticCloudLayer(ctx, w, cloudOffset, worldTimeMs, minY, maxY, {
    count: 4,
    speed: 0.35,
    alpha: 0.55,
    scale: 0.85,
    yBias: 24,
  })
  drawRealisticCloudLayer(ctx, w, cloudOffset, worldTimeMs, minY, maxY, {
    count: 5,
    speed: 0.62,
    alpha: 0.78,
    scale: 1.05,
    yBias: 8,
  })
  drawRealisticCloudLayer(ctx, w, cloudOffset, worldTimeMs, minY, maxY, {
    count: 3,
    speed: 0.95,
    alpha: 0.92,
    scale: 1.25,
    yBias: 0,
  })
}
