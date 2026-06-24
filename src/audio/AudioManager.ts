type SoundName = 'shoot' | 'hit' | 'miss' | 'combo' | 'boss' | 'gameover'

const SOUND_CONFIG: Record<SoundName, { freq: number; duration: number; type: OscillatorType; gain: number }> = {
  shoot: { freq: 880, duration: 0.08, type: 'square', gain: 0.15 },
  hit: { freq: 440, duration: 0.15, type: 'sawtooth', gain: 0.2 },
  miss: { freq: 150, duration: 0.2, type: 'triangle', gain: 0.1 },
  combo: { freq: 660, duration: 0.25, type: 'square', gain: 0.18 },
  boss: { freq: 220, duration: 0.5, type: 'sawtooth', gain: 0.25 },
  gameover: { freq: 110, duration: 1.0, type: 'triangle', gain: 0.2 },
}

export class AudioManager {
  private ctx: AudioContext | null = null
  private enabled = true
  private musicEnabled = true
  private musicOsc: OscillatorNode | null = null
  private musicGain: GainNode | null = null

  init(): void {
    if (!this.ctx) {
      this.ctx = new AudioContext()
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) this.stopMusic()
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled
    if (enabled) {
      this.startMusic()
    } else {
      this.stopMusic()
    }
  }

  private ensureContext(): AudioContext | null {
    if (!this.ctx) this.init()
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  play(name: SoundName): void {
    if (!this.enabled) return
    const ctx = this.ensureContext()
    if (!ctx) return

    const config = SOUND_CONFIG[name]
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = config.type
    osc.frequency.setValueAtTime(config.freq, ctx.currentTime)
    if (name === 'combo') {
      osc.frequency.exponentialRampToValueAtTime(config.freq * 2, ctx.currentTime + config.duration)
    } else if (name === 'gameover') {
      osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + config.duration)
    }

    gain.gain.setValueAtTime(config.gain, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.duration)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + config.duration)
  }

  startMusic(): void {
    if (!this.musicEnabled || this.musicOsc) return
    const ctx = this.ensureContext()
    if (!ctx) return

    this.musicOsc = ctx.createOscillator()
    this.musicGain = ctx.createGain()
    this.musicOsc.type = 'triangle'
    this.musicOsc.frequency.setValueAtTime(196, ctx.currentTime)
    this.musicGain.gain.setValueAtTime(0.03, ctx.currentTime)

    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.frequency.setValueAtTime(0.5, ctx.currentTime)
    lfoGain.gain.setValueAtTime(20, ctx.currentTime)
    lfo.connect(lfoGain)
    lfoGain.connect(this.musicOsc.frequency)
    lfo.start()

    this.musicOsc.connect(this.musicGain)
    this.musicGain.connect(ctx.destination)
    this.musicOsc.start()
  }

  stopMusic(): void {
    if (this.musicOsc) {
      try {
        this.musicOsc.stop()
      } catch {
        /* already stopped */
      }
      this.musicOsc = null
      this.musicGain = null
    }
  }
}

export const audioManager = new AudioManager()
