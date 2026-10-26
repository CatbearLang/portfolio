import { useEffect, useState } from 'react'
import { ui, projects, skills, experience, education, GITHUB, EMAIL } from './content.js'
import ChatWidget from './ChatWidget.jsx'

const useHash = () => {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => { const f = () => { setHash(window.location.hash); window.scrollTo(0, 0) }; window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f) }, [])
  return hash
}

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || (navigator.language.startsWith('es') ? 'es' : 'en'))
  const [chatOpen, setChatOpen] = useState(false)
  useEffect(() => { localStorage.setItem('lang', lang); document.documentElement.lang = lang }, [lang])
  const t = ui[lang]
  const hash = useHash()
  const m = hash.match(/^#\/projects\/([\w-]+)/)
  const project = m && projects.find(p => p.slug === m[1])
  const cv = `cv/Lian_Yang_CV_${lang.toUpperCase()}.pdf`

  return (
    <>
      <header className="nav">
        <a href="#/" className="brand" aria-label="Home">L<span>Y</span></a>
        <nav>
          <a href="#/" onClick={() => setTimeout(() => document.getElementById('projects')?.scrollIntoView(), 0)}>{t.nav.projects}</a>
          <a href="#/" onClick={() => setTimeout(() => document.getElementById('experience')?.scrollIntoView(), 0)}>{t.nav.experience}</a>
          <a href="#/" onClick={() => setTimeout(() => document.getElementById('contact')?.scrollIntoView(), 0)}>{t.nav.contact}</a>
          <a className="btn small" href={cv} download>{t.nav.cv}</a>
          <button className="lang" onClick={() => setLang(lang === 'en' ? 'es' : 'en')} aria-label="Toggle language">{lang === 'en' ? 'ES' : 'EN'}</button>
        </nav>
      </header>
      <main>{project ? <ProjectPage p={project} lang={lang} t={t} /> : <Home lang={lang} t={t} onChat={() => setChatOpen(true)} />}</main>
      <footer><span>© 2026 Lian Yang</span><span>{t.footer}</span></footer>
      <ChatWidget lang={lang} t={t.chat} open={chatOpen} setOpen={setChatOpen} />
    </>
  )
}

function Home({ lang, t, onChat }) {
  return (
    <>
      <section className="hero">
        <div className="glow" />
        <p className="eyebrow">{t.role}</p>
        <h1>Lian Yang</h1>
        <p className="lead">{t.hero}</p>
        <div className="cta">
          <a className="btn" href="#/" onClick={() => setTimeout(() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' }), 0)}>{t.ctaProjects}</a>
          <button className="btn ghost" onClick={onChat}>✨ {t.ctaChat}</button>
        </div>
        <div className="chips">{['React', 'PostgreSQL', 'Python', 'FastAPI', 'LangGraph', 'Docker', 'Kubernetes', 'n8n'].map(s => <span key={s}>{s}</span>)}</div>
      </section>

      <section id="projects"><h2>{t.projectsTitle}</h2>
        <div className="cards">{projects.map(p => (
          <a key={p.slug} className="card" href={`#/projects/${p.slug}`} style={{ '--accent': p.accent }}>
            <div className="thumb">{p.image ? <img src={p.image} alt="" loading="lazy" /> : <div className="thumb-fallback">{p.name}</div>}</div>
            <div className="card-body">
              <h3>{p.name}</h3><p>{p[lang].tagline}</p><p className="metric">✓ {p[lang].highlights[1]}</p>
              <div className="tags">{p.tags.map(x => <span key={x}>{x}</span>)}</div>
              <span className="more">{t.readMore}</span>
            </div>
          </a>))}
        </div>
      </section>

      <section className="grid2">
        <div><h2>{t.aboutTitle}</h2><p>{t.about}</p></div>
        <div><h2>{t.skillsTitle}</h2>
          <ul className="skills">{skills.map(([k, v]) => <li key={k}><b>{k}</b><span>{v}</span></li>)}</ul></div>
      </section>

      <section id="experience" className="grid2">
        <div><h2>{t.expTitle}</h2>
          <ul className="timeline">{experience[lang].map(([r, d, x]) => <li key={r}><div className="row"><b>{r}</b>{d && <em>{d}</em>}</div><p>{x}</p></li>)}</ul></div>
        <div><h2>{t.eduTitle}</h2><ul className="timeline">{education[lang].map(e => <li key={e}><p>{e}</p></li>)}</ul></div>
      </section>

      <section id="contact" className="contact">
        <h2>{t.contactTitle}</h2><p>{t.contactText}</p>
        <div className="cta"><a className="btn" href={`mailto:${EMAIL}`}>{EMAIL}</a><a className="btn ghost" href={GITHUB} target="_blank" rel="noreferrer">GitHub · CatbearLang</a></div>
      </section>
    </>
  )
}

function ProjectPage({ p, lang, t }) {
  const c = p[lang]
  return (
    <article className="project" style={{ '--accent': p.accent }}>
      <a href="#/" className="back">{t.back}</a>
      <h1>{p.name}</h1><p className="lead">{c.tagline}</p>
      <dl className="facts"><div><dt>{t.context}</dt><dd>{c.context}</dd></div><div><dt>{t.stackL}</dt><dd>{p.tags.join(' · ')}</dd></div></dl>
      {p.video ? <video className="hero-img" src={p.video} poster={p.image} muted loop autoPlay playsInline controls preload="metadata" /> : p.image && <img className="hero-img" src={p.image} alt={p.name} />}
      <div className="grid2">
        <div><h2>{t.highlights}</h2><ul className="checks">{c.highlights.map(h => <li key={h}>{h}</li>)}</ul></div>
        <div><h2>{t.how}</h2><ol>{c.how.map(h => <li key={h}>{h}</li>)}</ol></div>
      </div>
      <h2>{t.built}</h2><ul>{c.built.map(h => <li key={h}>{h}</li>)}</ul>
      {p.gallery && <div className="gallery">{p.gallery.slice(1).map(g => <img key={g} src={g} alt="" loading="lazy" />)}</div>}
      {p.links.length === 0 && <p className="muted">{t.noRepo}</p>}
      {p.links.length > 0 && <><h2>{t.links}</h2><div className="cta">{p.links.map(([n, u]) => <a key={u} className="btn" href={u} target="_blank" rel="noreferrer">{n}</a>)}</div></>}
    </article>
  )
}
