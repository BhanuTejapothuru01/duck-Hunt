import { useEffect, useRef } from 'react'
import { PixelButton } from './PixelButton'
import { drawAnimatedGrassField, drawHorizonBushes } from '../game/PixelArt'
import { drawAnimatedDuck, duckTintFilter, preloadDuckSprite } from '../game/DuckSprite'
import { drawSkyBirdsAt } from '../game/BirdAnimation'
import { drawRealisticPixelTree, preloadTreeSprite } from '../game/TreeSprite'
import { drawSkyClouds } from '../game/CloudAnimation'
import {
  drawPixelSky,
  stretchPixelCanvas,
  GAME_HEIGHT,
  GAME_WIDTH,
  getSkyBounds,
  PIXEL,
  px,
  setupPixelContext,
  stepFrame,
  stepWave,
} from '../utils/pixel'

interface HomeScreenProps {
  onStart: () => void
  onLeaderboard: () => void
  onSettings: () => void
  onAbout: () => void
  highScore: number
}

interface FlyingDuck {
  x: number
  y: number
  speed: number
  direction: 1 | -1
  wingPhase: number
  color: string
}

function drawHomeDuck(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  wingPhase: number,
  color: string,
  flip: boolean,
) {
  ctx.save()
  ctx.translate(px(x), px(y))
  if (flip) ctx.scale(-1, 1)
  drawAnimatedDuck(ctx, {
    wingFrame: wingPhase,
    filter: duckTintFilter(color),
  })
  ctx.restore()
}

export function HomeScreen({
  onStart,
  onLeaderboard,
  onSettings,
  onAbout,
  highScore,
}: HomeScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    stretchPixelCanvas(canvas, container)
    preloadTreeSprite()
    preloadDuckSprite()
    const onResize = () => stretchPixelCanvas(canvas, container)
    window.addEventListener('resize', onResize)

    let offset = 0
    let animId: number

    const ducks: FlyingDuck[] = [
      { x: 24, y: 52, speed: 0.8, direction: 1, wingPhase: 0, color: '#8b4513' },
      { x: 90, y: 38, speed: 1.1, direction: -1, wingPhase: 1, color: '#cd853f' },
      { x: 140, y: 56, speed: 0.7, direction: 1, wingPhase: 2, color: '#fcd800' },
    ]

    const stars = Array.from({ length: 16 }, (_, i) => ({
      x: (i * 47) % GAME_WIDTH,
      y: (i * 29) % 60,
      phase: i,
    }))

    const draw = () => {
      setupPixelContext(ctx)
      const w = GAME_WIDTH
      const h = GAME_HEIGHT

      const grassY = drawPixelSky(ctx, w, h)

      for (const star of stars) {
        if (stepFrame(offset * 0.04 + star.phase, 4) % 2 === 0) {
          ctx.fillStyle = '#fcfcfc'
          ctx.fillRect(star.x, star.y, PIXEL, PIXEL)
        }
      }

      const { minY, maxY } = getSkyBounds(h)
      drawSkyClouds(ctx, w, offset * 2.4, offset * 16.67, minY, maxY)

      drawSkyBirdsAt(ctx, w, h, offset)

      const treeXs = [80, 300, 560, 800, 1120, 1240]
      for (let t = 0; t < treeXs.length; t++) {
        drawRealisticPixelTree(ctx, treeXs[t], grassY, stepWave(offset * 0.02 + t, 6) * 5, offset, t, 2)
      }
      drawHorizonBushes(ctx, w, grassY, offset)

      ctx.fillStyle = '#00a800'
      ctx.fillRect(0, grassY, w, h - grassY)
      drawAnimatedGrassField(ctx, w, grassY, h, offset)

      for (const duck of ducks) {
        duck.x += duck.speed * duck.direction
        duck.wingPhase += 0.12
        if (duck.x > w + 20) duck.x = -20
        if (duck.x < -20) duck.x = w + 20
        drawHomeDuck(
          ctx,
          duck.x,
          duck.y,
          duck.wingPhase,
          duck.color,
          duck.direction < 0,
        )
      }

      offset += 1
      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <div ref={containerRef} className="game-screen relative w-full h-full min-h-0 overflow-hidden scanlines">
      <canvas ref={canvasRef} className="pixel-canvas" />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 p-8 pointer-events-none">
        <h1 className="text-3xl sm:text-5xl text-arcade-gold drop-shadow-[4px_4px_0_#000] text-center animate-title-glow animate-pixel-float pointer-events-auto">
          DUCKHUNT AI
        </h1>
        <p className="text-xs text-white/80 animate-blink pointer-events-auto">INSERT HAND TO PLAY</p>

        {highScore > 0 && (
          <p className="text-xs text-arcade-gold animate-pixel-blink pointer-events-auto">HIGH SCORE: {highScore}</p>
        )}

        <div className="flex flex-col gap-4 mt-4 pointer-events-auto">
          <PixelButton onClick={onStart} className="w-56">
            START GAME
          </PixelButton>
          <PixelButton onClick={onLeaderboard} variant="secondary" className="w-56">
            LEADERBOARD
          </PixelButton>
          <PixelButton onClick={onSettings} variant="secondary" className="w-56">
            SETTINGS
          </PixelButton>
          <PixelButton onClick={onAbout} variant="secondary" className="w-56">
            ABOUT
          </PixelButton>
        </div>
      </div>
    </div>
  )
}
