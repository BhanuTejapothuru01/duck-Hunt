import { HandTracker } from './HandTracker'

/** Keeps camera + MediaPipe alive between calibration and gameplay */
class HandTrackingService {
  private tracker: HandTracker | null = null
  private initPromise: Promise<HandTracker> | null = null

  async acquire(video: HTMLVideoElement): Promise<HandTracker> {
    if (!this.tracker) {
      this.tracker = new HandTracker()
      this.initPromise = this.tracker.init(video).then(() => this.tracker!)
      await this.initPromise
      return this.tracker
    }

    await this.initPromise
    this.tracker.attachVideo(video)
    return this.tracker
  }

  async start(video: HTMLVideoElement): Promise<HandTracker> {
    const tracker = await this.acquire(video)
    await tracker.start()
    return tracker
  }

  pause(): void {
    this.tracker?.pause()
  }

  release(): void {
    this.tracker?.destroy()
    this.tracker = null
    this.initPromise = null
  }
}

export const handTrackingService = new HandTrackingService()
