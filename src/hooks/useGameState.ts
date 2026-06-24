import { useState, useCallback } from 'react'
import type { GameSettings } from '../types/game'
import { DEFAULT_SETTINGS } from '../types/game'
import { loadSettings, saveSettings } from '../storage/LeaderboardStorage'

export function useSettings() {
  const [settings, setSettings] = useState<GameSettings>(() =>
    loadSettings(DEFAULT_SETTINGS),
  )

  const updateSettings = useCallback((partial: Partial<GameSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      saveSettings(next)
      return next
    })
  }, [])

  return { settings, updateSettings }
}
