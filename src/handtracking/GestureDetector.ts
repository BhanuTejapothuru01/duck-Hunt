const COOLDOWN_MS = 280

/** Only fires on a fresh pinch — thumb tip and index tip must come together */
export class GestureDetector {
  private lastShootTime = 0
  private wasPinching = false

  update(isPinching: boolean): boolean {
    const pinchStarted = isPinching && !this.wasPinching
    this.wasPinching = isPinching

    if (!pinchStarted) return false

    const now = performance.now()
    if (now - this.lastShootTime < COOLDOWN_MS) return false

    this.lastShootTime = now
    return true
  }

  reset(): void {
    this.lastShootTime = 0
    this.wasPinching = false
  }
}

/** Tracks continuous pinch hold for calibration / game start */
export class PinchHoldDetector {
  private holdStart = 0
  private readonly holdMs: number

  constructor(holdMs: number) {
    this.holdMs = holdMs
  }

  update(isPinching: boolean, now = performance.now()): number {
    if (!isPinching) {
      this.holdStart = 0
      return 0
    }
    if (this.holdStart === 0) this.holdStart = now
    return Math.min(1, (now - this.holdStart) / this.holdMs)
  }

  reset(): void {
    this.holdStart = 0
  }
}
