import { Duck } from './Duck'
import { BossDuck, drawBossHealthBar, projectileHitsPlayer } from './BossDuck'
import { circleInBounds } from './Collision'
import { getLevelConfig, pickDuckType } from './Levels'
import { ParticleSystem, getDuckColor } from './Particles'
import { AnimationEffects } from './Animations'
import { drawAnimatedGrassField, drawHorizonBushes } from './PixelArt'
import { drawSkyBirds } from './BirdAnimation'
import { drawSkyClouds } from './CloudAnimation'
import { drawRealisticPixelTree, preloadTreeSprite } from './TreeSprite'
import { preloadDuckSprite } from './DuckSprite'
import type { GameSettings } from '../types/game'
import { SENSITIVITY_MAP } from '../types/game'
import { audioManager } from '../audio/AudioManager'
import { lerp } from '../utils/lerp'
import {
  drawPixelCrosshair,
  drawPixelSky,
  drawPixelSun,
  drawScanlines,
  drawVignette,
  GAME_HEIGHT,
  GAME_WIDTH,
  getSkyBounds,
  px,
  setupPixelContext,
  stepFrame,
  stepWave,
  randomSkyY,
} from '../utils/pixel'

export interface EngineCallbacks {
  onScoreChange: (score: number) => void
  onLivesChange: (lives: number) => void
  onLevelChange: (level: number) => void
  onComboChange: (combo: number) => void
  onGameOver: (finalScore: number) => void
  onLevelComplete: () => void
}

