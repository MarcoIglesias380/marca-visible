import { useState, useEffect, useRef } from 'react'
import './App.css'

const TOTAL_FRAMES = 241

function App() {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imagesRef = useRef<HTMLImageElement[]>([])
  const currentFrameRef = useRef<number>(1)
  const targetFrameRef = useRef<number>(1)
  const animFrameIdRef = useRef<number | null>(null)

  const [loadedCount, setLoadedCount] = useState<number>(0)
  const [scrollProgress, setScrollProgress] = useState<number>(0)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [contactSubmitted, setContactSubmitted] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await fetch('https://formsubmit.co/ajax/surinnovacion7@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          Nombre: name,
          Email: email,
          Telefono_WhatsApp: phone,
          Mensaje: note || 'Solicitud de contacto desde landing Marca Personal',
          _subject: `Nuevo Lead Marca Personal: ${name}`,
          _template: 'table',
        }),
      })
      setContactSubmitted(true)
    } catch {
      setContactSubmitted(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Preload all 241 frames into memory
  useEffect(() => {
    let active = true
    const imageList: HTMLImageElement[] = []
    let loaded = 0

    // Load first frame immediately
    const firstImg = new Image()
    firstImg.src = '/frames/frame_001.jpg'
    firstImg.onload = () => {
      if (!active) return
      loaded++
      setLoadedCount(loaded)
      drawFrame(1)
    }
    imageList[1] = firstImg

    // Load remaining frames
    for (let i = 2; i <= TOTAL_FRAMES; i++) {
      const img = new Image()
      const pad = String(i).padStart(3, '0')
      img.src = `/frames/frame_${pad}.jpg`
      img.onload = () => {
        if (!active) return
        loaded++
        setLoadedCount(loaded)
      }
      imageList[i] = img
    }

    imagesRef.current = imageList

    return () => {
      active = false
    }
  }, [])

  // Draw frame on canvas with responsive cover
  const drawFrame = (frameIndex: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const clampedIndex = Math.max(1, Math.min(TOTAL_FRAMES, Math.round(frameIndex)))
    let img = imagesRef.current[clampedIndex]

    if (!img || !img.complete || img.naturalWidth === 0) {
      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        const prev = imagesRef.current[clampedIndex - offset]
        if (prev && prev.complete && prev.naturalWidth > 0) {
          img = prev
          break
        }
        const next = imagesRef.current[clampedIndex + offset]
        if (next && next.complete && next.naturalWidth > 0) {
          img = next
          break
        }
      }
    }
    if (!img || !img.complete || img.naturalWidth === 0) {
      img = imagesRef.current[1]
    }
    if (!img || !img.complete || img.naturalWidth === 0) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const displayWidth = window.innerWidth
    const displayHeight = window.innerHeight

    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
      canvas.width = displayWidth * dpr
      canvas.height = displayHeight * dpr
    }

    ctx.save()
    ctx.scale(dpr, dpr)

    const iw = img.naturalWidth
    const ih = img.naturalHeight
    const scale = Math.max(displayWidth / iw, displayHeight / ih)
    const nw = iw * scale
    const nh = ih * scale
    const nx = (displayWidth - nw) / 2
    const ny = (displayHeight - nh) / 2

    ctx.clearRect(0, 0, displayWidth, displayHeight)
    ctx.drawImage(img, nx, ny, nw, nh)
    ctx.restore()
  }

  // 60fps lerp loop for smooth forward and reverse video playback
  useEffect(() => {
    const loop = () => {
      const diff = targetFrameRef.current - currentFrameRef.current
      if (Math.abs(diff) > 0.01) {
        currentFrameRef.current += diff * 0.16
        drawFrame(currentFrameRef.current)
      }
      animFrameIdRef.current = requestAnimationFrame(loop)
    }

    animFrameIdRef.current = requestAnimationFrame(loop)

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current)
      }
    }
  }, [])

  // Sync window scroll with the entire 241-frame video track
  useEffect(() => {
    const handleScroll = () => {
      const track = trackRef.current
      if (!track) return

      const trackScrollable = track.offsetHeight - window.innerHeight
      if (trackScrollable <= 0) return

      const scrollY = window.scrollY
      const progress = Math.max(0, Math.min(1, scrollY / trackScrollable))

      targetFrameRef.current = 1 + progress * (TOTAL_FRAMES - 1)
      setScrollProgress(progress)
    }

    const handleResize = () => {
      drawFrame(currentFrameRef.current)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)

    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const scrollToPercentage = (percent: number) => {
    const track = trackRef.current
    if (!track) return
    const trackScrollable = track.offsetHeight - window.innerHeight
    window.scrollTo({
      top: trackScrollable * percent,
      behavior: 'smooth',
    })
  }

  const scrollToFooter = () => {
    const footer = document.getElementById('contacto')
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth',
      })
    }
  }

  // Limbo style: Hero is visible immediately at 100%, and each act transitions cleanly
  const getLimboStyle = (start: number, end: number, isFirst = false) => {
    let opacity = 0
    let translateY = 18

    if (isFirst) {
      if (scrollProgress <= start) {
        opacity = 1
        translateY = 0
      } else if (scrollProgress < end) {
        const fadeOutStart = end - 0.06
        if (scrollProgress < fadeOutStart) {
          opacity = 1
          translateY = 0
        } else {
          const factor = (end - scrollProgress) / (end - fadeOutStart)
          opacity = Math.max(0, Math.min(1, factor))
          translateY = (1 - factor) * -18
        }
      }
    } else {
      const fadeInEnd = start + 0.05
      const fadeOutStart = end - 0.05

      if (scrollProgress >= start && scrollProgress <= end) {
        if (scrollProgress < fadeInEnd) {
          const factor = (scrollProgress - start) / (fadeInEnd - start)
          opacity = Math.max(0, Math.min(1, factor))
          translateY = (1 - factor) * 18
        } else if (scrollProgress > fadeOutStart) {
          const factor = (end - scrollProgress) / (end - fadeOutStart)
          opacity = Math.max(0, Math.min(1, factor))
          translateY = (factor - 1) * 18
        } else {
          opacity = 1
          translateY = 0
        }
      }
    }

    return {
      opacity,
      transform: `translate3d(0, ${translateY}px, 0)`,
      pointerEvents: (opacity > 0.3 ? 'auto' : 'none') as 'auto' | 'none',
      visibility: (opacity > 0.01 ? 'visible' : 'hidden') as 'visible' | 'hidden',
    }
  }

  return (
    <div className="scrolly-root">
      {/* Background Canvas: Fixed full viewport */}
      <div className="canvas-wrapper" aria-hidden="true">
        <canvas ref={canvasRef} className="scrolly-canvas" />
        <div className="cinematic-vignette" />
      </div>

      {/* Floating Glass Header */}
      <header className="site-header" aria-label="Navegación principal">
        <button
          className="brand-button"
          type="button"
          onClick={() => scrollToPercentage(0)}
          aria-label="Volver al inicio"
        >
          <span className="brand-dot" />
          <span className="brand-text">Marca Personal</span>
        </button>

        <nav className="nav" id="main-navigation">
          <button type="button" onClick={() => scrollToPercentage(0)}>
            Inicio
          </button>
          <button type="button" onClick={() => scrollToPercentage(0.3)}>
            Posicionamiento
          </button>
          <button type="button" onClick={() => scrollToPercentage(0.6)}>
            Impacto
          </button>
          <button type="button" onClick={scrollToFooter}>
            Contacto
          </button>
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="header-cta"
            onClick={() => setIsContactOpen(true)}
          >
            Conectar
          </button>
        </div>
      </header>

      {/* Discreet Scroll Progress Line */}
      <div className="scroll-indicator-bar" style={{ width: `${scrollProgress * 100}%` }} />

      {/* TRACK DE SCROLL: EL VIDEO COMPLETO TRANSCURRE AQUÍ (500vh) */}
      <div className="scroll-track" ref={trackRef}>
        <div className="stage-sticky-container">
          <div className="limbo-container">
            {/* ACTO 01: EL ENFOQUE (Cabina del avión · 0% - 24%) */}
            <div className="limbo-act left-aligned" style={getLimboStyle(0, 0.25, true)}>
              <div className="limbo-caption">
                <span className="micro-tag">01 · ESENCIA</span>
                <h1 className="caption-title">Tu conocimiento merece ser referente.</h1>
                <p className="caption-subtitle">De invisible a influyente.</p>
                <div className="caption-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setIsContactOpen(true)}
                  >
                    Conectar
                  </button>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => scrollToPercentage(0.3)}
                  >
                    Deslizar para explorar ↓
                  </button>
                </div>
              </div>
            </div>

            {/* ACTO 02: POSICIONAMIENTO (Acercamiento a la ventana · 26% - 50%) */}
            <div className="limbo-act left-aligned" style={getLimboStyle(0.26, 0.52)}>
              <div className="limbo-caption">
                <span className="micro-tag">02 · POSICIONAMIENTO</span>
                <h2 className="caption-title">Dejar de competir por precio.</h2>
                <p className="caption-subtitle">
                  Cuando tu identidad es sólida y tu mensaje es claro, el mercado correcto deja de compararte y comienza a buscarte.
                </p>
                <div className="caption-actions">
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => scrollToPercentage(0.6)}
                  >
                    Continuar recorrido ↓
                  </button>
                </div>
              </div>
            </div>

            {/* ACTO 03: ELEVACIÓN & IA (Saliendo por la ventana · 52% - 75%) */}
            <div className="limbo-act left-aligned" style={getLimboStyle(0.53, 0.76)}>
              <div className="limbo-caption">
                <span className="micro-tag">03 · ELEVACIÓN & IA</span>
                <h2 className="caption-title">Amplifica tu impacto sin perder tu esencia.</h2>
                <p className="caption-subtitle">
                  Estrategia visual y tecnología para multiplicar tu presencia digital manteniendo tu autenticidad.
                </p>
                <div className="caption-actions">
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => scrollToPercentage(0.82)}
                  >
                    Ver el horizonte ↓
                  </button>
                </div>
              </div>
            </div>

            {/* ACTO 04: EL HORIZONTE (Montañas y atardecer completo · 78% - 98%) */}
            <div className="limbo-act left-aligned" style={getLimboStyle(0.78, 0.98)}>
              <div className="limbo-caption">
                <span className="micro-tag">04 · EL SIGUIENTE NIVEL</span>
                <h2 className="caption-title">Haz visible lo que ya existe en ti.</h2>
                <p className="caption-subtitle">
                  El mundo profesional no premia a los mejores en silencio; premia a quienes saben comunicar su verdadero valor.
                </p>
                <div className="caption-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setIsContactOpen(true)}
                  >
                    Iniciar Conversación
                  </button>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={scrollToFooter}
                  >
                    Ver datos de contacto ↓
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PIE DE PÁGINA RÍGIDO: A CONTINUACIÓN DEL VIDEO */}
      <footer className="rigid-footer" id="contacto">
        <div className="rigid-footer-inner">
          {/* Texto motivador de marca personal */}
          <div className="rigid-quote-box">
            <span className="quote-mark">“</span>
            <p className="rigid-quote-text">
              Tu marca personal no es solo lo que dices de ti; es la huella, la coherencia y el estándar de excelencia que dejas en quienes eligen confiar en tu visión. Haz de tu nombre un referente.
            </p>
          </div>

          {/* Datos de contacto y SurInnovacion */}
          <div className="rigid-meta-section">
            <div className="rigid-brand-info">
              <span className="rigid-brand-name">SurInnovacion</span>
              <p className="rigid-brand-desc">Consultoría Estratégica & Inteligencia Artificial</p>
              <address className="rigid-address">
                <span className="icon">📍</span> Avenida Cuarta Terraza 5098 · Valle Volcanes, Puerto Montt
              </address>
            </div>

            <div className="rigid-contact-actions">
              <a
                href="https://wa.me/56992891678?text=Hola%20Marco,%20quiero%20conversar%20sobre%20Marca%20Personal"
                target="_blank"
                rel="noreferrer"
                className="rigid-phone-btn"
              >
                <span className="phone-icon">📞</span>
                <div>
                  <span className="phone-label">Fono & WhatsApp directo</span>
                  <span className="phone-number">+56 9 9289 1678</span>
                </div>
              </a>

              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsContactOpen(true)}
              >
                Agendar Conversación
              </button>
            </div>
          </div>

          {/* Barra inferior de créditos */}
          <div className="rigid-copyright-bar">
            <p className="credit-text">
              Creado por <strong>Marco Iglesias</strong> by <strong>SurInnovacion</strong>
            </p>
            <button
              type="button"
              className="scroll-top-btn"
              onClick={() => scrollToPercentage(0)}
              aria-label="Volver arriba"
            >
              ↑ Volver al inicio
            </button>
          </div>
        </div>
      </footer>

      {/* Modal de Conexión / Contacto */}
      {isContactOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setIsContactOpen(false)}
        >
          <div
            className="booking-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setIsContactOpen(false)}
              aria-label="Cerrar formulario"
            >
              ✕
            </button>

            {!contactSubmitted ? (
              <>
                <span className="micro-tag">CONEXIÓN DIRECTA</span>
                <h2 id="contact-title">Potencia tu Marca Personal</h2>
                <p className="booking-modal-subtitle">
                  Conversemos sobre tu visión profesional y los próximos pasos para elevar tu posicionamiento.
                </p>

                <form className="booking-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Nombre y Apellido</label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre completo"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Correo Electrónico</label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nombre@empresa.com"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">WhatsApp o Teléfono</label>
                    <input
                      id="phone"
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+56 9 9289 1678"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="note">¿Qué desafío buscas potenciar? (Opcional)</label>
                    <input
                      id="note"
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ej. Posicionamiento, conferencias, consultoría..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary large full-width"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Enviando a surinnovacion7@gmail.com...' : 'Enviar Mensaje'}
                  </button>
                  <p className="form-privacy-note">
                    🔒 Tu mensaje llegará directamente a <strong>surinnovacion7@gmail.com</strong>
                  </p>
                </form>
              </>
            ) : (
              <div className="booking-success">
                <div className="success-icon">✓</div>
                <h2>¡Mensaje Enviado con Éxito!</h2>
                <p>
                  Tus datos fueron remitidos directamente a <strong>surinnovacion7@gmail.com</strong>. Marco Iglesias se pondrá en contacto contigo a la brevedad.
                </p>
                <div className="success-actions">
                  <a
                    href={`https://wa.me/56992891678?text=${encodeURIComponent(`Hola Marco, envié mis datos desde la web de Marca Personal (Nombre: ${name}, Email: ${email}).`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-whatsapp"
                  >
                    <span>💬</span> Avisar también por WhatsApp
                  </a>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => {
                      setIsContactOpen(false)
                      setContactSubmitted(false)
                      setName('')
                      setEmail('')
                      setPhone('')
                      setNote('')
                    }}
                  >
                    Cerrar ventana
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preload status */}
      {loadedCount < TOTAL_FRAMES && (
        <div className="preload-status" aria-live="polite">
          <div className="preload-spinner" />
          <span>Cargando secuencia cinemática ({loadedCount}/{TOTAL_FRAMES})...</span>
        </div>
      )}
    </div>
  )
}

export default App
