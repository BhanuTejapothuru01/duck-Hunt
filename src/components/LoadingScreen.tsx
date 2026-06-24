import { useEffect, useState } from 'react'
import { preloadDuckSprite } from '../game/DuckSprite'
import { preloadTreeSprite } from '../game/TreeSprite'

interface LoadingScreenProps {
  onComplete: () => void
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [dots, setDots] = useState('')
  const [progress, setProgress] = useState(0)
  const [duckFrame, setDuckFrame] = useState(0)

  useEffect(() => {
    preloadTreeSprite()
    preloadDuckSprite()
  }, [])

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'))
    }, 400)

    const duckInterval = setInterval(() => {
      setDuckFrame((f) => (f + 1) % 4)
    }, 200)

    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return p + 2
      })
    }, 50)

    const timer = setTimeout(onComplete, 2800)

    return () => {
      clearInterval(dotInterval)
      clearInterval(duckInterval)
      clearInterval(progressInterval)
      clearTimeout(timer)
    }
  }, [onComplete])

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full min-h-0 bg-arcade-dark scanlines overflow-hidden">
      <div className="absolute inset-0 animate-crt-flicker pointer-events-none" />

      <div className="absolute w-full h-1 bg-arcade-gold/30 animate-scan-line" />

      <div className="text-center space-y-8 relative z-10">
        <h1 className="text-2xl sm:text-4xl text-arcade-gold drop-shadow-[4px_4px_0_#000] animate-title-glow">
          DUCKHUNT AI
        </h1>
        <p className="text-sm sm:text-base text-white animate-blink">
          INITIALIZING{dots}
        </p>

        <div className="w-64 h-6 border-4 border-white bg-black mx-auto relative overflow-hidden">
          <div
            className="h-full bg-arcade-green transition-all duration-100 relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>

        <div className="flex gap-1 justify-center">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 bg-arcade-gold animate-pixel-pop"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>

        <div className="h-8 flex items-end justify-center gap-0">
          {[0, 1, 2, 3].map((frame) => (
            <div
              key={frame}
              className="flex gap-0"
              style={{ display: duckFrame === frame ? 'flex' : 'none' }}
            >
              <div className="w-2 h-2 bg-arcade-brown" />
              <div className="w-2 h-2 bg-arcade-brown -mt-1" />
              <div className="w-1 h-1 bg-arcade-gold ml-1 mt-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
