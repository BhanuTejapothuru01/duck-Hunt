import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from '@mediapipe/tasks-vision'
import { distance } from '../utils/lerp'

export interface HandTrackingResult {
  indexX: number
  indexY: number
  handDetected: boolean
  isPinching: boolean
}

const THUMB_TIP = 4
const INDEX_TIP = 8
const WRIST = 0
const MIDDLE_MCP = 9
/** Normalized tip distance — only true when thumb & index actually touch */
const PINCH_RATIO_MAX = 0.22

export class HandTracker {
  private landmarker: HandLandmarker | null = null
  private video: HTMLVideoElement | null = null
  private onResult: ((result: HandTrackingResult) => void) | null = null
  private running = false
  private animationId: number | null = null
  private lastVideoTime = -1
  private smoothX = 0.5
  private smoothY = 0.5
  private stream: MediaStream | null = null

  async init(video: HTMLVideoElement): Promise<void> {
    this.video = video

    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm',
    )

    this.landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 1,
    })
  }

  /** Switch video element without tearing down the camera stream */
  attachVideo(video: HTMLVideoElement): void {
    this.video = video
    if (this.stream && video.srcObject !== this.stream) {
      video.srcObject = this.stream
      video.play().catch(() => {})
    }
  }

  private processResults(results: HandLandmarkerResult): void {
    if (!this.onResult) return

    if (!results.landmarks || results.landmarks.length === 0) {
      this.onResult({
        indexX: this.smoothX,
        indexY: this.smoothY,
        handDetected: false,
        isPinching: false,
      })
      return
    }

    const landmarks = results.landmarks[0]
    const thumb = landmarks[THUMB_TIP]
    const index = landmarks[INDEX_TIP]
    const wrist = landmarks[WRIST]
    const middleMcp = landmarks[MIDDLE_MCP]

    const pinchDist = distance(thumb.x, thumb.y, index.x, index.y)
    const handScale = Math.max(
      distance(wrist.x, wrist.y, middleMcp.x, middleMcp.y),
      0.06,
    )
    const isPinching = pinchDist / handScale < PINCH_RATIO_MAX

    const rawX = 1 - index.x
    const rawY = index.y
    const smooth = 0.94
    this.smoothX = this.smoothX * (1 - smooth) + rawX * smooth
    this.smoothY = this.smoothY * (1 - smooth) + rawY * smooth

    this.onResult({
      indexX: this.smoothX,
      indexY: this.smoothY,
      handDetected: true,
      isPinching,
    })
  }

  setOnResult(callback: (result: HandTrackingResult) => void): void {
    this.onResult = callback
  }

  async start(): Promise<void> {
    if (!this.video || !this.landmarker) return

    if (!this.stream) {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
      })
      this.video.srcObject = this.stream
      await this.video.play()
    } else if (this.video.paused) {
      await this.video.play()
    }

    if (this.running) return
    this.running = true
    this.lastVideoTime = -1
    this.loop()
  }

  private loop = (): void => {
    if (!this.running || !this.video || !this.landmarker) return

    if (this.video.readyState >= 2 && this.video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.video.currentTime
      const results = this.landmarker.detectForVideo(this.video, performance.now())
      this.processResults(results)
    }

    this.animationId = requestAnimationFrame(this.loop)
  }

  pause(): void {
    this.running = false
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    this.onResult = null
  }

  stop(): void {
    this.pause()
  }

  destroy(): void {
    this.pause()
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop())
      this.stream = null
    }
    if (this.video) {
      this.video.srcObject = null
    }
    this.landmarker?.close()
    this.landmarker = null
    this.video = null
  }
}
