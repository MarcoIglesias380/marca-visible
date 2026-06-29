import { useState } from 'react'
import './App.css'

type Speaker = {
  id: string
  number: string
  name: string
  role: string
  visiblePhrase: string
  buttonLabel: string
  talkTitle: string
  description: string
  takeaways: string[]
  initials: string
  image: string
  variant?: 'ai'
}

const speakers: Speaker[] = [
  {
    id: 'leslie',
    number: '01',
    name: 'Leslie Langenbach',
    role: 'Mentora Estratégica de Marca Personal',
    visiblePhrase: 'Estrategia para pasar de invisible a referente.',
    buttonLabel: 'Conócela',
    talkTitle: 'De invisible a Referente',
    description:
      'Estrategias de visibilidad, diferenciación y posicionamiento para fortalecer una marca personal sólida, auténtica y capaz de generar confianza, conexiones y nuevas oportunidades.',
    takeaways: [
      'Claridad sobre los pilares de una marca personal sólida.',
      'Herramientas para diferenciarte con intención.',
      'Un mapa inicial para comenzar a posicionarte como referente.',
    ],
    initials: 'LL',
    image: '/assets/speakers/leslie.png',
  },
  {
    id: 'katia',
    number: '02',
    name: 'Katia Mendizábal',
    role: 'Coach de Mentalidad y Bienestar',
    visiblePhrase: 'Mentalidad para sostener tu crecimiento.',
    buttonLabel: 'Conócela',
    talkTitle: 'Mentalidad detrás de una marca influyente',
    description:
      'Herramientas internas para fortalecer la confianza, gestionar la energía y sostener la visibilidad en el tiempo con coherencia y constancia.',
    takeaways: [
      'Herramientas para fortalecer una mentalidad de crecimiento.',
      'Estrategias para gestionar tu energía.',
      'Hábitos para liderar tu marca con más confianza.',
    ],
    initials: 'KM',
    image: '/assets/speakers/katia.jpeg',
  },
  {
    id: 'maida',
    number: '03',
    name: 'Maida Subercaseaux',
    role: 'Asesora de Imagen y Estilismo Estratégico',
    visiblePhrase: 'Imagen personal como herramienta de posicionamiento.',
    buttonLabel: 'Conócela',
    talkTitle: 'Proyecta una imagen que respalde el valor de tu marca',
    description:
      'Una mirada estratégica sobre cómo alinear tu presencia, imagen y primera impresión con el mensaje profesional que deseas comunicar.',
    takeaways: [
      'Claridad sobre la imagen que quieres proyectar.',
      'Herramientas para comunicar confianza desde el primer encuentro.',
      'Una nueva mirada sobre el impacto de tu presencia profesional.',
    ],
    initials: 'MS',
    image: '/assets/speakers/maida.png',
  },
  {
    id: 'dennis',
    number: '04',
    name: 'Dennis Velis',
    role: 'Marketing y Visibilidad Estratégica',
    visiblePhrase: 'Haz que tu marca llegue a las personas correctas.',
    buttonLabel: 'Conócelo',
    talkTitle: 'Haz que tu marca llegue a las personas correctas',
    description:
      'Presencia digital estratégica para que tu marca sea encontrada, recordada y elegida, aumentando visibilidad sin perder autenticidad.',
    takeaways: [
      'Una visión más estratégica de tu presencia digital.',
      'Claridad sobre los canales que realmente impulsan tu marca.',
      'Ideas prácticas para aumentar tu visibilidad con intención.',
    ],
    initials: 'DV',
    image: '/assets/speakers/dennis.png',
  },
  {
    id: 'marco',
    number: '05',
    name: 'Marco Iglesias',
    role: 'Master y Divulgador de Inteligencia Artificial',
    visiblePhrase: 'IA para potenciar tu marca sin perder tu voz.',
    buttonLabel: 'Conócelo',
    talkTitle: 'La Inteligencia Artificial como la mejor aliada de tu marca',
    description:
      'La Inteligencia Artificial no viene a reemplazar tu esencia. Viene a darte más tiempo para potenciarla. Aprenderás cómo integrar herramientas de IA para optimizar procesos, crear contenido con mayor eficiencia y fortalecer tu posicionamiento, manteniendo una comunicación auténtica y alineada con tu identidad.',
    takeaways: [
      'Nuevas formas de ahorrar tiempo en la creación de contenido.',
      'Herramientas para amplificar tu visibilidad con IA.',
      'Una mirada práctica sobre cómo usar tecnología sin perder tu voz.',
    ],
    initials: 'MI',
    image: '/assets/speakers/marco.png',
    variant: 'ai',
  },
  {
    id: 'valeska',
    number: '06',
    name: 'Valeska Morales',
    role: 'Fotógrafa de Marca Personal · Nina Home Studio',
    visiblePhrase: 'Tu imagen también comunica.',
    buttonLabel: 'Conócela',
    talkTitle: 'Tu imagen también comunica',
    description:
      'Sesión fotográfica estratégica de marca personal con dirección de imagen para comunicar autenticidad, confianza y coherencia con tu marca.',
    takeaways: [
      'Una sesión fotográfica alineada con tu identidad y propósito.',
      'Imágenes profesionales listas para potenciar tu presencia digital.',
      'Dirección de imagen para proyectar seguridad y coherencia.',
    ],
    initials: 'VM',
    image: '/assets/speakers/valeska.png',
  },
]

