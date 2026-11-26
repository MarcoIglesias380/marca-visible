import { useCallback, useEffect, useRef, useState } from 'react'

type SequenceProfile = {
  name: 'desktop' | 'mobile'
  frameCount: number
  ahead: number
  behind: number
  concurrency: number
  dprCap: number
  maxDimension: number
}

const PROFILES: Record<SequenceProfile['name'], SequenceProfile> = {
  desktop: {
    name: 'desktop',
    frameCount: 120,
    ahead: 6,
    behind: 4,
    concurrency: 3,
    dprCap: 2,
    maxDimension: 2560,
  },
  mobile: {
    name: 'mobile',
    frameCount: 72,
    ahead: 4,
    behind: 2,
    concurrency: 2,
    dprCap: 1.25,
    maxDimension: 1280,
  },
}

const frameUrl = (profile: SequenceProfile, index: number) =>
  `/frames-v3/${profile.name}/frame_${String(index).padStart(3, '0')}.webp`

class ProgressiveFrameLoader {
  private readonly profile: SequenceProfile
  private readonly cache = new Map<number, HTMLImageElement>()
  private readonly pending = new Map<number, Promise<HTMLImageElement | null>>()
  private readonly queue: Array<{
    index: number
    priority: boolean
    resolve: (image: HTMLImageElement | null) => void
  }> = []
  private wanted = new Set<number>()
  private active = 0
  private disposed = false
  private readonly maxCacheSize: number

  constructor(profile: SequenceProfile) {
    this.profile = profile
    this.maxCacheSize = profile.name === 'mobile' ? 16 : 28
  }

  get(index: number): HTMLImageElement | null {
    return this.cache.get(index) ?? null
  }

  /**
   * Returns the best available candidate frame to draw:
   * 1. Exact match if cached.
   * 2. Nearest cached frame ONLY if it improves distance to target compared to currentRenderedIndex.
   * 3. Otherwise null (maintain current valid frame).
   */
  getBestCandidate(
    targetIndex: number,
    currentRenderedIndex: number | null,
  ): { image: HTMLImageElement; index: number } | null {
    const exact = this.cache.get(targetIndex)
    if (exact && exact.naturalWidth > 0) {
      return { image: exact, index: targetIndex }
    }

    const currentDistance =
      currentRenderedIndex !== null ? Math.abs(targetIndex - currentRenderedIndex) : Infinity

    let bestIndex: number | null = null
    let bestDistance = currentDistance

    for (const [cachedIndex, image] of this.cache.entries()) {
      if (!image || image.naturalWidth === 0) continue
      const dist = Math.abs(targetIndex - cachedIndex)
      if (dist < bestDistance) {
        bestDistance = dist
        bestIndex = cachedIndex
      }
    }

    if (bestIndex !== null && bestIndex !== currentRenderedIndex) {
      const candidateImage = this.cache.get(bestIndex)
      if (candidateImage && candidateImage.naturalWidth > 0) {
        return { image: candidateImage, index: bestIndex }
      }
    }

    return null
  }

  load(index: number, priority = false): Promise<HTMLImageElement | null> {
    const clamped = Math.max(1, Math.min(this.profile.frameCount, index))
    const cached = this.cache.get(clamped)
    if (cached) return Promise.resolve(cached)

    const existing = this.pending.get(clamped)
    if (existing) {
      if (priority) {
        const queueItem = this.queue.find((item) => item.index === clamped)
        if (queueItem) {
          queueItem.priority = true
          this.sortQueue()
        }
      }
      return existing
    }

    const promise = new Promise<HTMLImageElement | null>((resolve) => {
      this.queue.push({ index: clamped, priority, resolve })
      this.sortQueue()
      this.pump()
    })

    this.pending.set(clamped, promise)
    return promise
  }

  private sortQueue() {
    this.queue.sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0))
  }

  updateWindow(center: number) {
    const nextWanted = new Set<number>()
    const start = Math.max(1, center - this.profile.behind)
    const end = Math.min(this.profile.frameCount, center + this.profile.ahead)

    for (let index = start; index <= end; index += 1) {
      nextWanted.add(index)
    }
    this.wanted = nextWanted

    // Cancel queued tasks outside wanted window
    for (let queueIndex = this.queue.length - 1; queueIndex >= 0; queueIndex -= 1) {
      const task = this.queue[queueIndex]
      if (!nextWanted.has(task.index)) {
        this.queue.splice(queueIndex, 1)
        this.pending.delete(task.index)
        task.resolve(null)
      }
    }

    // Prune cache if exceeding maxCacheSize, evicting frames farthest from center
    if (this.cache.size > this.maxCacheSize) {
      const entries = Array.from(this.cache.keys())
      entries.sort((a, b) => Math.abs(b - center) - Math.abs(a - center))
      for (const index of entries) {
        if (!nextWanted.has(index)) {
          this.cache.delete(index)
          if (this.cache.size <= this.maxCacheSize) break
        }
      }
    }

    // Priority load the requested center frame
    void this.load(center, true)

    // Schedule window neighbors around center
    const maxDistance = Math.max(this.profile.ahead, this.profile.behind)
    for (let distance = 1; distance <= maxDistance; distance += 1) {
      if (center + distance <= end) void this.load(center + distance, false)
      if (center - distance >= start) void this.load(center - distance, false)
    }
  }

  dispose() {
    this.disposed = true
    this.wanted.clear()
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

        if (!this.disposed && (this.wanted.size === 0 || this.wanted.has(task.index))) {
          this.cache.set(task.index, image)
        }
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
  onFrameReady?: (frameIndex: number) => void
  prefersReducedMotion?: boolean
}

