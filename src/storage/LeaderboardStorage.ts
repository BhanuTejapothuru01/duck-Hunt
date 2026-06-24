import type { LeaderboardEntry } from '../types/game'

const STORAGE_KEY = 'duckhunt-ai-leaderboard'
const HIGH_SCORE_KEY = 'duckhunt-ai-highscore'
const SETTINGS_KEY = 'duckhunt-ai-settings'

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const entries = JSON.parse(raw) as LeaderboardEntry[]
    return entries.sort((a, b) => b.score - a.score).slice(0, 10)
  } catch {
    return []
  }
}

export function addLeaderboardEntry(entry: LeaderboardEntry): LeaderboardEntry[] {
  const entries = getLeaderboard()
  entries.push(entry)
  entries.sort((a, b) => b.score - a.score)
  const top10 = entries.slice(0, 10)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(top10))
  return top10
}

export function getHighScore(): number {
  try {
    return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10)
  } catch {
    return 0
  }
}

export function setHighScore(score: number): void {
  const current = getHighScore()
  if (score > current) {
    localStorage.setItem(HIGH_SCORE_KEY, String(score))
  }
}

export function loadSettings<T>(defaults: T): T {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return defaults
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return defaults
  }
}

export function saveSettings<T>(settings: T): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
