import { useEffect, useState } from 'react'
import { ui, projects, skills, experience, education, GITHUB, EMAIL, LINKEDIN, CV_VERSION } from './content.js'
import ChatWidget from './ChatWidget.jsx'
import { Cover, Diagram } from './Art.jsx'

const useHash = () => {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => { const f = () => { setHash(window.location.hash); window.scrollTo(0, 0) }; window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f) }, [])
  return hash
}

const smooth = () => (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth')
function goSection(e, id) {
  e?.preventDefault()
  const scroll = () => (id === 'top' ? window.scrollTo({ top: 0, behavior: smooth() }) : document.getElementById(id)?.scrollIntoView({ behavior: smooth() }))
  if (window.location.hash.startsWith('#/projects/')) { window.location.hash = '#/'; setTimeout(scroll, 60) } else scroll()
}
const linkName = (n, lang) => (typeof n === 'object' ? n[lang] : n)

const initialTheme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

const Icon = {
  sun: <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>,
  moon: <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>,
  linkedin: <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V21H9z" /></svg>,
  github: <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5z" /></svg>,
}

export default function App() {
  const [lang, setLang] = useState(() => (['en', 'es'].includes(localStorage.getItem('lang')) ? localStorage.getItem('lang') : 'en'))
  const [theme, setTheme] = useState(initialTheme)
  const [chatOpen, setChatOpen] = useState(false)
  const [seed, setSeed] = useState(null)
  const askChat = q => { setChatOpen(true); setSeed(s => ({ q, n: (s?.n || 0) + 1 })) }
  useEffect(() => { try { localStorage.setItem('lang', lang) } catch {} document.documentElement.lang = lang }, [lang])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('theme', theme) } catch {}
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0b0b0e' : '#fafafa')
  }, [theme])
  useEffect(() => { const f = e => ['light', 'dark'].includes(e.detail) && setTheme(e.detail); window.addEventListener('ui:set-theme', f); return () => window.removeEventListener('ui:set-theme', f) }, [])
  const t = ui[lang]
  const hash = useHash()
  const m = hash.match(/^#\/projects\/([\w-]+)/)
  const project = m && projects.find(p => p.slug === m[1])
  const cv = `cv/Lian_Yang_CV_${lang.toUpperCase()}.pdf?v=${CV_VERSION}`
  const dark = theme === 'dark'

  return (
    <>
      <a className="skip" href="#main">{lang === 'en' ? 'Skip to content' : 'Saltar al contenido'}</a>
      <header className="nav">
        <a href="#/" className="brand" aria-label="Home" data-ui="home" onClick={e => goSection(e, 'top')}>LY<span>.</span></a>
        <nav aria-label={lang === 'en' ? 'Main' : 'Principal'}>
          <a href="#projects" data-ui="nav-projects" onClick={e => goSection(e, 'projects')}>{t.nav.projects}</a>
          <a href="#experience" data-ui="nav-experience" onClick={e => goSection(e, 'experience')}>{t.nav.experience}</a>
          <a href="#contact" data-ui="nav-contact" onClick={e => goSection(e, 'contact')}>{t.nav.contact}</a>
          <a className="icon-btn" href={LINKEDIN} target="_blank" rel="noreferrer" aria-label="LinkedIn">{Icon.linkedin}</a>
          <a className="icon-btn" href={GITHUB} target="_blank" rel="noreferrer" aria-label="GitHub">{Icon.github}</a>
          <a className="btn small" href={cv} download data-ui="cv">{t.nav.cv}</a>
          <button className="icon-btn" data-ui="theme-toggle" onClick={() => setTheme(dark ? 'light' : 'dark')} aria-label={dark ? t.nav.themeLight : t.nav.themeDark} title={dark ? t.nav.themeLight : t.nav.themeDark}>{dark ? Icon.sun : Icon.moon}</button>
          <button className="lang" data-ui="lang-toggle" onClick={() => setLang(lang === 'en' ? 'es' : 'en')} aria-label={lang === 'en' ? 'Ver en español' : 'View in English'} lang={lang === 'en' ? 'es' : 'en'}>{lang === 'en' ? 'ES' : 'EN'}</button>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>{project ? <ProjectPage p={project} lang={lang} t={t} onChat={() => setChatOpen(true)} /> : <Home lang={lang} t={t} cv={cv} onAsk={askChat} />}</main>
      <footer><span>© 2026 Lian Yang</span><span>{t.footer}</span></footer>
      <ChatWidget lang={lang} t={t} open={chatOpen} setOpen={setChatOpen} seed={seed} />
    </>
  )
}

function Thumb({ p, lang }) {
  const [failed, setFailed] = useState(false)
  if (p.image && !failed) return <img src={p.image} alt={p.imageAlt?.[lang] || ''} loading="lazy" style={p.imagePosition ? { objectPosition: p.imagePosition } : undefined} onError={() => setFailed(true)} />
  return <Cover kind={p.cover} title={p.name} />
}

