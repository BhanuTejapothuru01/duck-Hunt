import { useState, useCallback } from 'react'
import type { GameScreen } from './types/game'
import { LoadingScreen } from './components/LoadingScreen'
import { HomeScreen } from './components/HomeScreen'
import { CalibrationScreen, GameCanvas } from './components/GameCanvas'
import { handTrackingService } from './handtracking/HandTrackingService'
import { Leaderboard } from './components/Leaderboard'
import { Settings } from './components/Settings'
import { AboutScreen } from './components/AboutScreen'
import { PixelButton } from './components/PixelButton'
import { useSettings } from './hooks/useGameState'
import {
  getHighScore,
  setHighScore,
  addLeaderboardEntry,
} from './storage/LeaderboardStorage'

function GameOverScreen({
  score,
  highScore,
  onSubmit,
  onHome,
}: {
  score: number
  highScore: number
  onSubmit: (name: string) => void
  onHome: () => void
}) {
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const isHighScore = score >= highScore && score > 0

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-arcade-dark scanlines relative overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <span
          key={i}
          className="absolute text-xl animate-fall-duck pointer-events-none"
          style={{ left: `${10 + i * 15}%`, animationDelay: `${i * 0.4}s` }}
        >
          <span className="inline-block w-4 h-4 bg-arcade-brown border-2 border-black" />
        </span>
      ))}

      <h2 className="text-2xl sm:text-4xl text-arcade-red mb-4 animate-shake relative z-10">GAME OVER</h2>
      <p className="text-lg text-arcade-gold mb-2 animate-score-glow relative z-10">SCORE: {score}</p>
      {isHighScore && (
        <p className="text-sm text-arcade-gold animate-blink mb-4">NEW HIGH SCORE!</p>
      )}

      {!submitted ? (
        <div className="flex flex-col items-center gap-4 mt-4">
          <input
            type="text"
            maxLength={12}
            placeholder="ENTER NAME"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            className="px-4 py-2 bg-black border-4 border-white text-white text-xs font-[family-name:var(--font-pixel)] text-center w-48 focus:outline-none focus:border-arcade-gold"
          />
          <PixelButton
            onClick={() => {
              onSubmit(name || 'HUNTER')
              setSubmitted(true)
            }}
          >
            SAVE SCORE
          </PixelButton>
        </div>
      ) : (
        <p className="text-xs text-white/60 mt-4">Score saved!</p>
      )}

      <PixelButton variant="secondary" onClick={onHome} className="mt-8">
        MAIN MENU
      </PixelButton>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('loading')
  const [finalScore, setFinalScore] = useState(0)
  const [highScore, setHighScoreState] = useState(() => getHighScore())
  const { settings, updateSettings } = useSettings()

  const handleGameOver = useCallback((score: number) => {
    setFinalScore(score)
    setHighScore(score)
    const newHigh = getHighScore()
    setHighScoreState(newHigh)
    setScreen('gameover')
  }, [])

  const handleSaveScore = useCallback(
    (name: string) => {
      addLeaderboardEntry({
        playerName: name,
        score: finalScore,
        date: new Date().toISOString(),
      })
    },
    [finalScore],
  )

  return (
    <div className="app-root fixed inset-0 w-screen h-screen overflow-hidden bg-arcade-dark">
      {screen === 'loading' && (
        <LoadingScreen onComplete={() => setScreen('home')} />
      )}
      {screen === 'home' && (
        <HomeScreen
          highScore={highScore}
          onStart={() => setScreen('calibration')}
          onLeaderboard={() => setScreen('leaderboard')}
          onSettings={() => setScreen('settings')}
          onAbout={() => setScreen('about')}
        />
      )}
      {screen === 'calibration' && (
        <CalibrationScreen
          settings={settings}
          onReady={() => {
            handTrackingService.pause()
            setScreen('game')
          }}
          onBack={() => {
            handTrackingService.release()
            setScreen('home')
          }}
        />
      )}
      {screen === 'game' && (
        <GameCanvas
          settings={settings}
          onGameOver={handleGameOver}
          onQuit={() => setScreen('home')}
        />
      )}
      {screen === 'gameover' && (
        <GameOverScreen
          score={finalScore}
          highScore={highScore}
          onSubmit={handleSaveScore}
          onHome={() => setScreen('home')}
        />
      )}
      {screen === 'leaderboard' && (
        <Leaderboard onBack={() => setScreen('home')} />
      )}
      {screen === 'settings' && (
        <Settings
          settings={settings}
          onUpdate={updateSettings}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'about' && (
        <AboutScreen onBack={() => setScreen('home')} />
      )}
    </div>
  )
}