export function ScrollyCanvas({
  progress,
  onFrameReady,
  prefersReducedMotion = false,
}: ScrollyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const loaderRef = useRef<ProgressiveFrameLoader | null>(null)
  const profileRef = useRef<SequenceProfile | null>(null)
  const desiredFrameRef = useRef(1)
  const lastRenderedFrameRef = useRef<number | null>(null)
  const lastRenderedImageRef = useRef<HTMLImageElement | null>(null)
  const [isReady, setIsReady] = useState(false)
  const hasStartedRef = useRef(false)

  const drawImage = useCallback(
    (image: HTMLImageElement, frameIndex: number) => {
      const canvas = canvasRef.current
      const profile = profileRef.current
      if (!canvas || !profile || image.naturalWidth === 0) return

      const context = canvas.getContext('2d', { alpha: false })
      if (!context) return

      const displayWidth = canvas.clientWidth || window.innerWidth
      const displayHeight = canvas.clientHeight || window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, profile.dprCap)
      const pixelWidth = Math.min(profile.maxDimension, Math.round(displayWidth * dpr))
      const pixelHeight = Math.min(profile.maxDimension, Math.round(displayHeight * dpr))

      const sizeChanged = canvas.width !== pixelWidth || canvas.height !== pixelHeight

      // Avoid redrawing the exact same frame unless canvas size changed
      if (
        !sizeChanged &&
        lastRenderedFrameRef.current === frameIndex &&
        lastRenderedImageRef.current === image
      ) {
        return
      }

      if (sizeChanged) {
        canvas.width = pixelWidth
        canvas.height = pixelHeight
      }

      const scale = Math.max(displayWidth / image.naturalWidth, displayHeight / image.naturalHeight)
      const width = image.naturalWidth * scale
      const height = image.naturalHeight * scale

      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.drawImage(
        image,
        (displayWidth - width) / 2,
        (displayHeight - height) / 2,
        width,
        height,
      )

      lastRenderedFrameRef.current = frameIndex
      lastRenderedImageRef.current = image
      canvas.dataset.frame = String(frameIndex)
      canvas.dataset.profile = profile.name

      setIsReady(true)
      onFrameReady?.(frameIndex)
    },
    [onFrameReady],
  )

  // Initialize profile and handle resize
  useEffect(() => {
    if (prefersReducedMotion) {
      if (loaderRef.current) {
        loaderRef.current.dispose()
        loaderRef.current = null
      }
      return
    }

    const isMobile = window.innerWidth <= 820 || window.matchMedia('(pointer: coarse)').matches
    const profile = isMobile ? PROFILES.mobile : PROFILES.desktop
    const loader = new ProgressiveFrameLoader(profile)

    profileRef.current = profile
    loaderRef.current = loader

    // If initial scroll is restored mid-way or user landed via deep link, initiate target frame immediately
    if (progress > 0.005) {
      hasStartedRef.current = true
      const initialFrame = 1 + Math.round(progress * (profile.frameCount - 1))
      desiredFrameRef.current = initialFrame
      loader.updateWindow(initialFrame)
      void loader.load(initialFrame, true).then((image) => {
        if (image) drawImage(image, initialFrame)
      })
    }

    const handleResize = () => {
      const lastImage = lastRenderedImageRef.current
      const lastFrame = lastRenderedFrameRef.current
      if (lastImage && lastFrame !== null) {
        drawImage(lastImage, lastFrame)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      loader.dispose()
      loaderRef.current = null
    }
  }, [drawImage, prefersReducedMotion]) // eslint-disable-line react-hooks/exhaustive-deps

  // React to scroll progress
  useEffect(() => {
    if (prefersReducedMotion) return

    const profile = profileRef.current
    const loader = loaderRef.current
    if (!profile || !loader) return

    // Activate sequence on first relevant scroll
    if (!hasStartedRef.current) {
      if (progress <= 0.002) {
        return // At top of page: initial HTML poster is visible, conserve network
      }
      hasStartedRef.current = true
    }

    const frameIndex = 1 + Math.round(Math.max(0, Math.min(1, progress)) * (profile.frameCount - 1))
    desiredFrameRef.current = frameIndex
    loader.updateWindow(frameIndex)

    // Draw nearest candidate if it improves current frame position
    const candidate = loader.getBestCandidate(frameIndex, lastRenderedFrameRef.current)
    if (candidate) {
      drawImage(candidate.image, candidate.index)
    }

    // Priority load the exact frame
    void loader.load(frameIndex, true).then((image) => {
      if (image && desiredFrameRef.current === frameIndex) {
        drawImage(image, frameIndex)
      }
    })
  }, [drawImage, prefersReducedMotion, progress])

  if (prefersReducedMotion) {
    return null
  }

  return (
    <canvas
      ref={canvasRef}
      className={`scrolly-canvas ${isReady ? 'is-ready' : ''}`}
      aria-hidden="true"
    />
  )
}
