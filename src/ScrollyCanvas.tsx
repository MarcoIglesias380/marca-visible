import { useCallback, useEffect, useRef, useState } from 'react'

type SequenceProfile = {
  name: 'desktop' | 'mobile'
  frameCount: number
  ahead: number
  behind: number
  concurrency: number
  dprCap: number
}

const PROFILES: Record<SequenceProfile['name'], SequenceProfile> = {
  desktop: {
    name: 'desktop',
    frameCount: 120,
    ahead: 7,
    behind: 5,
    concurrency: 4,
    dprCap: 2,
  },
  mobile: {
    name: 'mobile',
    frameCount: 72,
    ahead: 5,
    behind: 3,
    concurrency: 3,
    dprCap: 1.5,
  },
}

const frameUrl = (profile: SequenceProfile, index: number) =>
  `/frames-v2/${profile.name}/frame_${String(index).padStart(3, '0')}.webp`

class ProgressiveFrameLoader {
  private readonly profile: SequenceProfile
  private readonly cache = new Map<number, HTMLImageElement>()
  private readonly pending = new Map<number, Promise<HTMLImageElement | null>>()
  private readonly queue: Array<{
    index: number
    resolve: (image: HTMLImageElement | null) => void
  }> = []
  private wanted = new Set<number>()
  private active = 0
  private disposed = false

  constructor(profile: SequenceProfile) {
    this.profile = profile
  }

  get(index: number) {
    return this.cache.get(index) ?? null
  }

  getNearest(index: number) {
    const exact = this.get(index)
    if (exact) return exact

    const maxDistance = Math.max(this.profile.ahead, this.profile.behind)
    for (let distance = 1; distance <= maxDistance; distance += 1) {
      const previous = this.get(index - distance)
      if (previous) return previous
      const next = this.get(index + distance)
      if (next) return next
    }
    return null
  }

  load(index: number, priority = false): Promise<HTMLImageElement | null> {
    const clamped = Math.max(1, Math.min(this.profile.frameCount, index))
    const cached = this.cache.get(clamped)
    if (cached) return Promise.resolve(cached)

    const existing = this.pending.get(clamped)
    if (existing) return existing

    const promise = new Promise<HTMLImageElement | null>((resolve) => {
      const task = { index: clamped, resolve }
      if (priority) this.queue.unshift(task)
      else this.queue.push(task)
      this.pump()
    })

    this.pending.set(clamped, promise)
    return promise
  }

  updateWindow(center: number) {
    const nextWanted = new Set<number>()
    const start = Math.max(1, center - this.profile.behind)
    const end = Math.min(this.profile.frameCount, center + this.profile.ahead)

    for (let index = start; index <= end; index += 1) nextWanted.add(index)
    nextWanted.add(1)
    this.wanted = nextWanted

    for (let queueIndex = this.queue.length - 1; queueIndex >= 0; queueIndex -= 1) {
      const task = this.queue[queueIndex]
      if (!nextWanted.has(task.index)) {
        this.queue.splice(queueIndex, 1)
        this.pending.delete(task.index)
        task.resolve(null)
      }
    }

    for (const index of this.cache.keys()) {
      if (!nextWanted.has(index)) this.cache.delete(index)
    }

    this.load(center, true)
    for (let distance = 1; distance <= Math.max(this.profile.ahead, this.profile.behind); distance += 1) {
      if (center + distance <= end) this.load(center + distance)
      if (center - distance >= start) this.load(center - distance)
    }
  }

  dispose() {
    this.disposed = true
    this.queue.splice(0).forEach(({ resolve }) => resolve(null))
    this.cache.clear()
    this.pending.clear()
  }