export class GameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private ducks: (Duck | BossDuck)[] = []
  private particles = new ParticleSystem()
  private effects = new AnimationEffects()
  private animationId: number | null = null
  private lastTime = 0
  private running = false

  crosshairX = 0
  crosshairY = 0
  targetCrosshairX = 0
  targetCrosshairY = 0

  score = 0
  lives = 5
  level = 1
  combo = 0
  comboTimer = 0

  private ducksSpawned = 0
  private ducksEscaped = 0
  private spawnTimer = 0
  private levelConfig = getLevelConfig(1, 'normal')
  private settings: GameSettings
  private callbacks: EngineCallbacks

  worldTime = 0
  cloudOffset = 0
  crosshairPulse = 0

  constructor(
    canvas: HTMLCanvasElement,
    settings: GameSettings,
    callbacks: EngineCallbacks,
  ) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get canvas context')
    this.ctx = ctx
    this.settings = settings
    this.callbacks = callbacks

    this.crosshairX = GAME_WIDTH / 2
    this.crosshairY = GAME_HEIGHT / 2
    this.targetCrosshairX = this.crosshairX
    this.targetCrosshairY = this.crosshairY
  }

  resize(): void {
    this.canvas.width = GAME_WIDTH
    this.canvas.height = GAME_HEIGHT
    setupPixelContext(this.ctx)
    this.crosshairX = Math.min(this.crosshairX, GAME_WIDTH)
    this.crosshairY = Math.min(this.crosshairY, GAME_HEIGHT)
  }

  updateSettings(settings: GameSettings): void {
    this.settings = settings
  }

  start(): void {
    preloadTreeSprite()
    preloadDuckSprite()
    this.running = true
    this.score = 0
    this.lives = 5
    this.level = 1
    this.combo = 0
    this.ducks = []
    this.ducksSpawned = 0
    this.ducksEscaped = 0
    this.worldTime = 0
    this.levelConfig = getLevelConfig(this.level, this.settings.difficulty)
    this.callbacks.onScoreChange(this.score)
    this.callbacks.onLivesChange(this.lives)
    this.callbacks.onLevelChange(this.level)
    this.callbacks.onComboChange(this.combo)
    this.lastTime = performance.now()
    this.loop(this.lastTime)
  }

  stop(): void {
    this.running = false
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  setCrosshairTarget(x: number, y: number): void {
    this.targetCrosshairX = Math.max(0, Math.min(GAME_WIDTH - 1, x))
    this.targetCrosshairY = Math.max(0, Math.min(GAME_HEIGHT - 1, y))
  }

  /** Aim point used for shooting — matches where crosshair is drawn */
  private getAimPoint(): { x: number; y: number } {
    return { x: this.targetCrosshairX, y: this.targetCrosshairY }
  }

  shoot(): boolean {
    if (!this.running) return false

    const aim = this.getAimPoint()

    audioManager.play('shoot')
    this.effects.addMuzzleFlash(aim.x, aim.y)
    this.crosshairPulse = 1
    // Snap visual crosshair to aim on shot
    this.crosshairX = aim.x
    this.crosshairY = aim.y

    let hit = false
    for (const duck of this.ducks) {
      if (!duck.alive || duck.dying) continue
      const bounds = duck.getBounds()
      if (circleInBounds(aim.x, aim.y, 48, bounds)) {
        const killed = duck.hit()
        hit = true
        if (killed) {
          this.combo++
          this.comboTimer = 3000
          const comboMultiplier = Math.min(this.combo, 10)
          const points = duck.points * comboMultiplier
          this.score += points
          this.callbacks.onScoreChange(this.score)
          this.callbacks.onComboChange(this.combo)

          audioManager.play(this.combo >= 3 ? 'combo' : 'hit')
          this.particles.emitExplosion(
            duck.x + duck.width / 2,
            duck.y + duck.height / 2,
            getDuckColor(duck.type),
          )
          this.effects.addScorePopup(
            duck.x + duck.width / 2,
            duck.y,
            points,
            comboMultiplier,
          )
          this.effects.shake(duck.type === 'boss' ? 12 : 6)
          if (this.combo >= 3) {
            this.effects.triggerComboBurst(aim.x, aim.y)
          }

          if (duck.type === 'boss') {
            audioManager.play('boss')
          }
        } else {
          audioManager.play('hit')
          this.effects.shake(3)
        }
        break
      }
    }

    if (!hit) {
      this.combo = 0
      this.callbacks.onComboChange(this.combo)
      audioManager.play('miss')
      this.effects.addMissRipple(aim.x, aim.y)
    }

    return hit
  }

  private loop = (time: number): void => {
    if (!this.running) return
    const dt = Math.min(time - this.lastTime, 50)
    this.lastTime = time

    this.update(dt)
    this.draw()

    this.animationId = requestAnimationFrame(this.loop)
  }

  private update(dt: number): void {
    const sensitivity = SENSITIVITY_MAP[this.settings.sensitivity]

    this.worldTime += dt
    this.crosshairX = lerp(this.crosshairX, this.targetCrosshairX, sensitivity)
    this.crosshairY = lerp(this.crosshairY, this.targetCrosshairY, sensitivity)

    if (this.crosshairPulse > 0) this.crosshairPulse = Math.max(0, this.crosshairPulse - dt * 0.008)
    if (this.comboTimer > 0) {
      this.comboTimer -= dt
      if (this.comboTimer <= 0) {
        this.combo = 0
        this.callbacks.onComboChange(this.combo)
      }
    }

    this.cloudOffset += dt * 0.014

    this.spawnTimer += dt
    if (
      !this.levelConfig.isBoss &&
      this.ducksSpawned < this.levelConfig.duckCount &&
      this.spawnTimer >= this.levelConfig.spawnInterval
    ) {
      this.spawnTimer = 0
      this.spawnDuck()
    }

    if (
      this.levelConfig.isBoss &&
      this.ducks.length === 0 &&
      this.ducksSpawned === 0
    ) {
      this.spawnBoss()
      this.ducksSpawned = 1
    }

    for (const duck of this.ducks) {
      duck.update(dt)

      if (!duck.dying && duck.spawnFrame <= 0) {
        if (duck.type === 'golden' || duck.type === 'fast') {
          this.particles.emitTrail(
            duck.x + duck.width / 2,
            duck.y + duck.height / 2,
            getDuckColor(duck.type),
          )
        }
      }

      if (duck instanceof BossDuck && !duck.dying) {
        if (projectileHitsPlayer(duck.projectiles, this.targetCrosshairX, this.targetCrosshairY)) {
          this.lives--
          this.callbacks.onLivesChange(this.lives)
          duck.projectiles.forEach((p) => (p.alive = false))
          this.effects.shake(10)
          if (this.lives <= 0) this.endGame()
        }
      }
    }

    const escaped = this.ducks.filter((d) => d.alive && !d.dying && d.isOffScreen())
    for (const duck of escaped) {
      duck.alive = false
      this.ducksEscaped++
      this.lives--
      this.callbacks.onLivesChange(this.lives)
      this.combo = 0
      this.callbacks.onComboChange(this.combo)
      this.effects.shake(5)
      if (this.lives <= 0) this.endGame()
    }

    this.ducks = this.ducks.filter((d) => d.alive)

    this.particles.update(dt)
    this.effects.update(dt)

    if (!this.levelConfig.isBoss) {
      if (
        this.ducksSpawned >= this.levelConfig.duckCount &&
        this.ducks.length === 0
      ) {
        this.advanceLevel()
      }
    } else if (this.ducks.length === 0 && this.ducksSpawned >= 1) {
      this.advanceLevel()
    }
  }

  private spawnDuck(): void {
    const type = pickDuckType(this.levelConfig.duckTypes)
    const direction: 1 | -1 = Math.random() > 0.5 ? 1 : -1
    const x = direction === 1 ? -60 : this.canvas.width + 12
    const y = randomSkyY(this.canvas.height)

    const duck = new Duck({
      type,
      x,
      y,
      direction,
      canvasWidth: this.canvas.width,
      speedMultiplier: this.levelConfig.speedMultiplier,
    })

    if (type === 'ghost') {
      duck.onGhostTeleport = () => {
        this.particles.emitGhostTeleport(duck.x + duck.width / 2, duck.y + duck.height / 2)
      }
    }

    this.particles.emitSpawnPuff(x + duck.width / 2, y + duck.height / 2)
    this.ducks.push(duck)
    this.ducksSpawned++
  }

  private spawnBoss(): void {
    const direction: 1 | -1 = 1
    const boss = new BossDuck(
      this.canvas.width / 2 - 144,
      randomSkyY(this.canvas.height) * 0.4 + 32,
      direction,
      this.canvas.width,
      this.levelConfig.speedMultiplier,
    )
    this.particles.emitSpawnPuff(boss.x + boss.width / 2, boss.y + boss.height / 2)
    this.effects.shake(15)
    this.effects.triggerLevelFlash()
    this.ducks.push(boss)
    audioManager.play('boss')
  }

  private advanceLevel(): void {
    this.level++
    this.ducksSpawned = 0
    this.ducksEscaped = 0
    this.spawnTimer = 0
    this.levelConfig = getLevelConfig(this.level, this.settings.difficulty)
    this.effects.triggerLevelFlash()
    this.callbacks.onLevelChange(this.level)
    this.callbacks.onLevelComplete()
  }

  private endGame(): void {
    this.running = false
    audioManager.play('gameover')
    this.callbacks.onGameOver(this.score)
  }

  private draw(): void {
    const { ctx, canvas, effects } = this
    const w = canvas.width
    const h = canvas.height

    ctx.save()
    if (effects.screenShake > 0) {
      const shake = px(effects.screenShake / 2) * 2
      const sx = stepFrame(this.worldTime * 0.05, 4) % 2 === 0 ? shake : -shake
      const sy = stepFrame(this.worldTime * 0.07, 4) % 2 === 0 ? -shake : shake
      ctx.translate(sx, sy)
    }

    setupPixelContext(ctx)
    const grassY = drawPixelSky(ctx, w, h)

    this.drawSun(ctx, w)
    const { minY, maxY } = getSkyBounds(GAME_HEIGHT)
    drawSkyClouds(ctx, w, this.cloudOffset, this.worldTime, minY, maxY)
    drawSkyBirds(ctx, w, this.worldTime, this.level)
    this.drawTrees(ctx, w, grassY)

    ctx.fillStyle = '#00a800'
    ctx.fillRect(0, grassY, w, h - grassY)
    drawAnimatedGrassField(ctx, w, grassY, h, this.worldTime)

    for (const duck of this.ducks) {
      duck.draw(ctx)
    }

    this.particles.draw(ctx)
    effects.draw(ctx, this.targetCrosshairX, this.targetCrosshairY)

    const boss = this.ducks.find((d) => d instanceof BossDuck && !d.dying) as BossDuck | undefined
    if (boss) drawBossHealthBar(ctx, boss, w, this.worldTime)

    this.drawCrosshair(ctx)
    ctx.restore()

    effects.drawLevelFlash(ctx, w, h)

    drawScanlines(ctx, w, h)
    drawVignette(ctx, w, h)
  }

  private drawSun(ctx: CanvasRenderingContext2D, w: number): void {
    const { minY } = getSkyBounds(GAME_HEIGHT)
    drawPixelSun(ctx, w - 144, minY + 16, stepFrame(this.worldTime * 0.003, 2))
  }

  private drawTrees(ctx: CanvasRenderingContext2D, w: number, grassY: number): void {
    const treePositions = [0.05, 0.18, 0.35, 0.52, 0.7, 0.86]
    for (let t = 0; t < treePositions.length; t++) {
      const tx = px(w * treePositions[t])
      const sway = stepWave(this.worldTime * 0.002 + t * 1.7, 6) * 6
      drawRealisticPixelTree(ctx, tx, grassY, sway, this.worldTime, t, 2.2)
    }
    drawHorizonBushes(ctx, w, grassY, this.worldTime)
  }

  private drawCrosshair(ctx: CanvasRenderingContext2D): void {
    drawPixelCrosshair(
      ctx,
      this.targetCrosshairX,
      this.targetCrosshairY,
      stepFrame(this.worldTime * 0.01 + this.crosshairPulse * 4, 2),
    )
  }
}
