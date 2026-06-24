import type { DuckType } from '../types/game'
import type { Difficulty } from '../types/game'
import { DIFFICULTY_MULTIPLIER } from '../types/game'

export interface LevelConfig {
  level: number
  duckCount: number
  duckTypes: DuckType[]
  spawnInterval: number
  speedMultiplier: number
  isBoss: boolean
}

export function getLevelConfig(level: number, difficulty: Difficulty): LevelConfig {
  const diffMult = DIFFICULTY_MULTIPLIER[difficulty]
  const isBoss = level % 5 === 0

  if (isBoss) {
    return {
      level,
      duckCount: 1,
      duckTypes: ['boss'],
      spawnInterval: 0,
      speedMultiplier: 1 + level * 0.05 * diffMult,
      isBoss: true,
    }
  }

  const duckCount = Math.min(6 + level * 2, 20)
  const duckTypes = getDuckTypesForLevel(level)
  // Slower spawns early — more time between ducks while learning
  const spawnInterval = Math.max(750, 2400 - level * 75) / diffMult
  // Speed ramps gently: easy start, faster after level 5–8
  const speedMultiplier = (0.52 + level * 0.045 + Math.max(0, level - 6) * 0.025) * diffMult

  return {
    level,
    duckCount,
    duckTypes,
    spawnInterval,
    speedMultiplier,
    isBoss: false,
  }
}

function getDuckTypesForLevel(level: number): DuckType[] {
  const types: DuckType[] = ['normal']

  if (level >= 2) types.push('normal')
  if (level >= 5) types.push('fast')
  if (level >= 8) types.push('golden')
  if (level >= 10) types.push('zigzag')
  if (level >= 12) types.push('ghost')

  return types
}

export function pickDuckType(types: DuckType[]): DuckType {
  const weights: Record<string, number> = {}
  for (const t of types) {
    weights[t] = (weights[t] || 0) + 1
  }

  if (types.includes('golden') && Math.random() < 0.06) return 'golden'
  if (types.includes('ghost') && Math.random() < 0.05) return 'ghost'

  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  let roll = Math.random() * total
  for (const [type, weight] of Object.entries(weights)) {
    roll -= weight
    if (roll <= 0) return type as DuckType
  }
  return 'normal'
}
