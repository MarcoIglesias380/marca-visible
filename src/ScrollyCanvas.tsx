import { useCallback, useEffect, useRef, useState } from 'react'

type SequenceProfile = {
  name: 'desktop' | 'mobile'
  frameCount: number
  ahead: number
  behind: number
  concurrency: number
  bgConcurrency: number
  dprCap: number
  maxDimension: number
  maxCacheSize: number
}

const PROFILES: Record<SequenceProfile['name'], SequenceProfile> = {
  desktop: {
    name: 'desktop',
    frameCount: 120,
    ahead: 12,
    behind: 6,
    concurrency: 6,
    bgConcurrency: 2,
    dprCap: 1.5,
    maxDimension: 1920,
    maxCacheSize: 120,
  },
  mobile: {
    name: 'mobile',
    frameCount: 72,
    ahead: 8,
    behind: 4,
    concurrency: 4,
    bgConcurrency: 2,
    dprCap: 1.25,
    maxDimension: 1080,
    maxCacheSize: 72,
  },
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

const frameUrl = (profile: SequenceProfile, index: number) =>
  `/frames-v4/${profile.name}/frame_${String(index).padStart(3, '0')}.webp`

type ViewportMetrics = {
  displayWidth: number
  displayHeight: number
  dpr: number
  pixelWidth: number
  pixelHeight: number
}

class ProgressiveFrameLoader {
  private readonly profile: SequenceProfile
  private readonly onFrameLoaded: (index: number, image: HTMLImageElement) => void
  private readonly cache = new Map<number, HTMLImageElement>()
  private readonly inFlight = new Set<number>()
  private priorityQueue: number[] = []
  private bgQueue: number[] = []
  private bgStarted = false
  private active = 0
  private disposed = false

  constructor(
    profile: SequenceProfile,
    onFrameLoaded: (index: number, image: HTMLImageElement) => void,
  ) {
    this.profile = profile
    this.onFrameLoaded = onFrameLoaded
  }

  get(index: number): HTMLImageElement | null {
    return this.cache.get(index) ?? null
  }

  /**
   * Returns exact match if cached, or nearest cached frame ONLY if strictly closer
   * to targetIndex than currentRenderedIndex.
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

  updateWindow(center: number) {
    const start = Math.max(1, center - this.profile.behind)
    const end = Math.min(this.profile.frameCount, center + this.profile.ahead)
    const wantedSet = new Set<number>()
    const nextPriority: number[] = []

    for (let index = start; index <= end; index += 1) {
      wantedSet.add(index)
      if (!this.cache.has(index) && !this.inFlight.has(index)) {
        nextPriority.push(index)
      }
    }

    // Prioritize exact center first, then outward by distance
    nextPriority.sort((a, b) => Math.abs(a - center) - Math.abs(b - center))
    this.priorityQueue = nextPriority

    if (this.bgQueue.length > 0) {
      this.bgQueue = this.bgQueue.filter((index) => !wantedSet.has(index))
    }

    this.pump()
  }

  /**
   * Queues remaining frames in stride order (stride-4 keyframes, then stride-2, then rest)
   * so scrubbing forward and backward quickly becomes instant without stalling scroll priority.
   */
  startBackgroundFill() {
    if (this.bgStarted || this.disposed) return
    this.bgStarted = true

    const queued = new Set<number>(this.priorityQueue)
    const addIndex = (index: number) => {
      if (
        index >= 1 &&
        index <= this.profile.frameCount &&
        !this.cache.has(index) &&
        !this.inFlight.has(index) &&
        !queued.has(index)
      ) {
        this.bgQueue.push(index)
        queued.add(index)
      }
    }

    for (let i = 1; i <= this.profile.frameCount; i += 4) addIndex(i)
    addIndex(this.profile.frameCount)
    for (let i = 3; i <= this.profile.frameCount; i += 4) addIndex(i)
    for (let i = 2; i <= this.profile.frameCount; i += 2) addIndex(i)

    this.pump()
  }

  dispose() {
    this.disposed = true
    this.priorityQueue = []
    this.bgQueue = []
    this.inFlight.clear()
    this.cache.clear()
  }

  private pump() {
    if (this.disposed) return

    while (this.priorityQueue.length > 0 && this.active < this.profile.concurrency) {
      const nextIndex = this.priorityQueue.shift()
      if (nextIndex !== undefined) this.fetchFrame(nextIndex)
    }

    while (
      this.priorityQueue.length === 0 &&
      this.bgQueue.length > 0 &&
      this.active < this.profile.bgConcurrency
    ) {
      const nextIndex = this.bgQueue.shift()
      if (nextIndex !== undefined) this.fetchFrame(nextIndex)
    }
  }

  private fetchFrame(index: number) {
    if (this.disposed || this.cache.has(index) || this.inFlight.has(index)) return

    this.inFlight.add(index)
    this.active += 1

    const image = new Image()
    image.decoding = 'async'
    image.onload = async () => {
      try {
        await image.decode()
      } catch {
        // onload already guarantees a drawable image in browsers without decode().
      }

      this.inFlight.delete(index)
      this.active -= 1

      if (!this.disposed && image.naturalWidth > 0) {
        if (this.cache.size < this.profile.maxCacheSize) {
          this.cache.set(index, image)
        }
        this.onFrameLoaded(index, image)
      }

      this.pump()
    }
    image.onerror = () => {
      this.inFlight.delete(index)
      this.active -= 1
      this.pump()
    }
    image.src = frameUrl(this.profile, index)
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
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const viewportRef = useRef<ViewportMetrics | null>(null)
  const loaderRef = useRef<ProgressiveFrameLoader | null>(null)
  const profileRef = useRef<SequenceProfile | null>(null)

  const targetProgressRef = useRef(clamp01(progress))
  const displayProgressRef = useRef(clamp01(progress))
  const desiredFrameRef = useRef(1)
  const lastRenderedFrameRef = useRef<number | null>(null)
  const lastRenderedImageRef = useRef<HTMLImageElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const hasStartedRef = useRef(false)
  const isReadyRef = useRef(false)
  const onFrameReadyRef = useRef(onFrameReady)
  onFrameReadyRef.current = onFrameReady

  const [isReady, setIsReady] = useState(false)

  const syncViewport = useCallback(() => {
    const canvas = canvasRef.current
    const profile = profileRef.current
    if (!canvas || !profile) return

    if (!ctxRef.current) {
      ctxRef.current = canvas.getContext('2d', { alpha: false })
    }

    const displayWidth = canvas.clientWidth || window.innerWidth
    const displayHeight = canvas.clientHeight || window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, profile.dprCap)
    const pixelWidth = Math.min(profile.maxDimension, Math.round(displayWidth * dpr))
    const pixelHeight = Math.min(profile.maxDimension, Math.round(displayHeight * dpr))

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth
      canvas.height = pixelHeight
    }

    viewportRef.current = { displayWidth, displayHeight, dpr, pixelWidth, pixelHeight }
  }, [])

  const drawImage = useCallback((image: HTMLImageElement, frameIndex: number, force = false) => {
    const canvas = canvasRef.current
    const profile = profileRef.current
    const context = ctxRef.current
    const viewport = viewportRef.current
    if (!canvas || !profile || !context || !viewport || image.naturalWidth === 0) return

    if (
      !force &&
      lastRenderedFrameRef.current === frameIndex &&
      lastRenderedImageRef.current === image
    ) {
      return
    }

    const { displayWidth, displayHeight, dpr } = viewport
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

    if (!isReadyRef.current) {
      isReadyRef.current = true
      setIsReady(true)
    }
    onFrameReadyRef.current?.(frameIndex)
  }, [])

  const stepFrame = useCallback(
    (normalizedProgress: number) => {
      const profile = profileRef.current
      const loader = loaderRef.current
      if (!profile || !loader) return

      const frameIndex = 1 + Math.round(clamp01(normalizedProgress) * (profile.frameCount - 1))
      if (frameIndex === desiredFrameRef.current && lastRenderedFrameRef.current === frameIndex) {
        return
      }

      desiredFrameRef.current = frameIndex
      loader.updateWindow(frameIndex)

      const candidate = loader.getBestCandidate(frameIndex, lastRenderedFrameRef.current)
      if (candidate) {
        drawImage(candidate.image, candidate.index)
      }
    },
    [drawImage],
  )

  const scheduleAnimation = useCallback(() => {
    if (rafRef.current !== null) return

    const tick = () => {
      const target = targetProgressRef.current
      const current = displayProgressRef.current
      const diff = target - current

      if (Math.abs(diff) < 0.0008) {
        displayProgressRef.current = target
        stepFrame(target)
        rafRef.current = null
        return
      }

      const next = current + diff * 0.24
      displayProgressRef.current = next
      stepFrame(next)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [stepFrame])

  // Initialize profile, viewport metrics, and handle resize
  useEffect(() => {
    if (prefersReducedMotion) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (loaderRef.current) {
        loaderRef.current.dispose()
        loaderRef.current = null
      }
      return
    }

    const isMobile = window.innerWidth <= 820 || window.matchMedia('(pointer: coarse)').matches
    const profile = isMobile ? PROFILES.mobile : PROFILES.desktop
    profileRef.current = profile
    syncViewport()

    const loader = new ProgressiveFrameLoader(profile, (loadedIndex, image) => {
      const target = desiredFrameRef.current
      const current = lastRenderedFrameRef.current
      if (
        current === null ||
        loadedIndex === target ||
        Math.abs(target - loadedIndex) < Math.abs(target - current)
      ) {
        drawImage(image, loadedIndex)
      }
    })
    loaderRef.current = loader

    // If initial scroll is restored mid-way or entered via anchor link, load target area right away
    const initialProgress = clamp01(progress)
    if (initialProgress > 0.005) {
      hasStartedRef.current = true
      targetProgressRef.current = initialProgress
      displayProgressRef.current = initialProgress
      const initialFrame = 1 + Math.round(initialProgress * (profile.frameCount - 1))
      desiredFrameRef.current = initialFrame
      loader.updateWindow(initialFrame)
      loader.startBackgroundFill()
    }

    const handleResize = () => {
      syncViewport()
      const lastImage = lastRenderedImageRef.current
      const lastFrame = lastRenderedFrameRef.current
      if (lastImage && lastFrame !== null) {
        drawImage(lastImage, lastFrame, true)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      loader.dispose()
      loaderRef.current = null
    }
  }, [drawImage, prefersReducedMotion, syncViewport]) // eslint-disable-line react-hooks/exhaustive-deps

  // React to scroll progress updates with rAF interpolation
  useEffect(() => {
    if (prefersReducedMotion) return

    const profile = profileRef.current
    const loader = loaderRef.current
    if (!profile || !loader) return

    const clamped = clamp01(progress)
    targetProgressRef.current = clamped

    // Defer sequence fetching until first relevant scroll
    if (!hasStartedRef.current) {
      if (clamped <= 0.002) {
        return
      }
      hasStartedRef.current = true
      displayProgressRef.current = clamped
      stepFrame(clamped)
      loader.startBackgroundFill()
      return
    }

    scheduleAnimation()
  }, [prefersReducedMotion, progress, scheduleAnimation, stepFrame])

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
