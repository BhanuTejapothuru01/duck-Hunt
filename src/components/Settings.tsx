import type { GameSettings, Sensitivity, Difficulty } from '../types/game'
import { PixelButton } from './PixelButton'

interface SettingsProps {
  settings: GameSettings
  onUpdate: (partial: Partial<GameSettings>) => void
  onBack: () => void
}

function ToggleGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-arcade-gold">{label}</p>
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-2 text-[10px] border-2 border-black font-[family-name:var(--font-pixel)] transition-colors ${
              value === opt.value
                ? 'bg-arcade-green text-white'
                : 'bg-gray-700 text-white/70 hover:bg-gray-600'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Settings({ settings, onUpdate, onBack }: SettingsProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-arcade-dark p-4 scanlines">
      <h2 className="text-xl sm:text-2xl text-arcade-gold mb-8">SETTINGS</h2>

      <div className="w-full max-w-md space-y-6 border-4 border-white bg-black/60 p-6 mb-8">
        <ToggleGroup<Sensitivity>
          label="SENSITIVITY"
          options={[
            { value: 'low', label: 'LOW' },
            { value: 'medium', label: 'MEDIUM' },
            { value: 'high', label: 'HIGH' },
          ]}
          value={settings.sensitivity}
          onChange={(v) => onUpdate({ sensitivity: v })}
        />

        <ToggleGroup
          label="SOUND"
          options={[
            { value: 'on', label: 'ON' },
            { value: 'off', label: 'OFF' },
          ]}
          value={settings.soundEnabled ? 'on' : 'off'}
          onChange={(v) => onUpdate({ soundEnabled: v === 'on' })}
        />

        <ToggleGroup
          label="MUSIC"
          options={[
            { value: 'on', label: 'ON' },
            { value: 'off', label: 'OFF' },
          ]}
          value={settings.musicEnabled ? 'on' : 'off'}
          onChange={(v) => onUpdate({ musicEnabled: v === 'on' })}
        />

        <ToggleGroup<Difficulty>
          label="DIFFICULTY"
          options={[
            { value: 'easy', label: 'EASY' },
            { value: 'normal', label: 'NORMAL' },
            { value: 'hard', label: 'HARD' },
          ]}
          value={settings.difficulty}
          onChange={(v) => onUpdate({ difficulty: v })}
        />
      </div>

      <PixelButton variant="secondary" onClick={onBack}>
        BACK
      </PixelButton>
    </div>
  )
}
