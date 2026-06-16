import { Link } from 'react-router-dom'
import './Landing.css'

const FEATURES = [
  {
    icon: '✓',
    title: 'Tareas del hogar',
    desc: 'Asigna tareas a cada compañero, marca frecuencias y lleva el control de quién hace qué sin discusiones.'
  },
  {
    icon: '€',
    title: 'Gastos compartidos',
    desc: 'Registra cualquier gasto, divide automáticamente entre los que participan y salda deudas al instante.'
  },
  {
    icon: '💬',
    title: 'Chat del piso',
    desc: 'Un único canal para todos. Sin grupos de WhatsApp descontrolados, sin mensajes perdidos.'
  },
  {
    icon: '📅',
    title: 'Calendario común',
    desc: 'Visitas, fiestas, ausencias — todo visible para todos. Nadie se pilla por sorpresa.'
  },
]

const PLANES = [
  {
    nombre: 'Gratis',
    precio: '0€',
    periodo: 'para siempre',
    color: 'plan-free',
    features: ['1 piso, hasta 4 compañeros', 'Tareas y calendario', 'Chat del piso', 'Gastos básicos'],
    cta: 'Empezar gratis',
    link: '/registro',
    destacado: false,
  },
  {
    nombre: 'Premium',
    precio: '3€',
    periodo: 'por persona/mes',
    color: 'plan-pro',
    features: ['Pisos y compañeros ilimitados', 'Notificaciones por email', 'Historial completo', 'Resumen económico en PDF', 'Soporte prioritario'],
    cta: 'Empezar prueba gratis',
    link: '/registro',
    destacado: true,
  },
]

const TESTIMONIOS = [
  { nombre: 'Sara M.', piso: 'Piso en Valencia', texto: 'Antes siempre había drama con quién debía qué. Ahora todo está ahí, transparente.' },
  { nombre: 'Dani R.', piso: 'Piso en Madrid', texto: 'Lo mejor es el chat integrado. Dejamos de usar 3 grupos de WhatsApp distintos.' },
  { nombre: 'Laura P.', piso: 'Piso en Barcelona', texto: 'El reparto automático de gastos me ha salvado la vida. Literalmente.' },
]