function HeroAsk({ t, onAsk }) {
  const [q, setQ] = useState('')
  const a = t.ask
  const send = e => { e.preventDefault(); const v = q.trim(); if (v.length < 2) return; setQ(''); onAsk(v) }
  return (
    <aside className="hero-ask" aria-label={a.title}>
      <p className="ask-title"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>{a.title}</p>
      <p className="ask-sub">{a.sub}</p>
      <div className="ask-prompts">{a.prompts.map(([s, cmd]) => <button key={s} type="button" className={cmd ? 'cmd' : undefined} onClick={() => onAsk(s)}>{s}</button>)}</div>
      <form className="ask-form" onSubmit={send}>
        <input aria-label={a.placeholder} value={q} onChange={e => setQ(e.target.value)} placeholder={a.placeholder} maxLength={300} />
        <button className="btn small">{a.send}</button>
      </form>
    </aside>
  )
}

function ProjectCard({ p, lang, t, minor }) {
  return (
    <a className={minor ? 'card minor' : 'card'} href={`#/projects/${p.slug}`} style={{ '--accent': p.accent }} data-ui={`project-${p.slug}`}>
      <div className="thumb"><Thumb p={p} lang={lang} /></div>
      <div className="card-body">
        <h3>{p.icon && <img className="app-icon" src={p.icon} alt="" width="28" height="28" />}{p.name}</h3><p>{p[lang].tagline}</p>{!minor && <p className="metric">{p[lang].metric}</p>}
        <div className="tags">{p.tags.map(x => <span key={x}>{x}</span>)}</div>
        <span className="more">{t.readMore}</span>
      </div>
    </a>
  )
}

function Home({ lang, t, cv, onAsk }) {
  const main = projects.filter(p => !p.minor)
  const other = projects.filter(p => p.minor)
  return (
    <>
      <section className="hero" id="top" data-ui="section-top">
        <div className="hero-text">
          <h1>Lian Yang</h1>
          <p className="role">{t.role}<span>{t.roleSub}</span></p>
          <p className="lead">{t.hero}</p>
          <div className="cta">
            <a className="btn" href="#projects" onClick={e => goSection(e, 'projects')}>{t.ctaProjects}</a>
            <a className="btn ghost" href="#contact" onClick={e => goSection(e, 'contact')}>{t.ctaContact}</a>
          </div>
          <div className="chips">{['Python', 'FastAPI', 'LangGraph', 'RAG', 'React', 'PostgreSQL', 'Docker', 'Kotlin'].map(s => <span key={s}>{s}</span>)}</div>
        </div>
        <HeroAsk t={t} onAsk={onAsk} />
      </section>

      <section id="projects"><h2>{t.projectsTitle}</h2>
        <div className="cards">{main.map(p => <ProjectCard key={p.slug} p={p} lang={lang} t={t} />)}</div>
        {other.length > 0 && <><h3 className="other-title">{t.otherProjects}</h3>
          <div className="cards minor">{other.map(p => <ProjectCard key={p.slug} p={p} lang={lang} t={t} minor />)}</div></>}
      </section>

      <section className="grid2">
        <div id="about"><h2>{t.aboutTitle}</h2><p>{t.about}</p></div>
        <div id="skills"><h2>{t.skillsTitle}</h2>
          <ul className="skills">{skills.map(([k, v]) => <li key={k}><b>{k}</b><span>{v}</span></li>)}</ul></div>
      </section>

      <section className="grid2">
        <div id="experience"><h2>{t.expTitle}</h2>
          <ul className="timeline">{experience[lang].map(([r, d, x]) => <li key={r}><div className="row"><b>{r}</b>{d && <em>{d}</em>}</div><p>{x}</p></li>)}</ul></div>
        <div id="education"><h2>{t.eduTitle}</h2><ul className="timeline">{education[lang].map(e => <li key={e}><p>{e}</p></li>)}</ul></div>
      </section>

      <section id="contact" className="contact">
        <h2>{t.contactTitle}</h2><p>{t.contactText}</p>
        <div className="cta">
          <a className="btn" href={`mailto:${EMAIL}`}>{EMAIL}</a>
          <a className="btn ghost" href={LINKEDIN} target="_blank" rel="noreferrer">{Icon.linkedin} LinkedIn</a>
          <a className="btn ghost" href={GITHUB} target="_blank" rel="noreferrer">{Icon.github} GitHub</a>
          <a className="btn ghost" href={cv} download>{t.nav.cv} (PDF)</a>
        </div>
      </section>
    </>
  )
}