  private pump() {
    while (!this.disposed && this.active < this.profile.concurrency && this.queue.length > 0) {
      const task = this.queue.shift()
      if (!task) return
      this.active += 1

      const image = new Image()
      image.decoding = 'async'
      image.onload = async () => {
        try {
          await image.decode()
        } catch {
          // onload already guarantees a drawable image in browsers without decode().
        }

        if (!this.disposed && this.wanted.has(task.index)) this.cache.set(task.index, image)
        this.pending.delete(task.index)
        this.active -= 1
        task.resolve(this.disposed ? null : image)
        this.pump()
      }
      image.onerror = () => {
        this.pending.delete(task.index)
        this.active -= 1
        task.resolve(null)
        this.pump()
      }
      image.src = frameUrl(this.profile, task.index)
    }
  }
}

type ScrollyCanvasProps = {
  progress: number
}

export function ScrollyCanvas({ progress }: ScrollyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const loaderRef = useRef<ProgressiveFrameLoader | null>(null)
  const profileRef = useRef<SequenceProfile | null>(null)
  const desiredFrameRef = useRef(1)
  const lastImageRef = useRef<HTMLImageElement | null>(null)
  const [isReady, setIsReady] = useState(false)

  const drawImage = useCallback((image: HTMLImageElement, frameIndex: number) => {
    const canvas = canvasRef.current
    const profile = profileRef.current
    if (!canvas || !profile || image.naturalWidth === 0) return

    const context = canvas.getContext('2d', { alpha: false })
    if (!context) return

    const displayWidth = canvas.clientWidth || window.innerWidth
    const displayHeight = canvas.clientHeight || window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, profile.dprCap)
    const pixelWidth = Math.round(displayWidth * dpr)
    const pixelHeight = Math.round(displayHeight * dpr)

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth
      canvas.height = pixelHeight
    }

    const scale = Math.max(displayWidth / image.naturalWidth, displayHeight / image.naturalHeight)
    const width = image.naturalWidth * scale
    const height = image.naturalHeight * scale

    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    context.clearRect(0, 0, displayWidth, displayHeight)
    context.drawImage(
      image,
      (displayWidth - width) / 2,
      (displayHeight - height) / 2,
      width,
      height,
    )

    lastImageRef.current = image
    canvas.dataset.frame = String(frameIndex)
    canvas.dataset.profile = profile.name
    setIsReady(true)
  }, [])

  useEffect(() => {
    const isMobile = window.innerWidth <= 820 || window.matchMedia('(pointer: coarse)').matches
    const profile = isMobile ? PROFILES.mobile : PROFILES.desktop
    const loader = new ProgressiveFrameLoader(profile)

    profileRef.current = profile
    loaderRef.current = loader
    loader.updateWindow(1)
    void loader.load(1, true).then((image) => {
      if (image) drawImage(image, 1)
    })

    const redraw = () => {
      const lastImage = lastImageRef.current
      if (lastImage) drawImage(lastImage, desiredFrameRef.current)
    }
    window.addEventListener('resize', redraw)

    return () => {
      window.removeEventListener('resize', redraw)
      loader.dispose()
      loaderRef.current = null
    }
  }, [drawImage])

  useEffect(() => {
    const profile = profileRef.current
    const loader = loaderRef.current
    if (!profile || !loader) return

    const frameIndex = 1 + Math.round(Math.max(0, Math.min(1, progress)) * (profile.frameCount - 1))
    desiredFrameRef.current = frameIndex
    loader.updateWindow(frameIndex)

    const nearest = loader.getNearest(frameIndex)
    if (nearest) drawImage(nearest, frameIndex)

    void loader.load(frameIndex, true).then((image) => {
      if (image && desiredFrameRef.current === frameIndex) drawImage(image, frameIndex)
    })
  }, [drawImage, progress])

  return (
    <>
      <canvas ref={canvasRef} className="scrolly-canvas" />
      {!isReady ? (
        <div className="preload-status" aria-live="polite">
          <div className="preload-spinner" />
          <span>Preparando secuencia cinemática…</span>
        </div>
      ) : null}
    </>
  )
}
