export type DuckType =
  | 'normal'
  | 'fast'
  | 'zigzag'
  | 'golden'
  | 'ghost'
  | 'boss'

export type GameScreen =
  | 'loading'
  | 'home'
  | 'calibration'
  | 'game'
  | 'leaderboard'
  | 'settings'
  | 'about'
  | 'gameover'

export type Sensitivity = 'low' | 'medium' | 'high'
export type Difficulty = 'easy' | 'normal' | 'hard'

export interface GameSettings {
  sensitivity: Sensitivity
  soundEnabled: boolean
  musicEnabled: boolean
  difficulty: Difficulty
}

export interface LeaderboardEntry {
  playerName: string
  score: number
  date: string
}

export const DEFAULT_SETTINGS: GameSettings = {
  sensitivity: 'high',
  soundEnabled: true,
  musicEnabled: true,
  difficulty: 'normal',
}

export const SENSITIVITY_MAP: Record<Sensitivity, number> = {
  low: 0.85,
  medium: 0.96,
  high: 1,
}

/** Extra reach from hand center — multiplied with sensitivity in handToGame */
export const SENSITIVITY_AIM_GAIN: Record<Sensitivity, number> = {
  low: 1.4,
  medium: 1.58,
  high: 1.75,
}

export const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 0.7,
  normal: 1,
  hard: 1.4,
}
