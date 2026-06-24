import { PixelButton } from './PixelButton'

interface AboutScreenProps {
  onBack: () => void
}

export function AboutScreen({ onBack }: AboutScreenProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-arcade-dark p-4 scanlines">
      <h2 className="text-xl sm:text-2xl text-arcade-gold mb-6">ABOUT</h2>

      <div className="w-full max-w-lg border-4 border-white bg-black/60 p-6 mb-8 space-y-4 text-xs text-white/80 leading-relaxed">
        <p>
          <span className="text-arcade-gold">DuckHunt AI</span> is a modern recreation of the
          classic arcade game, controlled entirely with hand gestures via your webcam.
        </p>
        <p>
          Point your index finger to aim the crosshair. Pinch your thumb and index finger
          together to shoot. Hunt ducks, build combos, and defeat boss ducks every 5 levels!
        </p>
        <p className="text-white/50">
          Built with React, TypeScript, Vite, Tailwind CSS, HTML5 Canvas, and MediaPipe Hands.
        </p>
      </div>

      <PixelButton variant="secondary" onClick={onBack}>
        BACK
      </PixelButton>
    </div>
  )
}
