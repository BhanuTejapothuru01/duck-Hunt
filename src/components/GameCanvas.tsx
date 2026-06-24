import { useEffect, useRef, useState, useCallback } from 'react'
import { GestureDetector, PinchHoldDetector } from '../handtracking/GestureDetector'
import { handTrackingService } from '../handtracking/HandTrackingService'
import { GameEngine } from '../game/Engine'
import type { GameSettings } from '../types/game'
import { SENSITIVITY_AIM_GAIN } from '../types/game'
import { PixelButton } from './PixelButton'
import { audioManager } from '../audio/AudioManager'
import { getHighScore } from '../storage/LeaderboardStorage'
import { stretchPixelCanvas, handToGame, gameToPercent } from '../utils/pixel'

interface CalibrationScreenProps {
  settings: GameSettings
  onReady: () => void
  onBack: () => void
}

const CALIBRATION_HOLD_MS = 2200

export function CalibrationScreen({ onReady, onBack, settings }: CalibrationScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const holdRef = useRef(new PinchHoldDetector(CALIBRATION_HOLD_MS))
  const [handDetected, setHandDetected] = useState(false)
  const [isPinching, setIsPinching] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)
  const [crosshair, setCrosshair] = useState({ x: 50, y: 50 })
  const startedRef = useRef(false)

  useEffect(() => {
    const video = videoRef.current
    const holdDetector = holdRef.current
    if (!video) return

    let active = true
    holdDetector.reset()
    startedRef.current = false

    handTrackingService.start(video).then((tracker) => {
      if (!active) return
      tracker.setOnResult((result) => {
        setHandDetected(result.handDetected)
        setIsPinching(result.isPinching)
        if (result.handDetected) {
          const pos = handToGame(
            result.indexX,
            result.indexY,
            SENSITIVITY_AIM_GAIN[settings.sensitivity],
          )
          const pct = gameToPercent(pos.x, pos.y)
          setCrosshair({ x: pct.x, y: pct.y })
        }
        const progress = holdDetector.update(result.isPinching)
        setHoldProgress(progress)
        if (progress >= 1 && !startedRef.current) {
          startedRef.current = true
          setTimeout(() => onReady(), 400)
        }
      })
    })

    return () => {
      active = false
      holdDetector.reset()
    }
  }, [onReady, settings.sensitivity])

  const yellowOpacity = holdProgress > 0 ? 0.25 + holdProgress * 0.75 : 0

  return (
    <div className="game-screen relative w-full h-full min-h-0 overflow-hidden scanlines">
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          className="w-full h-full object-cover scale-x-[-1]"
          playsInline
          muted
        />
        <div
          className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-none z-10"
          style={{
            left: `${crosshair.x}%`,
            top: `${crosshair.y}%`,
            width: 24,
            height: 24,
            imageRendering: 'pixelated',
          }}
        >
          <div className="absolute inset-0 border-4 border-red-600" style={{ boxShadow: 'inset 0 0 0 2px #fff' }} />
          <div className="absolute left-1/2 top-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 bg-red-600" />
        </div>
        <div
          className={`absolute top-3 right-3 px-2 py-1 text-[10px] transition-colors z-10 ${
            handDetected ? 'text-green-400 bg-green-900/50' : 'text-red-400 bg-red-900/50 animate-blink'
          }`}
        >
          {handDetected ? '● HAND OK' : '● NO HAND'}
        </div>
      </div>

      {/* Yellow hold-to-start overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-20 transition-none"
        style={{
          backgroundColor: `rgba(252, 216, 0, ${yellowOpacity})`,
        }}
      />

      <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-4 pointer-events-none">
        <h2 className="text-lg sm:text-xl text-arcade-gold drop-shadow-[2px_2px_0_#000]">
          SHOW YOUR HAND
        </h2>

        <div className="space-y-4 text-center w-full max-w-md">
          <p className="text-xs text-white drop-shadow-[2px_2px_0_#000]">
            Touch thumb &amp; index finger together and HOLD
          </p>
          <p className={`text-sm drop-shadow-[2px_2px_0_#000] ${handDetected ? 'text-green-400' : 'text-red-400'}`}>
            {handDetected ? '● HAND DETECTED' : '● SHOW YOUR HAND TO CAMERA'}
          </p>
          {handDetected && (
            <p className={`text-xs drop-shadow-[2px_2px_0_#000] ${isPinching ? 'text-arcade-gold' : 'text-white/70'}`}>
              {isPinching ? '● PINCH HELD — KEEP HOLDING...' : '● PINCH THUMB + INDEX TO START'}
            </p>
          )}
          <div className="w-full h-4 border-4 border-white bg-black/60 mx-auto">
            <div
              className="h-full bg-arcade-gold transition-none"
              style={{ width: `${holdProgress * 100}%` }}
            />
          </div>
          {holdProgress >= 1 && (
            <p className="text-sm text-black font-bold animate-blink">STARTING HUNT!</p>
          )}
        </div>

        <PixelButton variant="secondary" onClick={onBack} className="pointer-events-auto">
          BACK
        </PixelButton>
      </div>
    </div>
  )
}

interface GameCanvasProps {
  settings: GameSettings
  onGameOver: (score: number) => void
  onQuit: () => void
}

export function GameCanvas({ settings, onGameOver, onQuit }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const gestureRef = useRef(new GestureDetector())
  const videoRef = useRef<HTMLVideoElement>(null)

  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(5)
  const [level, setLevel] = useState(1)
  const [combo, setCombo] = useState(0)
  const [highScore] = useState(() => getHighScore())
  const [levelFlash, setLevelFlash] = useState(false)
  const [heartAnim, setHeartAnim] = useState(false)
  const [scorePop, setScorePop] = useState(false)

  const initGame = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    const video = videoRef.current
    if (!canvas || !container || !video) return

    stretchPixelCanvas(canvas, container)
    gestureRef.current.reset()

    const engine = new GameEngine(canvas, settings, {
      onScoreChange: (s) => {
        setScore(s)
        setScorePop(true)
        setTimeout(() => setScorePop(false), 300)
      },
      onLivesChange: (l) => {
        setLives((prev) => {
          if (l < prev) {
            setHeartAnim(true)
            setTimeout(() => setHeartAnim(false), 500)
          }
          return l
        })
      },
      onLevelChange: setLevel,
      onComboChange: setCombo,
      onGameOver: (finalScore) => {
        engine.stop()
        onGameOver(finalScore)
      },
      onLevelComplete: () => {
        setLevelFlash(true)
        setTimeout(() => setLevelFlash(false), 2000)
      },
    })

    engineRef.current = engine
    engine.start()

    handTrackingService.start(video).then((tracker) => {
      gestureRef.current.reset()
      tracker.setOnResult((result) => {
        if (result.handDetected) {
          const pos = handToGame(
            result.indexX,
            result.indexY,
            SENSITIVITY_AIM_GAIN[settings.sensitivity],
          )
          engine.setCrosshairTarget(pos.x, pos.y)
        }
        if (gestureRef.current.update(result.isPinching)) {
          engine.shoot()
        }
      })
    })
  }, [settings, onGameOver])

  useEffect(() => {
    audioManager.init()
    audioManager.setEnabled(settings.soundEnabled)
    if (settings.musicEnabled) audioManager.startMusic()

    initGame()

    const handleResize = () => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return
      stretchPixelCanvas(canvas, container)
      engineRef.current?.resize()
    }

    handleResize()
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(handleResize)
    observer.observe(container)

    window.addEventListener('resize', handleResize)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', handleResize)
      engineRef.current?.stop()
      handTrackingService.release()
      audioManager.stopMusic()
    }
  }, [initGame, settings.soundEnabled, settings.musicEnabled])

  useEffect(() => {
    engineRef.current?.updateSettings(settings)
    audioManager.setEnabled(settings.soundEnabled)
    if (settings.musicEnabled) audioManager.startMusic()
    else audioManager.stopMusic()
  }, [settings])

  return (
    <div ref={containerRef} className="game-screen relative w-full h-full min-h-0 bg-black overflow-hidden scanlines">
      <video
        ref={videoRef}
        className="absolute w-px h-px opacity-0 pointer-events-none"
        width={1280}
        height={720}
        playsInline
        muted
      />

      <canvas ref={canvasRef} className="pixel-canvas" />

      <div className="absolute inset-0 p-4 flex justify-between items-start pointer-events-none z-10">
        <div className="space-y-1">
          <p className={`text-xs text-white drop-shadow-[2px_2px_0_#000] ${scorePop ? 'animate-score-tick' : ''}`}>
            SCORE: {score}
          </p>
          <p className="text-xs text-arcade-gold drop-shadow-[2px_2px_0_#000]">
            HI: {highScore}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-white drop-shadow-[2px_2px_0_#000]">
            LEVEL {level}
          </p>
          {combo >= 2 && (
            <p className="text-sm text-arcade-gold animate-combo-pulse mt-1">
              COMBO x{combo}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className={`text-xs drop-shadow-[2px_2px_0_#000] ${heartAnim ? 'animate-shake' : ''}`}>
            {'❤️'.repeat(Math.max(0, lives))}
          </p>
        </div>
      </div>

      {levelFlash && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
          <div className="text-center animate-slide-in-down">
            <p className="text-3xl sm:text-4xl text-arcade-gold drop-shadow-[4px_4px_0_#000]">
              LEVEL {level}!
            </p>
            <p className="text-xs text-white/70 mt-2 animate-blink">GET READY...</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
        <PixelButton variant="danger" onClick={() => {
          handTrackingService.release()
          onQuit()
        }} className="text-xs">
          QUIT
        </PixelButton>
      </div>
    </div>
  )
}
