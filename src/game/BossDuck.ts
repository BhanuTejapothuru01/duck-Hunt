import { Duck } from './Duck'
import { DUCK_WING_RATE_PER_MS } from './BirdAnimation'
import { fillPixelRect, PIXEL, px, pxg, stepFrame, clampSkyY, getSkyBounds, GAME_HEIGHT } from '../utils/pixel'

export interface BossProjectile {
  x: number
  y: number
  vx: number
  vy: number
  alive: boolean
  frame: number
}

export class BossDuck extends Duck {
  projectiles: BossProjectile[] = []
  private directionChangeTimer = 0
  private shootTimer = 0

  constructor(x: number, y: number, direction: 1 | -1, canvasWidth: number, speedMultiplier = 1) {
    super({ type: 'normal', x, y, direction, canvasWidth, speedMultiplier })
    this.type = 'boss'
    this.health = 20
    this.maxHealth = 20
    this.points = 1000
    this.speed = 2.5 * speedMultiplier
    this.width = 144
    this.height = 104
    this.spawnFrame = 12
  }

  override update(dt: number): void {
    this.animPhase += dt * 0.012
    this.wingPhase += dt * DUCK_WING_RATE_PER_MS * 0.55
    if (this.hitFlash > 0) this.hitFlash -= dt / 80

    if (this.spawnFrame > 0) {
      this.spawnFrame = Math.max(0, this.spawnFrame - dt / 66)
      return
    }

    if (this.dying) {
      this.dieTimer -= dt
      this.dieFrame = Math.min(5, Math.floor((800 - this.dieTimer) / 160))
      this.y += (3 + this.dieFrame) * (dt / 16)
      if (this.dieTimer <= 0) this.alive = false
      return
    }

    this.directionChangeTimer += dt
    if (this.directionChangeTimer > 2000) {
      this.directionChangeTimer = 0
      if (Math.random() > 0.5) this.direction *= -1 as 1 | -1
      const { minY, maxY } = getSkyBounds(GAME_HEIGHT)
      this.baseY = clampSkyY(this.baseY + (Math.random() > 0.5 ? 40 : -40), GAME_HEIGHT)
      this.baseY = Math.max(minY, Math.min(maxY, this.baseY))
    }

    this.x += this.speed * this.direction * (dt / 16)
    this.y = pxg(clampSkyY(this.baseY + stepFrame(this.animPhase, 4) * PIXEL))

    this.shootTimer += dt
    if (this.shootTimer > 1200) {
      this.shootTimer = 0
      this.shootEgg()
    }

    for (const p of this.projectiles) {
      if (!p.alive) continue
      p.x += p.vx * (dt / 16)
      p.y += p.vy * (dt / 16)
      p.frame += dt * 0.02
      if (p.y > GAME_HEIGHT + 40 || p.x < -20 || p.x > this.canvasWidth + 20) {
        p.alive = false
      }
    }
    this.projectiles = this.projectiles.filter((p) => p.alive)
  }

  private shootEgg(): void {
    this.projectiles.push({
      x: this.x + this.width / 2,
      y: this.y + this.height,
      vx: (Math.random() > 0.5 ? 2 : -2),
      vy: 4,
      alive: true,
      frame: 0,
    })
  }

  override draw(ctx: CanvasRenderingContext2D): void {
    if (this.spawnFrame <= 0 && stepFrame(this.animPhase, 4) % 2 === 0) {
      ctx.save()
      ctx.imageSmoothingEnabled = false
      ctx.globalAlpha = 0.35
      ctx.fillStyle = '#8b0000'
      const s = 8
      fillPixelRect(ctx, px(this.x - s), px(this.y - s), this.width + s * 2, this.height + s * 2)
      ctx.restore()
    }

    super.draw(ctx)

    ctx.imageSmoothingEnabled = false
    for (const p of this.projectiles) {
      const s = PIXEL
      const wobble = stepFrame(p.frame, 2) === 0 ? 0 : s
      ctx.fillStyle = '#f8f0d8'
      fillPixelRect(ctx, px(p.x - s), px(p.y - s + wobble), s * 2, s * 3)
      ctx.fillStyle = '#8b7355'
      fillPixelRect(ctx, px(p.x - s / 2), px(p.y + s), s, s)
    }
  }

  getHealthPercent(): number {
    return this.health / this.maxHealth
  }
}

export function projectileHitsPlayer(
  projectiles: BossProjectile[],
  crosshairX: number,
  crosshairY: number,
  radius = 15,
): boolean {
  for (const p of projectiles) {
    const dx = p.x - crosshairX
    const dy = p.y - crosshairY
    if (dx * dx + dy * dy < radius * radius) return true
  }
  return false
}

export function drawBossHealthBar(
  ctx: CanvasRenderingContext2D,
  boss: BossDuck,
  canvasWidth: number,
  worldTime: number,
): void {
  const s = PIXEL
  const barWidth = 320
  const barHeight = 16
  const x = px(canvasWidth / 2 - barWidth / 2)
  const y = 56
  const frame = stepFrame(worldTime * 0.004, 2)

  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#000'
  fillPixelRect(ctx, x - s, y - s, barWidth + s * 2, barHeight + s * 2)

  const hp = boss.getHealthPercent()
  const filled = px(barWidth * hp)
  ctx.fillStyle = '#e40000'
  fillPixelRect(ctx, x, y, filled, barHeight)
  ctx.fillStyle = '#404040'
  fillPixelRect(ctx, x + filled, y, barWidth - filled, barHeight)

  if (frame === 0) {
    ctx.fillStyle = '#fc6060'
    fillPixelRect(ctx, x, y, filled, s)
  }

  ctx.fillStyle = '#fcfcfc'
  ctx.font = '8px "Press Start 2P", monospace'
  ctx.textAlign = 'center'
  ctx.fillText('BOSS', canvasWidth / 2, y - 6)
}