export default function Landing() {
  return (
    <div className="landing">
      {/* NAV */}
      <nav className="l-nav">
        <div className="l-nav-inner">
          <span className="l-logo">RoomieUs</span>
          <div className="l-nav-links">
            <a href="#funciones">Funciones</a>
            <a href="#precios">Precios</a>
            <Link to="/login" className="l-nav-login">Iniciar sesión</Link>
            <Link to="/registro" className="l-btn l-btn-primary l-btn-sm">Empezar gratis</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="l-hero">
        <div className="l-hero-eyebrow">Para estudiantes universitarios</div>
        <h1 className="l-hero-title">
          Vivir con compañeros<br />
          <span className="l-hero-accent">sin dramas</span>
        </h1>
        <p className="l-hero-sub">
          Gestiona tareas, gastos y comunicación de tu piso compartido en un solo lugar.
          Sin excusas, sin malentendidos, sin deudas olvidadas.
        </p>
        <div className="l-hero-actions">
          <Link to="/registro" className="l-btn l-btn-primary l-btn-lg">Crear mi piso gratis</Link>
          <Link to="/login" className="l-btn l-btn-ghost l-btn-lg">Ya tengo cuenta</Link>
        </div>
        <div className="l-hero-social-proof">
          <div className="l-avatars">
            {['A','B','C','D'].map(l => <div key={l} className="l-avatar-sm">{l}</div>)}
          </div>
          <span>Únete a cientos de pisos que ya usan RoomieUs</span>
        </div>

        {/* App preview */}
        <div className="l-preview">
          <div className="l-preview-bar">
            <span className="l-dot" style={{background:'#FF5F57'}}/>
            <span className="l-dot" style={{background:'#FFBD2E'}}/>
            <span className="l-dot" style={{background:'#28CA41'}}/>
            <span className="l-preview-url">roomieusma.vercel.app</span>
          </div>
          <div className="l-preview-body">
            <div className="l-preview-sidebar">
              <div className="l-preview-logo">RoomieUs</div>
              {['Inicio','Tareas','Gastos','Chat','Calendario'].map(n => (
                <div key={n} className={`l-preview-nav ${n==='Tareas'?'active':''}`}>{n}</div>
              ))}
            </div>
            <div className="l-preview-main">
              <div className="l-preview-title">Tareas del hogar</div>
              <div className="l-preview-metrics">
                <div className="l-preview-metric"><div className="l-pm-val purple">5</div><div className="l-pm-label">Total</div></div>
                <div className="l-preview-metric"><div className="l-pm-val teal">3</div><div className="l-pm-label">Hechas</div></div>
                <div className="l-preview-metric"><div className="l-pm-val coral">2</div><div className="l-pm-label">Pendientes</div></div>
              </div>
              {[
                {n:'Limpiar la cocina',u:'Sara',done:true},
                {n:'Sacar la basura',u:'Dani',done:false},
                {n:'Limpiar el baño',u:'Laura',done:false},
              ].map(t => (
                <div key={t.n} className="l-preview-task">
                  <div className={`l-preview-check ${t.done?'done':''}`}>{t.done?'✓':''}</div>
                  <div className="l-preview-task-info">
                    <div style={{fontSize:11,textDecoration:t.done?'line-through':'none',opacity:t.done?0.5:1}}>{t.n}</div>
                    <div style={{fontSize:9,opacity:0.5}}>{t.u} · Semanal</div>
                  </div>
                  <div className={`l-preview-badge ${t.done?'done':'pend'}`}>{t.done?'Hecha':'Pendiente'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="l-problem">
        <div className="l-container">
          <div className="l-problem-grid">
            <div className="l-problem-side bad">
              <div className="l-problem-label">❌ Sin RoomieUs</div>
              <ul>
                <li>Grupos de WhatsApp con 300 mensajes sin leer</li>
                <li>"Oye, ¿me debes 12€ del Mercadona del martes?"</li>
                <li>Nadie sabe a quién le toca limpiar el baño</li>
                <li>Conflictos por visitas sin avisar</li>
                <li>Excel de gastos desactualizado en el Google Drive</li>
              </ul>
            </div>
            <div className="l-problem-side good">
              <div className="l-problem-label">✅ Con RoomieUs</div>
              <ul>
                <li>Un chat limpio para lo importante del piso</li>
                <li>Los gastos se dividen solos, al céntimo</li>
                <li>Rotación de tareas automática y transparente</li>
                <li>Calendario compartido, sin sorpresas</li>
                <li>Todo en un sitio, desde el móvil</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="l-features" id="funciones">
        <div className="l-container">
          <div className="l-section-eyebrow">Funcionalidades</div>
          <h2 className="l-section-title">Todo lo que necesita tu piso</h2>
          <div className="l-features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="l-feature-card">
                <div className="l-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="l-testimonios">
        <div className="l-container">
          <h2 className="l-section-title">Lo que dicen los pisos</h2>
          <div className="l-testimonios-grid">
            {TESTIMONIOS.map(t => (
              <div key={t.nombre} className="l-testimonio">
                <p className="l-testimonio-text">"{t.texto}"</p>
                <div className="l-testimonio-autor">
                  <div className="l-avatar-med">{t.nombre[0]}</div>
                  <div>
                    <div className="l-testimonio-nombre">{t.nombre}</div>
                    <div className="l-testimonio-piso">{t.piso}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section className="l-precios" id="precios">
        <div className="l-container">
          <div className="l-section-eyebrow">Precios</div>
          <h2 className="l-section-title">Simple y transparente</h2>
          <div className="l-planes-grid">
            {PLANES.map(p => (
              <div key={p.nombre} className={`l-plan ${p.destacado ? 'l-plan-destacado' : ''}`}>
                {p.destacado && <div className="l-plan-tag">Más popular</div>}
                <div className="l-plan-nombre">{p.nombre}</div>
                <div className="l-plan-precio">
                  <span className="l-plan-num">{p.precio}</span>
                  <span className="l-plan-periodo">{p.periodo}</span>
                </div>
                <ul className="l-plan-features">
                  {p.features.map(f => <li key={f}><span>✓</span>{f}</li>)}
                </ul>
                <Link to={p.link} className={`l-btn l-btn-lg ${p.destacado ? 'l-btn-primary' : 'l-btn-outline'}`} style={{width:'100%',textAlign:'center',justifyContent:'center'}}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="l-cta-final">
        <div className="l-container" style={{textAlign:'center'}}>
          <h2 className="l-cta-title">Tu piso lo estaba esperando</h2>
          <p className="l-cta-sub">Gratis para siempre para pisos de hasta 4 personas. Sin tarjeta de crédito.</p>
          <Link to="/registro" className="l-btn l-btn-primary l-btn-xl">Crear mi piso ahora</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="l-footer">
        <div className="l-container">
          <div className="l-footer-inner">
            <span className="l-logo">RoomieUs</span>
            <div className="l-footer-links">
              <a href="#funciones">Funciones</a>
              <a href="#precios">Precios</a>
              <Link to="/login">Iniciar sesión</Link>
            </div>
            <span className="l-footer-copy">© 2026 RoomieUs</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