const navItems = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#experiencia', label: 'Experiencia' },
  { href: '#relatores', label: 'Relatores' },
  { href: '#inversion', label: 'Inversión' },
  { href: '#ubicacion', label: 'Ubicación' },
]

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null)

  const closeMenu = () => setIsMenuOpen(false)
  const closeSpeakerModal = () => setSelectedSpeaker(null)

  return (
    <div className="site-shell">
      <header className="site-header" aria-label="Navegación principal">
        <a className="brand" href="#inicio" onClick={closeMenu} aria-label="Marca Visible - Inicio">
          <span>Marca Visible</span>
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isMenuOpen}
          aria-controls="main-navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>

        <nav id="main-navigation" className={isMenuOpen ? 'nav is-open' : 'nav'}>
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={closeMenu}>
              {item.label}
            </a>
          ))}
          <a className="nav-cta" href="#inversion" onClick={closeMenu}>
            Reservar cupo
          </a>
        </nav>
      </header>

      <main>
        <section id="inicio" className="hero-section" aria-labelledby="hero-title">
          <div className="hero-ambient" aria-hidden="true">
            <div className="hero-image-placeholder" />
          </div>
          <div className="hero-overlay" aria-hidden="true" />

          <div className="hero-content reveal-ready">
            <p className="eyebrow">Experiencia boutique de marca personal</p>
            <h1 id="hero-title">Marca Visible</h1>
            <p className="hero-kicker">De invisible a Referente</p>
            <p className="hero-copy">
              Una mañana íntima, estratégica y cuidadosamente diseñada para transformar tu
              experiencia en una marca capaz de abrir nuevas oportunidades.
            </p>

            <div className="event-facts" aria-label="Datos principales del evento">
              <span>Sábado 18 de julio</span>
              <span>09:30 a 14:30 hrs</span>
              <span>Anahata Lodge · Puerto Varas</span>
            </div>

            <div className="hero-actions">
              <a className="button button-primary" href="#inversion">
                Reservar cupo Early Bird
              </a>
              <a className="button button-secondary" href="#experiencia">
                Ver la experiencia
              </a>
            </div>
          </div>
        </section>

        <section id="experiencia" className="problem-section section-pad" aria-labelledby="problem-title">
          <div className="section-inner problem-layout">
            <div className="section-heading-block">
              <p className="eyebrow dark">El punto de partida</p>
              <h2 id="problem-title">Tu marca puede estar diciendo menos de lo que realmente vales</h2>
              <p>
                Tienes experiencia, conocimiento y trayectoria. Pero tu marca necesita comunicarlo
                con más claridad, confianza y estrategia.
              </p>
            </div>

            <div className="signal-cards" aria-label="Situaciones que aborda Marca Visible">
              <article className="signal-card">
                <span>01</span>
                <p>Publicas, pero sin una dirección clara.</p>
              </article>
              <article className="signal-card">
                <span>02</span>
                <p>Te cuesta diferenciarte en un mercado cada vez más visible.</p>
              </article>
              <article className="signal-card">
                <span>03</span>
                <p>Sabes que tienes mucho que aportar, pero tu marca aún no lo refleja.</p>
              </article>
            </div>

            <p className="alignment-note">
              Marca Visible nace para alinear identidad, imagen, mentalidad, comunicación,
              estrategia y tecnología.
            </p>
          </div>
        </section>

        <section className="dimensions-section section-pad" aria-labelledby="dimensions-title">
          <div className="section-inner">
            <div className="section-heading-block centered">
              <p className="eyebrow dark">Lo que vivirás</p>
              <h2 id="dimensions-title">Una experiencia diseñada para activar tu marca desde tres dimensiones</h2>
            </div>

            <div className="dimension-cards">
              <article className="dimension-card">
                <div className="line-icon" aria-hidden="true">
                  <svg viewBox="0 0 48 48" role="presentation">
                    <path d="M24 7c7 0 12 5 12 12 0 8-6 13-12 22C18 32 12 27 12 19c0-7 5-12 12-12Z" />
                    <path d="M19 21c2.4 2.2 7.4 2.2 10 0" />
                  </svg>
                </div>
                <span className="dimension-number">01</span>
                <h3>SER</h3>
                <p>Claridad sobre quién eres y el valor que entregas.</p>
              </article>

              <article className="dimension-card featured">
                <div className="line-icon" aria-hidden="true">
                  <svg viewBox="0 0 48 48" role="presentation">
                    <path d="M9 36c7-16 16-24 30-24" />
                    <path d="M14 36h25" />
                    <path d="M31 12h8v8" />
                  </svg>
                </div>
                <span className="dimension-number">02</span>
                <h3>PROYECTAR</h3>
                <p>Una imagen que refleje la profesional que ya eres.</p>
              </article>

              <article className="dimension-card">
                <div className="line-icon" aria-hidden="true">
                  <svg viewBox="0 0 48 48" role="presentation">
                    <path d="M8 25h13" />
                    <path d="M27 25h13" />
                    <path d="M24 8v13" />
                    <path d="M24 27v13" />
                    <circle cx="24" cy="24" r="5" />
                  </svg>
                </div>
                <span className="dimension-number">03</span>
                <h3>POSICIONAR</h3>
                <p>Comunicación estratégica para generar oportunidades.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="relatores" className="speakers-section section-pad" aria-labelledby="speakers-title">
          <div className="section-inner">
            <div className="section-heading-block centered">
              <p className="eyebrow dark">El viaje Marca Visible</p>
              <h2 id="speakers-title">Relatores que acompañan cada etapa de tu marca</h2>
              <p>
                Cada relator representa una etapa clave para transformar tu experiencia en una marca
                visible, coherente y estratégica.
              </p>
            </div>

            <div className="speaker-grid">
              {speakers.map((speaker) => (
                <article className="speaker-card" key={speaker.id}>
                  <div className="speaker-content">
                    <span className="speaker-stage">{speaker.number}</span>
                    <h3>{speaker.name}</h3>
                    <p className="speaker-role">{speaker.role}</p>
                    <button
                      className="speaker-button"
                      type="button"
                      onClick={() => setSelectedSpeaker(speaker)}
                      aria-label={`${speaker.buttonLabel}: ${speaker.name}`}
                    >
                      {speaker.buttonLabel}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="ai-feature-section section-pad" aria-labelledby="ai-title">
          <div className="section-inner ai-feature-card">
            <div className="ai-copy">
              <p className="eyebrow ai-eyebrow">IA aplicada a marca personal, contenido y posicionamiento</p>
              <h2 id="ai-title">Tecnología con identidad: IA para potenciar tu marca sin perder tu voz</h2>
              <p className="ai-subtitle">
                Con Marco Iglesias, Master y Divulgador de Inteligencia Artificial
              </p>
              <p className="ai-description">
                Aprende a usar la Inteligencia Artificial para ordenar ideas, crear contenido con más
                eficiencia y amplificar tu visibilidad sin perder autenticidad.
              </p>
              <div className="ai-points">
                <span>Crea contenido con más foco.</span>
                <span>Ahorra tiempo sin perder calidad.</span>
                <span>Amplifica tu mensaje con estrategia.</span>
                <span>Usa IA sin perder tu voz.</span>
              </div>
            </div>

            <div className="ai-visual" aria-label="Marco Iglesias">
              <div className="ai-orbit" aria-hidden="true" />
              <img className="ai-photo" src="/assets/speakers/marco.png" alt="Marco Iglesias" />
              <p>Marco Iglesias</p>
            </div>
          </div>
        </section>

        {selectedSpeaker && (
          <div
            className="modal-backdrop"
            role="presentation"
            onClick={closeSpeakerModal}
          >
            <section
              className={selectedSpeaker.variant === 'ai' ? 'speaker-modal ai-modal' : 'speaker-modal'}
              role="dialog"
              aria-modal="true"
              aria-labelledby="speaker-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="modal-close"
                type="button"
                onClick={closeSpeakerModal}
                aria-label="Cerrar información del relator"
              >
                ×
              </button>
              <div className="modal-portrait">
                <img src={selectedSpeaker.image} alt={`Fotografía de ${selectedSpeaker.name}`} />
              </div>
              <div className="modal-copy">
                <p className="speaker-stage">Etapa {selectedSpeaker.number}</p>
                <h2 id="speaker-modal-title">{selectedSpeaker.talkTitle}</h2>
                <p className="modal-speaker-name">{selectedSpeaker.name} · {selectedSpeaker.role}</p>
                <p className="modal-description">{selectedSpeaker.description}</p>
                <h3>Te llevarás</h3>
                <ul>
                  {selectedSpeaker.takeaways.map((takeaway) => (
                    <li key={takeaway}>{takeaway}</li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        )}

        <section id="presencial" className="presence-section section-pad" aria-labelledby="presence-title">
          <div className="section-inner presence-layout">
            <div className="section-heading-block">
              <p className="eyebrow dark">Experiencia presencial</p>
              <h2 id="presence-title">Una experiencia boutique en un entorno diseñado para inspirarte</h2>
              <p>
                Marca Visible no es solo una jornada de charlas. Es una experiencia presencial
                para conectar, reflexionar, compartir y abrir nuevas oportunidades.
              </p>
            </div>

            <div className="experience-tags" aria-label="Elementos de la experiencia presencial">
              <span>Charlas breves de alto impacto</span>
              <span>Networking con propósito</span>
              <span>Coffee Boutique</span>
              <span>Experiencia sensorial</span>
              <span>Comunidad privada</span>
              <span>Kit digital post evento</span>
              <span>Fotografía profesional según ticket</span>
            </div>

            <div className="lodge-gallery" aria-label="Galería de Anahata Lodge">
              <figure className="gallery-card gallery-card-large">
                <img src="/assets/lodge/Imagen1.png" alt="Entorno natural de Anahata Lodge" />
                <figcaption>Naturaleza y pausa</figcaption>
              </figure>
              <figure className="gallery-card">
                <img src="/assets/lodge/Imagen2.png" alt="Espacio interior cálido del lugar" />
                <figcaption>Calidez para conversar</figcaption>
              </figure>
              <figure className="gallery-card">
                <img src="/assets/lodge/Imagen3.png" alt="Ambiente preparado para una experiencia boutique" />
                <figcaption>Un encuentro cuidado</figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section id="inversion" className="investment-section section-pad" aria-labelledby="investment-title">
          <div className="section-inner">
            <div className="section-heading-block centered">
              <p className="eyebrow dark">Inversión</p>
              <h2 id="investment-title">Elige tu experiencia</h2>
              <p>
                Valor de lanzamiento Early Bird disponible hasta el 10 de julio o hasta agotar cupos.
              </p>
            </div>

            <div className="ticket-grid">
              <article className="ticket-card">
                <div className="ticket-main">
                  <p className="ticket-label">Experiencia Esencia</p>
                  <h3>Early Bird: $35.000 CLP</h3>
                  <p className="ticket-cups">10 cupos Early Bird</p>
                  <ul className="ticket-benefits">
                    <li>Experiencias Marca Visible.</li>
                    <li>Networking con propósito.</li>
                    <li>Coffee Boutique.</li>
                    <li>Kit digital post evento.</li>
                    <li>Comunidad privada.</li>
                  </ul>
                  <details className="ticket-details">
                    <summary>Ver todo lo que incluye</summary>
                    <p>
                      Acceso a la jornada presencial, charlas de alto impacto, networking guiado,
                      material digital y comunidad privada para seguir aplicando lo aprendido.
                    </p>
                  </details>
                  <a
                    className="button ticket-button"
                    href="https://www.flow.cl/btn.php?token=ja543df080c6616fb55c37cf819a1fa1c0bc0994"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Pagar Experiencia Esencia en Flow"
                  >
                    Pagar Experiencia Esencia
                  </a>
                </div>
                <div className="qr-panel">
                  <img src="/assets/qr/esencia-early-bird.jpeg" alt="Código QR de pago Experiencia Esencia" />
                  <p>También puedes escanear el código QR para pagar desde tu celular.</p>
                </div>
              </article>

              <article className="ticket-card featured-ticket">
                <div className="ticket-main">
                  <p className="ticket-label">Experiencia Presencia & Expansión</p>
                  <h3>Early Bird: $70.000 CLP</h3>
                  <p className="ticket-cups">10 cupos Early Bird</p>
                  <ul className="ticket-benefits">
                    <li>Todo lo de Experiencia Esencia.</li>
                    <li>Workshop online de preparación visual.</li>
                    <li>Sesión fotográfica estratégica.</li>
                    <li>4 fotografías profesionales editadas.</li>
                    <li>Podcast Marca Visible.</li>
                    <li>Círculo de integración post evento.</li>
                  </ul>
                  <details className="ticket-details">
                    <summary>Ver todo lo que incluye</summary>
                    <p>
                      Una experiencia ampliada para potenciar tu presencia antes, durante y después
                      del evento, con preparación visual, fotografía profesional y espacios de integración.
                    </p>
                  </details>
                  <a
                    className="button ticket-button"
                    href="https://www.flow.cl/btn.php?token=oa0870c0ba1d4c48b8b7a33bf84506637fad7121"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Pagar Presencia y Expansión en Flow"
                  >
                    Pagar Presencia & Expansión
                  </a>
                </div>
                <div className="qr-panel">
                  <img src="/assets/qr/presencia-expansion-early-bird.jpeg" alt="Código QR de pago Presencia y Expansión" />
                  <p>También puedes escanear el código QR para pagar desde tu celular.</p>
                </div>
              </article>
            </div>

            <div className="general-price-note">
              <p>
                <strong>Valor General:</strong> Experiencia Esencia: $45.000 CLP · Experiencia Presencia & Expansión: $80.000 CLP
              </p>
              <p>
                Marca Visible es una experiencia boutique con cupos limitados, diseñada para asegurar
                cercanía, networking de calidad y una experiencia personalizada.
              </p>
            </div>
          </div>
        </section>

        <section className="urgency-section section-pad" aria-labelledby="urgency-title">
          <div className="section-inner urgency-card">
            <p className="eyebrow dark">Cupos limitados</p>
            <h2 id="urgency-title">Cupos limitados para una experiencia cercana y personalizada</h2>
            <p>El valor Early Bird estará disponible solo hasta el 10 de julio o hasta agotar cupos.</p>
            <a className="button button-primary urgency-button" href="#inversion">Reservar mi cupo</a>
          </div>
        </section>

        <section id="ubicacion" className="location-section section-pad" aria-labelledby="location-title">
          <div className="section-inner location-card">
            <div className="location-copy">
              <p className="eyebrow dark">Ubicación</p>
              <h2 id="location-title">Anahata Lodge · Puerto Varas</h2>
              <p>
                Un entorno natural, cálido y luminoso para inspirar conversación, conexión y nuevas oportunidades.
              </p>
              <address>Lomas Panorámicas 28, Puerto Varas, Chile</address>
              <a
                className="button location-button"
                href="https://www.google.com/maps/search/?api=1&query=Lomas%20Panor%C3%A1micas%2028%2C%20Puerto%20Varas%2C%20Chile"
                target="_blank"
                rel="noreferrer"
                aria-label="Abrir ubicación de Anahata Lodge en Google Maps"
              >
                Cómo llegar
              </a>
            </div>
            <figure className="location-image">
              <img src="/assets/lodge/Imagen3.png" alt="Vista exterior de Anahata Lodge en Puerto Varas" />
            </figure>
          </div>
        </section>

        <section className="final-cta-section section-pad" aria-labelledby="final-title">
          <div className="section-inner final-cta-card">
            <h2 id="final-title">Es momento de hacer visible el valor que ya existe en ti</h2>
            <p>
              Reserva tu lugar y comienza a construir una marca que inspire confianza, genere oportunidades y deje huella.
            </p>
            <div className="final-actions">
              <a className="button button-primary" href="#inversion">Reservar Experiencia Esencia</a>
              <a className="button button-secondary light" href="#inversion">Reservar Presencia & Expansión</a>
            </div>
          </div>
        </section>
      </main>

      <a className="back-to-top" href="#inicio" aria-label="Volver al inicio">
        ↑
      </a>

      <footer className="site-footer">
        <div className="footer-main">
          <a className="footer-brand" href="#inicio">Marca Visible · De invisible a Referente</a>
          <p>Sábado 18 de julio · 09:30 a 14:30 hrs</p>
          <p>Anahata Lodge · Puerto Varas</p>
        </div>
        <nav className="footer-links" aria-label="Navegación inferior">
          <a href="#inicio">Inicio</a>
          <a href="#experiencia">Experiencia</a>
          <a href="#relatores">Relatores</a>
          <a href="#inversion">Inversión</a>
          <a href="#ubicacion">Ubicación</a>
        </nav>
        <p className="footer-credit">Creado por Marco Iglesias by SurInnovacion · Todos los derechos reservados</p>
      </footer>
    </div>
  )
}

export default App
