import type { DuckType } from '../types/game'
import type { Bounds } from './Collision'
import { drawAnimatedDuck, getDuckDrawSize } from './DuckSprite'
import { DUCK_WING_RATE_PER_MS } from './BirdAnimation'
import { PIXEL, px, pxg, stepFrame, stepWave, clampSkyY } from '../utils/pixel'

export interface DuckConfig {
  type: DuckType
  x: number
  y: number
  direction: 1 | -1
  canvasWidth: number
  speedMultiplier?: number
}

const DUCK_STATS: Record<
  Exclude<DuckType, 'boss'>,
  { speed: number; points: number; health: number; scale: number }
> = {
  normal: { speed: 1.35, points: 10, health: 1, scale: 1 },
  fast: { speed: 2.4, points: 25, health: 1, scale: 0.92 },
  zigzag: { speed: 2.0, points: 50, health: 1, scale: 0.96 },
  golden: { speed: 1.8, points: 100, health: 1, scale: 1.08 },
  ghost: { speed: 2.6, points: 150, health: 1, scale: 0.96 },
}

let nextId = 0

export class Duck {
  id: number
  x: number
  y: number
  baseY: number
  speed: number
  direction: 1 | -1
  health: number
  maxHealth: number
  type: DuckType
  points: number
  width: number
  height: number
  drawScale: number
  alive = true
  dying = false
  dieTimer = 0
  dieFrame = 0
  wingPhase = 0
  animPhase = 0
  zigzagPhase = 0
  teleportTimer = 0
  spawnFrame = 0
  hitFlash = 0
  ghostFading = false
  ghostFadeTimer = 0
  pendingTeleport = false
  canvasWidth: number
  onGhostTeleport?: () => void

  constructor(config: DuckConfig) {
    this.id = nextId++
    this.x = config.x
    this.y = config.y
    this.baseY = config.y
    this.direction = config.direction
    this.canvasWidth = config.canvasWidth
    this.type = config.type
    this.zigzagPhase = 0
    this.spawnFrame = 8

    const stats = DUCK_STATS[config.type as Exclude<DuckType, 'boss'>]
    const mult = config.speedMultiplier ?? 1
    this.speed = stats.speed * mult
    this.points = stats.points
    this.health = stats.health
    this.maxHealth = stats.health
    this.drawScale = stats.scale
    const size = getDuckDrawSize(stats.scale)
    this.width = size.width
    this.height = size.height
  }

  getBounds(): Bounds {
    const margin = PIXEL
    // Match the full duck draw box (sprite is left/right aligned inside, not centered)
    return {
      x: this.x + margin,
      y: this.y + margin,
      width: Math.max(PIXEL * 4, this.width - margin * 2),
      height: Math.max(PIXEL * 4, this.height - margin * 2),
    }
  }

  hit(): boolean {
    this.hitFlash = 6
    this.health--
    if (this.health <= 0) {
      this.die()
      return true
    }
    return false
  }

  die(): void {
    this.dying = true
    this.dieTimer = 800
    this.dieFrame = 0
  }

  update(dt: number): void {
    this.animPhase += dt * 0.012
    this.wingPhase +=
      dt *
      DUCK_WING_RATE_PER_MS *
      (this.type === 'fast' ? 1.8 : this.type === 'golden' ? 1.2 : 1)
    if (this.hitFlash > 0) this.hitFlash -= dt / 80

    if (this.spawnFrame > 0) {
      this.spawnFrame = Math.max(0, this.spawnFrame - dt / 50)
      return
    }

    if (this.dying) {
      this.dieTimer -= dt
      this.dieFrame = Math.min(5, Math.floor((800 - this.dieTimer) / 160))
      this.y += (2 + this.dieFrame) * (dt / 16)
      if (this.dieTimer <= 0) this.alive = false
      return
    }

    const bob = stepWave(this.animPhase, 4) * PIXEL
    this.x += this.speed * this.direction * (dt / 16)

    if (this.type === 'zigzag') {
      this.zigzagPhase += dt * 0.006
      const zigStep = stepWave(this.zigzagPhase, 8) * PIXEL * 2
      this.y = px(clampSkyY(this.baseY + zigStep + bob))
    } else {
      this.y = px(clampSkyY(this.baseY + bob))
    }

    if (this.type === 'ghost') {
      if (this.ghostFadeTimer > 0) {
        this.ghostFadeTimer -= dt
        if (this.ghostFadeTimer <= 0) {
          this.ghostFading = false
          if (this.pendingTeleport) {
            this.x = px(this.x + (Math.random() > 0.5 ? 160 : -160))
            this.y = px(clampSkyY(this.y + (Math.random() > 0.5 ? 56 : -56)))
            this.baseY = this.y
            this.pendingTeleport = false
            this.onGhostTeleport?.()
          }
        }
      } else {
        this.teleportTimer += dt
        if (this.teleportTimer > 1500) {
          this.teleportTimer = 0
          this.ghostFading = true
          this.ghostFadeTimer = 200
          this.pendingTeleport = true
        }
      }
    }
  }

  isOffScreen(): boolean {
    return this.x < -this.width - 20 || this.x > this.canvasWidth + 20
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.imageSmoothingEnabled = false

    const spawnScale = this.spawnFrame > 0 ? (8 - this.spawnFrame) / 8 : 1
    const wingFrame = stepFrame(this.wingPhase, 4)
    const flip = this.direction < 0

    let drawX = pxg(this.x)
    let drawY = pxg(this.y)

    if (this.dying) {
      drawX += this.dieFrame * 4 * this.direction
      drawY += this.dieFrame * 8
    }

    if (flip) {
      ctx.translate(drawX + this.width, drawY)
      ctx.scale(-spawnScale, spawnScale)
    } else {
      ctx.translate(drawX, drawY)
      ctx.scale(spawnScale, spawnScale)
    }

    const flash = this.hitFlash > 0 && stepFrame(this.hitFlash, 2) === 0

    if (this.type === 'ghost') {
      ctx.globalAlpha = this.ghostFading ? 0.15 : stepFrame(this.animPhase, 4) % 2 === 0 ? 0.45 : 0.65
    }

    if (this.type === 'golden' && stepFrame(this.animPhase, 4) % 2 === 0) {
      ctx.save()
      ctx.globalAlpha = 0.45
      ctx.filter = 'hue-rotate(35deg) saturate(1.4) brightness(1.1)'
      for (const [dx, dy] of [
        [-PIXEL, 0],
        [PIXEL, 0],
        [0, -PIXEL],
        [0, PIXEL],
      ] as const) {
        ctx.save()
        ctx.translate(dx, dy)
        drawAnimatedDuck(ctx, { wingFrame, scale: this.drawScale })
        ctx.restore()
      }
      ctx.restore()
    }

    let filter: string | undefined
    if (this.type === 'ghost') {
      filter = 'saturate(0.35) brightness(1.15)'
    } else if (this.type === 'fast') {
      filter = 'hue-rotate(-6deg) saturate(1.08)'
    }

    drawAnimatedDuck(ctx, { wingFrame, flash, scale: this.drawScale, filter })
    ctx.restore()
  }
}
