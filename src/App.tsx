import { useState, useEffect, useRef } from 'react'
import './App.css'
import { ScrollyCanvas } from './ScrollyCanvas'

function App() {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const scrollProgressRef = useRef(0)

  const [scrollProgress, setScrollProgress] = useState<number>(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
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

  // Listen for prefers-reduced-motion changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', updateMotion)
    return () => mediaQuery.removeEventListener('change', updateMotion)
  }, [])

  // Sync scroll with a fixed-length runway and preserve progress on rotation.
  useEffect(() => {
    let scrollRaf: number | null = null
    let resizeTimer: number | null = null
    let preservingProgress = false
    let wasLandscape = window.innerWidth > window.innerHeight

    const measureProgress = () => {
      scrollRaf = null
      if (preservingProgress) return
      const track = trackRef.current
      if (!track) return

      const trackScrollable = track.offsetHeight - window.innerHeight
      if (trackScrollable <= 0) return

      const progress = Math.max(
        0,
        Math.min(1, (window.scrollY - track.offsetTop) / trackScrollable),
      )

      scrollProgressRef.current = progress
      setScrollProgress((previous) => Math.abs(previous - progress) < 0.0005 ? previous : progress)
    }

    const handleScroll = () => {
      if (scrollRaf === null) scrollRaf = requestAnimationFrame(measureProgress)
    }

    const handleResize = () => {
      const isLandscape = window.innerWidth > window.innerHeight
      if (isLandscape === wasLandscape) {
        handleScroll()
        return
      }

      wasLandscape = isLandscape
      preservingProgress = true

      const track = trackRef.current
      const currentScrollY = window.scrollY
      const trackTop = track ? track.offsetTop : 0
      const trackScrollable = track ? Math.max(1, track.offsetHeight - window.innerHeight) : 1
      const isPastHero = currentScrollY >= (trackTop + trackScrollable - 20)

      const savedProgress = scrollProgressRef.current
      const pastTrackDelta = Math.max(0, currentScrollY - (trackTop + trackScrollable))

      if (resizeTimer !== null) window.clearTimeout(resizeTimer)

      resizeTimer = window.setTimeout(() => {
        const currentTrack = trackRef.current
        if (currentTrack) {
          const newTrackScrollable = Math.max(1, currentTrack.offsetHeight - window.innerHeight)
          if (isPastHero) {
            // Preserve post-hero scroll offset across #concepto, #consejos, or #contacto
            window.scrollTo({
              top: currentTrack.offsetTop + newTrackScrollable + pastTrackDelta,
              behavior: 'auto',
            })
          } else {
            window.scrollTo({
              top: currentTrack.offsetTop + savedProgress * newTrackScrollable,
              behavior: 'auto',
            })
          }
        }

        if (!isPastHero) {
          scrollProgressRef.current = savedProgress
          setScrollProgress(savedProgress)
        }
        preservingProgress = false
        handleScroll()
      }, 150)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)

    measureProgress()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      if (scrollRaf !== null) cancelAnimationFrame(scrollRaf)
      if (resizeTimer !== null) window.clearTimeout(resizeTimer)
    }
  }, [])

  const scrollToPercentage = (percent: number) => {
    const track = trackRef.current
    if (!track) return
    const trackScrollable = track.offsetHeight - window.innerHeight
    window.scrollTo({
      top: track.offsetTop + trackScrollable * percent,
      behavior: 'smooth',
    })
  }

  const scrollToSection = (id: string) => {
    const target = document.getElementById(id)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    } else if (id === 'contacto') {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth',
      })
    }
  }

  // Limbo style: Hero is visible immediately at 100%, and each act transitions cleanly
  const getLimboStyle = (start: number, end: number, isFirst = false) => {
    if (prefersReducedMotion) {
      const isActive = isFirst
        ? scrollProgress <= end
        : scrollProgress >= start && scrollProgress <= end
      const opacity = isActive ? 1 : 0
      return {
        opacity,
        transform: 'none',
        pointerEvents: (opacity > 0.3 ? 'auto' : 'none') as 'auto' | 'none',
        visibility: (opacity > 0.01 ? 'visible' : 'hidden') as 'visible' | 'hidden',
      }
    }

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
          <button type="button" onClick={() => scrollToSection('concepto')}>
            Qué es
          </button>
          <button type="button" onClick={() => scrollToSection('consejos')}>
            Consejos
          </button>
          <button type="button" onClick={() => scrollToSection('contacto')}>
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
      <div
        className="scroll-indicator-bar"
        style={{ transform: `scaleX(${scrollProgress})` }}
      />

      {/* TRACK DE SCROLL: EL VIDEO COMPLETO TRANSCURRE AQUÍ (500vh) */}
      <div className="scroll-track" ref={trackRef}>
        <div className="stage-sticky-container">
          {/* Background Canvas & Initial Hero Picture inside sticky stage so the last frame scrolls off naturally */}
          <div className="canvas-wrapper" aria-hidden="true">
            <picture className="hero-initial-picture">
              <source
                media="(max-width: 820px)"
                srcSet="/frames-v4/mobile/frame_001.webp"
                type="image/webp"
              />
              <img
                src="/frames-v4/desktop/frame_001.webp"
                alt=""
                className="hero-initial-img"
                fetchPriority="high"
                decoding="async"
              />
            </picture>
            <ScrollyCanvas
              progress={scrollProgress}
              prefersReducedMotion={prefersReducedMotion}
            />
            <div className="cinematic-vignette" />
          </div>

          <div className="limbo-container">
            {/* ACTO 01: MARCA PERSONAL (Cabina del avión · 0% - 25%) */}
            <div className="limbo-act left-aligned" style={getLimboStyle(0, 0.25, true)}>
              <div className="limbo-caption">
                <span className="micro-tag">01 · MARCA PERSONAL</span>
                <h1 className="caption-title">Las personas eligen a personas.</h1>
                <p className="caption-subtitle">
                  Construye una marca personal sólida, visible y rentable sin perder tu esencia.
                </p>
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
                    Explorar la guía ↓
                  </button>
                </div>
              </div>
            </div>

            {/* ACTO 02: VISIBILIDAD (Acercamiento a la ventana · 26% - 52%) */}
            <div className="limbo-act left-aligned" style={getLimboStyle(0.26, 0.52)}>
              <div className="limbo-caption">
                <span className="micro-tag">02 · VISIBILIDAD</span>
                <h2 className="caption-title">Tu problema no es tu talento. Es que no te ven.</h2>
                <p className="caption-subtitle">
                  Nadie confía en un logo sin rostro. Mostrarte con claridad convierte desconocidos en clientes.
                </p>
                <div className="caption-actions">
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => scrollToPercentage(0.6)}
                  >
                    Siguiente clave ↓
                  </button>
                </div>
              </div>
            </div>

            {/* ACTO 03: AUTORIDAD (Saliendo por la ventana · 53% - 76%) */}
            <div className="limbo-act left-aligned" style={getLimboStyle(0.53, 0.76)}>
              <div className="limbo-caption">
                <span className="micro-tag">03 · AUTORIDAD</span>
                <h2 className="caption-title">Tu nombre es lo único que nadie puede copiar.</h2>
                <p className="caption-subtitle">
                  Cuando aportas valor real y compartes tu criterio, el mercado deja de comparar precios y te busca a ti.
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

            {/* ACTO 04: OPORTUNIDAD (Horizonte completo · 78% - 98%) */}
            <div className="limbo-act left-aligned" style={getLimboStyle(0.78, 0.98)}>
              <div className="limbo-caption">
                <span className="micro-tag">04 · OPORTUNIDAD</span>
                <h2 className="caption-title">No necesitas millones de seguidores.</h2>
                <p className="caption-subtitle">
                  Con método, coherencia y una audiencia comprometida, tu marca abre puertas, clientes y libertad.
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
                    onClick={() => scrollToSection('concepto')}
                  >
                    Desarrollar el concepto ↓
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: DESARROLLO DEL CONCEPTO DE MARCA PERSONAL */}
      <section className="concept-section" id="concepto" aria-labelledby="concept-heading">
        <div className="concept-inner">
          <div className="concept-grid">
            <div className="concept-media">
              <picture>
                <source
                  media="(max-width: 820px)"
                  srcSet="/images/concept-executive-v1-mobile.webp"
                  type="image/webp"
                />
                <img
                  src="/images/concept-executive-v1-desktop.webp"
                  alt="Ejecutivo frente a ventanal panorámico al atardecer proyectando visión de marca personal"
                  className="concept-img"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
              <div className="concept-media-sheen" aria-hidden="true" />
            </div>

            <div className="concept-content">
              <span className="micro-tag">EL CONCEPTO</span>
              <h2 id="concept-heading" className="section-title">
                No es fama. Es confianza diseñada con intención.
              </h2>
              <p className="section-lead">
                Tu marca personal es la huella que dejas antes de entrar a una reunión: lo que tu mercado entiende que resuelves, el estándar que percibe y la razón por la que decide confiar en ti.
              </p>

              <div className="concept-shifts">
                <div className="concept-shift-item">
                  <h3>De invisible a referente</h3>
                  <p>
                    Deja de depender solo del boca a boca y ocupa el lugar de referencia en tu sector.
                  </p>
                </div>
                <div className="concept-shift-item">
                  <h3>De perseguir a atraer</h3>
                  <p>
                    Cuando educas con claridad, los clientes llegan convencidos y listos para conversar.
                  </p>
                </div>
                <div className="concept-shift-item">
                  <h3>De improvisar a método</h3>
                  <p>
                    Identidad visual coherente, mensaje nítido y presencia constante sin perder autenticidad.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: CONSEJOS PRÁCTICOS PARA CREAR TU MARCA PERSONAL */}
      <section className="tips-section" id="consejos" aria-labelledby="tips-heading">
        <div className="tips-inner">
          <header className="section-header">
            <span className="micro-tag">GUÍA PRÁCTICA · 4 CLAVES</span>
            <h2 id="tips-heading" className="section-title">
              Cómo crear tu marca personal paso a paso
            </h2>
            <p className="section-lead">
              Lo más importante para empezar con dirección, destacar sin artificios y transformar tu presencia digital en oportunidades reales.
            </p>
          </header>

          <div className="tips-grid">
            <article className="tip-card">
              <span className="micro-tag">01 · IDENTIDAD</span>
              <h3 className="tip-title">Diseña antes de grabar</h3>
              <p className="tip-body">
                Define qué transmites, tus colores, tu tono y una biografía clara: quién eres, a quién ayudas y cómo. La calidad de imagen, luz y audio refleja la calidad de tu trabajo.
              </p>
            </article>

            <article className="tip-card">
              <span className="micro-tag">02 · AUDIENCIA</span>
              <h3 className="tip-title">Habla de dolores y deseos reales</h3>
              <p className="tip-body">
                Las personas solo se detienen ante lo útil, entretenido o inspirador. Apóyate en escucha activa e Inteligencia Artificial para mapear sus problemas concretos.
              </p>
            </article>

            <article className="tip-card">
              <span className="micro-tag">03 · CONTENIDO</span>
              <h3 className="tip-title">Combina valor práctico y visión</h3>
              <p className="tip-body">
                Atrapa la atención en los primeros 3 segundos. Lo práctico demuestra tu autoridad experta; lo reflexivo conecta con tus valores y te diferencia de cualquiera.
              </p>
            </article>

            <article className="tip-card">
              <span className="micro-tag">04 · CONVERSIÓN</span>
              <h3 className="tip-title">Transforma confianza en diálogo</h3>
              <p className="tip-body">
                No persigas ni vendas de forma agresiva. Entrega un recurso útil, abre conversaciones reales escuchando más de lo que hablas y deja que la compra fluya.
              </p>
            </article>
          </div>

          <div className="tips-habits-bar" aria-label="Hábitos clave para sostener tu marca">
            <div className="tips-habit-item">
              <strong>Graba en bloques</strong>
              <span>Produce varias piezas en una sesión para sostener el ritmo.</span>
            </div>
            <div className="tips-habit-item">
              <strong>Constancia &gt; perfección</strong>
              <span>El método sostenido supera al miedo a exponerse.</span>
            </div>
            <div className="tips-habit-item">
              <strong>Audiencia correcta</strong>
              <span>Una comunidad pequeña y fiel genera más impacto que miles pasivos.</span>
            </div>
          </div>

          <div className="tips-cta-row">
            <button
              type="button"
              className="btn-primary"
              onClick={() => setIsContactOpen(true)}
            >
              Potenciar mi Marca Personal
            </button>
            <button
              type="button"
              className="btn-link"
              onClick={() => scrollToSection('contacto')}
            >
              Ir a contacto ↓
            </button>
          </div>
        </div>
      </section>

      {/* PIE DE PÁGINA RÍGIDO: A CONTINUACIÓN DEL VIDEO */}
      <footer className="rigid-footer" id="contacto">
        <picture className="footer-bg-picture" aria-hidden="true">
          <source
            media="(max-width: 820px)"
            srcSet="/images/footer-atmosphere-v1-mobile.webp"
            type="image/webp"
          />
          <img
            src="/images/footer-atmosphere-v1-desktop.webp"
            alt=""
            className="footer-bg-img"
            loading="lazy"
            decoding="async"
          />
        </picture>
        <div className="footer-bg-overlay" aria-hidden="true" />
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
    </div>
  )
}

export default App
