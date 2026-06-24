import { fillPixelRect, PIXEL, px, pxg, stepFrame } from '../utils/pixel'

interface FloatingText {
  x: number
  y: number
  text: string
  life: number
  maxLife: number
  color: string
  step: number
}

interface Ripple {
  x: number
  y: number
  frame: number
  maxFrames: number
  color: string
}

interface MuzzleRay {
  dir: number
  life: number
}

export class AnimationEffects {
  floatingTexts: FloatingText[] = []
  ripples: Ripple[] = []
  muzzleRays: MuzzleRay[] = []
  screenShake = 0
  levelFlash = 0
  comboBurst = 0
  comboBurstX = 0
  comboBurstY = 0

  addScorePopup(x: number, y: number, points: number, combo: number): void {
    const text = combo >= 2 ? `+${points} x${combo}!` : `+${points}`
    this.floatingTexts.push({
      x: pxg(x),
      y: pxg(y),
      text,
      life: 8,
      maxLife: 8,
      color: combo >= 3 ? '#fcd800' : combo >= 2 ? '#fc8000' : '#fcfcfc',
      step: 0,
    })
  }

  addMissRipple(x: number, y: number): void {
    this.ripples.push({
      x: pxg(x),
      y: pxg(y),
      frame: 0,
      maxFrames: 4,
      color: '#e40000',
    })
  }

  addMuzzleFlash(x: number, y: number): void {
    const dirs = [0, 1, 2, 3, 4, 5, 6, 7]
    for (const d of dirs) {
      this.muzzleRays.push({ dir: d, life: 3 })
    }
    this.ripples.push({
      x: pxg(x),
      y: pxg(y),
      frame: 0,
      maxFrames: 3,
      color: '#fcd800',
    })
  }

  shake(intensity = 8): void {
    this.screenShake = Math.max(this.screenShake, intensity)
  }

  triggerComboBurst(x: number, y: number): void {
    this.comboBurst = 6
    this.comboBurstX = px(x)
    this.comboBurstY = px(y)
  }

  triggerLevelFlash(): void {
    this.levelFlash = 8
  }

  update(dt: number): void {
    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 0.06)
    if (this.levelFlash > 0) this.levelFlash = Math.max(0, this.levelFlash - dt / 120)
    if (this.comboBurst > 0) this.comboBurst = Math.max(0, this.comboBurst - dt / 100)

    this.floatingTexts = this.floatingTexts.filter((t) => {
      t.step += dt / 120
      if (Math.floor(t.step) > Math.floor(t.step - dt / 120)) {
        t.y -= 8
      }
      t.life -= dt / (t.maxLife * 100)
      return t.life > 0
    })

    this.ripples = this.ripples.filter((r) => {
      r.frame += dt / 100
      return r.frame < r.maxFrames
    })

    this.muzzleRays = this.muzzleRays.filter((r) => {
      r.life -= dt / 80
      return r.life > 0
    })
  }

  draw(ctx: CanvasRenderingContext2D, crosshairX: number, crosshairY: number): void {
    ctx.imageSmoothingEnabled = false
    const s = PIXEL

    for (const r of this.ripples) {
      const size = px(s * (2 + Math.floor(r.frame)))
      ctx.strokeStyle = r.color
      ctx.lineWidth = 4
      ctx.strokeRect(px(r.x - size), px(r.y - size), size * 2, size * 2)
    }

    const rayDirs = [
      [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1],
    ]
    for (const ray of this.muzzleRays) {
      const d = rayDirs[ray.dir]
      const len = px(s * 3 * ray.life)
      ctx.fillStyle = '#fcd800'
      fillPixelRect(
        ctx,
        crosshairX + d[0] * s * 2,
        crosshairY + d[1] * s * 2,
        d[0] === 0 ? s : len,
        d[1] === 0 ? s : len,
      )
    }

    for (const t of this.floatingTexts) {
      const frame = stepFrame(t.life * 8, 4)
      ctx.globalAlpha = frame < 3 ? 1 : 0.5
      ctx.fillStyle = t.color
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 4
      ctx.font = '8px "Press Start 2P", monospace'
      ctx.textAlign = 'center'
      ctx.strokeText(t.text, t.x, t.y)
      ctx.fillText(t.text, t.x, t.y)
    }

    if (this.comboBurst > 0) {
      const ring = px(s * (4 - Math.floor(this.comboBurst / 2)))
      ctx.strokeStyle = '#fcd800'
      ctx.lineWidth = 4
      ctx.strokeRect(
        this.comboBurstX - ring,
        this.comboBurstY - ring,
        ring * 2,
        ring * 2,
      )
    }

    ctx.globalAlpha = 1
  }

  drawLevelFlash(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (this.levelFlash > 0 && stepFrame(this.levelFlash, 2) === 0) {
      ctx.fillStyle = 'rgba(252,216,0,0.35)'
      ctx.fillRect(0, 0, w, h)
    }
  }
}
