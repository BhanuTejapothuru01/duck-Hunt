import { getSkyBounds, GAME_HEIGHT, stepFrame } from '../utils/pixel'

/** Match home screen rAF loop (~60fps) so game uses the same flap timing */
export const MS_PER_MENU_FRAME = 1000 / 60

const BIRD_SIZE = 0.5
/** Wing pose changes every N menu frames (home `offset` ticks) */
const FLAP_PERIOD_FRAMES = 1000
const BIRD_COUNT = 10

/** Home menu duck wing advance per frame — keep game ducks in sync */
export const DUCK_WING_RATE_PER_MS = 0.12 / MS_PER_MENU_FRAME

function birdWingFrame(framePhase: number, birdIndex: number): number {
  return stepFrame(framePhase / FLAP_PERIOD_FRAMES + birdIndex * 0.35, 2)
}

/** Small distant sky bird — 2-frame wing flap */
export function drawSkyBird(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  wing: number,
): void {
  const s = BIRD_SIZE
  ctx.fillStyle = '#000'
  if (wing === 0) {
    ctx.fillRect(x - s * 2, y, s, s)
    ctx.fillRect(x + s, y, s, s)
  } else {
    ctx.fillRect(x - s, y - s, s, s)
    ctx.fillRect(x, y - s, s, s)
  }
}

function drawSkyBirdLoop(
  ctx: CanvasRenderingContext2D,
  w: number,
  framePhase: number,
  minY: number,
  maxY: number,
  driftMultiplier = 1,
): void {
  for (let i = 0; i < BIRD_COUNT; i++) {
    const drift = (0.04 + i * 0.012) * driftMultiplier
    const bx = ((i * 440 + framePhase * drift) % (w + 160)) - 80
    const by = minY + 8 + (i % 3) * ((maxY - minY) / 4)
    drawSkyBird(ctx, bx, by, birdWingFrame(framePhase, i))
  }
}

/** Background birds drift slower from level 2 onward */
export function birdDriftMultiplierForLevel(level: number): number {
  if (level <= 1) return 1
  if (level === 2) return 0.4
  return Math.min(0.85, 0.4 + (level - 2) * 0.1)
}

/** Animated background birds in gameplay (worldTime is ms) */
export function drawSkyBirds(
  ctx: CanvasRenderingContext2D,
  w: number,
  worldTimeMs: number,
  level = 1,
): void {
  const { minY, maxY } = getSkyBounds(GAME_HEIGHT)
  drawSkyBirdLoop(
    ctx,
    w,
    worldTimeMs / MS_PER_MENU_FRAME,
    minY,
    maxY,
    birdDriftMultiplierForLevel(level),
  )
}

/** Home screen — framePhase is the menu `offset` counter */
export function drawSkyBirdsAt(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  framePhase: number,
): void {
  const { minY, maxY } = getSkyBounds(h)
  drawSkyBirdLoop(ctx, w, framePhase, minY, maxY)
}