// Hero media: video, else image, else the drawn cover. Missing files are skipped silently.
function HeroMedia({ p, lang }) {
  const [stage, setStage] = useState(p.video ? 'video' : p.image ? 'image' : 'cover')
  if (stage === 'video') return <video className={p.videoShape === 'phone' ? 'hero-img hero-phone' : 'hero-img'} src={p.video} poster={p.poster || p.image} aria-label={p.videoAlt?.[lang]} muted loop autoPlay={!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches} playsInline controls preload="metadata" onError={() => setStage(p.image ? 'image' : 'cover')} />
  if (stage === 'image') return <img className="hero-img" src={p.image} alt={p.imageAlt?.[lang] || p.name} onError={() => setStage('cover')} />
  return p.cover && !p.diagram ? <div className="hero-img hero-cover"><Cover kind={p.cover} title={p.name} /></div> : null
}

// Screenshots / audio that only appear once the file actually loads (so missing media leaves no gap).
function Gallery({ items, lang, title }) {
  const [ok, setOk] = useState({})
  const any = Object.values(ok).some(Boolean)
  return (
    <div className={any ? 'media-block' : 'media-block pending'}>
      {any && <h2>{title}</h2>}
      <div className="gallery">{items.map(([src, alt]) => (
        <figure key={src} hidden={!ok[src]}>
          <img src={src} alt={alt[lang]} onLoad={() => setOk(o => ({ ...o, [src]: true }))} onError={() => setOk(o => ({ ...o, [src]: false }))} />
          <figcaption>{alt[lang]}</figcaption>
        </figure>))}
      </div>
    </div>
  )
}

function AudioList({ items, lang, title }) {
  const [ok, setOk] = useState({})
  const any = Object.values(ok).some(Boolean)
  return (
    <div className={any ? 'media-block' : 'media-block pending'}>
      {any && <h2>{title}</h2>}
      {items.map(([src, label]) => (
        <div key={src} className="audio-row" hidden={!ok[src]}>
          <span>{label[lang]}</span>
          <audio controls preload="metadata" src={src} onLoadedMetadata={() => setOk(o => ({ ...o, [src]: true }))} onError={() => setOk(o => ({ ...o, [src]: false }))} />
        </div>))}
    </div>
  )
}

function ProjectPage({ p, lang, t, onChat }) {
  const c = p[lang]
  return (
    <article className="project" style={{ '--accent': p.accent }}>
      <a href="#/" className="back">{t.back}</a>
      <h1>{p.icon && <img className="app-icon" src={p.icon} alt="" width="44" height="44" />}{p.name}</h1><p className="lead">{c.tagline}</p>
      <dl className="facts"><div><dt>{t.context}</dt><dd>{c.context}</dd></div><div><dt>{t.stackL}</dt><dd>{p.tags.join(' · ')}</dd></div></dl>
      {(p.chatCta || p.links.length > 0) && <div className="cta">{p.chatCta && <button className="btn" onClick={onChat}>{t.tryIt}</button>}{p.links.map(([n, u], i) => <a key={u} className={`btn${p.chatCta || i ? ' ghost' : ''}`} href={u} target="_blank" rel="noreferrer">{linkName(n, lang)}</a>)}</div>}
      <HeroMedia key={p.slug} p={p} lang={lang} />
      {p.audio && <AudioList key={`a-${p.slug}`} items={p.audio} lang={lang} title={t.listen} />}
      <h2>{t.problem}</h2><p className="problem">{c.problem}</p>
      <h2>{t.how}</h2><ol>{c.how.map(h => <li key={h}>{h}</li>)}</ol>
      {p.diagram && <><h2>{t.architecture}</h2><Diagram lang={lang} /></>}
      {p.gallery && <Gallery key={`g-${p.slug}`} items={p.gallery} lang={lang} title={t.screenshots} />}
      <h2>{t.decisions}</h2><ul>{c.decisions.map(h => <li key={h}>{h}</li>)}</ul>
      <div className="grid2">
        <div><h2>{t.results}</h2><ul className="checks">{c.results.map(h => <li key={h}>{h}</li>)}</ul></div>
        {c.limits && <div><h2>{t.limits}</h2><ul>{c.limits.map(h => <li key={h}>{h}</li>)}</ul></div>}
      </div>
      {c.evaluation && <section className="evaluation">
        <h2>{c.evaluation.title}</h2><p className="eval-meta">{c.evaluation.meta}</p>
        {c.evaluation.tables.map(tb => <div className="table-wrap" key={tb.caption}><table className="eval-table">
          <caption>{tb.caption}</caption>
          <thead><tr>{tb.head.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead>
          <tbody>{tb.rows.map(r => <tr key={r[0]}>{r.map((v, i) => i ? <td key={i}>{v}</td> : <th key={i} scope="row">{v}</th>)}</tr>)}</tbody>
        </table></div>)}
        <ul>{c.evaluation.notes.map(n => <li key={n}>{n}</li>)}</ul>
      </section>}
    </article>
  )
}
