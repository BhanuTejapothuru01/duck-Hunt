import type { DuckType } from '../types/game'
import { fillPixelRect, PIXEL, px, stepFrame } from '../utils/pixel'

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  type: 'pixel' | 'feather' | 'ring'
  frame: number
}

export class ParticleSystem {
  particles: Particle[] = []

  emitExplosion(x: number, y: number, color: string, count = 16): void {
    const dirs = [
      [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1],
    ]
    for (let i = 0; i < count; i++) {
      const d = dirs[i % dirs.length]
      const speed = 2 + (i % 3)
      this.particles.push({
        x: px(x),
        y: px(y),
        vx: d[0] * speed,
        vy: d[1] * speed,
        life: 4,
        maxLife: 4,
        color: i % 3 === 0 ? '#fff' : color,
        size: PIXEL,
        type: 'pixel',
        frame: 0,
      })
    }

    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: px(x),
        y: px(y),
        vx: (i % 2 === 0 ? 1 : -1),
        vy: -2 - (i % 2),
        life: 6,
        maxLife: 6,
        color: '#fff',
        size: PIXEL,
        type: 'feather',
        frame: i,
      })
    }

    this.particles.push({
      x: px(x),
      y: px(y),
      vx: 0,
      vy: 0,
      life: 5,
      maxLife: 5,
      color,
      size: PIXEL,
      type: 'ring',
      frame: 0,
    })
  }

  emitTrail(x: number, y: number, color: string): void {
    if (Math.random() > 0.5) return
    this.particles.push({
      x: px(x),
      y: px(y),
      vx: 0,
      vy: 0,
      life: 3,
      maxLife: 3,
      color,
      size: PIXEL,
      type: 'pixel',
      frame: 0,
    })
  }

  emitGhostTeleport(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = i / 8
      const dx = Math.round(Math.cos(angle * Math.PI * 2) * 3)
      const dy = Math.round(Math.sin(angle * Math.PI * 2) * 3)
      this.particles.push({
        x: px(x),
        y: px(y),
        vx: dx,
        vy: dy,
        life: 4,
        maxLife: 4,
        color: '#b0c4de',
        size: PIXEL,
        type: 'pixel',
        frame: i,
      })
    }
  }

  emitSpawnPuff(x: number, y: number): void {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: px(x + (i % 3 - 1) * 8),
        y: px(y),
        vx: 0,
        vy: -1 - (i % 2),
        life: 4,
        maxLife: 4,
        color: '#fcfcfc',
        size: PIXEL,
        type: 'pixel',
        frame: i,
      })
    }
  }

  update(dt: number): void {
    this.particles = this.particles.filter((p) => {
      if (stepFrame(p.frame + dt * 0.01, 2) === 0) {
        p.x = px(p.x + p.vx)
        p.y = px(p.y + p.vy)
      }
      p.vy += 0.15
      p.frame += dt * 0.01
      p.life -= dt / (p.maxLife * 80)
      return p.life > 0
    })
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.imageSmoothingEnabled = false
    for (const p of this.particles) {
      const alpha = p.life > 0.5 ? 1 : p.life > 0.25 ? 0.66 : 0.33
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color

      if (p.type === 'ring') {
        const ringSize = px(p.size + (1 - p.life) * 28)
        ctx.strokeStyle = p.color
        ctx.lineWidth = 4
        ctx.strokeRect(px(p.x - ringSize), px(p.y - ringSize), ringSize * 2, ringSize * 2)
      } else if (p.type === 'feather') {
        const rot = stepFrame(p.frame, 4) * 4
        fillPixelRect(ctx, px(p.x + rot), px(p.y), p.size, p.size / 2)
      } else {
        fillPixelRect(ctx, p.x, p.y, p.size, p.size)
      }
    }
    ctx.globalAlpha = 1
  }
}

export function getDuckColor(type: DuckType): string {
  switch (type) {
    case 'normal':
      return '#8B4513'
    case 'fast':
      return '#CD853F'
    case 'zigzag':
      return '#228B22'
    case 'golden':
      return '#FFD700'
    case 'ghost':
      return '#B0C4DE'
    case 'boss':
      return '#8B0000'
    default:
      return '#8B4513'
  }
}
