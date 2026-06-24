import { useState } from 'react'
import { getLeaderboard } from '../storage/LeaderboardStorage'
import { PixelButton } from './PixelButton'

interface LeaderboardProps {
  onBack: () => void
}

export function Leaderboard({ onBack }: LeaderboardProps) {
  const [entries] = useState(() => getLeaderboard())

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-arcade-dark p-4 scanlines">
      <h2 className="text-xl sm:text-2xl text-arcade-gold mb-8">LEADERBOARD</h2>

      <div className="w-full max-w-lg border-4 border-white bg-black/60 p-4 mb-8">
        {entries.length === 0 ? (
          <p className="text-xs text-white/60 text-center py-8">No scores yet. Play a game!</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-arcade-gold border-b border-white/30">
                <th className="text-left py-2">#</th>
                <th className="text-left py-2">NAME</th>
                <th className="text-right py-2">SCORE</th>
                <th className="text-right py-2 hidden sm:table-cell">DATE</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={`${entry.date}-${i}`} className="border-b border-white/10">
                  <td className="py-2 text-white/80">{i + 1}</td>
                  <td className="py-2 text-white">{entry.playerName}</td>
                  <td className="py-2 text-right text-arcade-gold">{entry.score}</td>
                  <td className="py-2 text-right text-white/50 hidden sm:table-cell">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <PixelButton variant="secondary" onClick={onBack}>
        BACK
      </PixelButton>
    </div>
  )
}
