// Runs whitelisted page actions visibly: a cursor travels to the real control, highlights it and clicks it,
// so the visitor sees the assistant use the page the same way they would. Only these action types exist.
import { PROJECTS, SECTIONS } from './intents.js'
import { projects, CV_VERSION } from './content.js'

const sleep = ms => new Promise(r => setTimeout(r, ms))
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const $ = sel => document.querySelector(sel)
const visible = el => el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden'

let cursor = null
function getCursor() {
  if (cursor && document.body.contains(cursor)) return cursor
  cursor = document.createElement('div')
  cursor.className = 'ui-cursor'
  cursor.setAttribute('aria-hidden', 'true')
  cursor.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M4 2l15 9.5-6.6 1.4 3.9 7.3-2.9 1.5-3.9-7.3L4 19z" fill="currentColor" stroke="var(--panel)" stroke-width="1.5" stroke-linejoin="round"/></svg><span class="ui-ripple"></span>'
  document.body.appendChild(cursor)
  return cursor
}

function place(x, y) { getCursor().style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)` }

async function moveTo(el) {
  const fast = reduced()
  const r0 = el.getBoundingClientRect()
  if (r0.top < 70 || r0.bottom > window.innerHeight - 20) {
    el.scrollIntoView({ block: 'center', behavior: fast ? 'auto' : 'smooth' })
    await sleep(fast ? 50 : 550)
  }
  const r = el.getBoundingClientRect()
  place(r.left + Math.min(r.width / 2, 40), r.top + r.height / 2)
  await sleep(fast ? 0 : 700)
}

async function press(el, click = true) {
  const c = getCursor()
  el.classList.add('ui-target')
  c.classList.add('press')
  await sleep(reduced() ? 0 : 220)
  if (click) el.click()
  c.classList.remove('press')
  setTimeout(() => el.classList.remove('ui-target'), 1200)
  await sleep(reduced() ? 0 : 350)
}

async function show(el, click = true) {
  if (!visible(el)) return false
  await moveTo(el)
  await press(el, click)
  return true
}

async function goHome() {
  if (!/^#\/projects\//.test(window.location.hash)) return
  const home = $('[data-ui="home"]')
  if (home) await show(home)
  else window.location.hash = '#/'
  await sleep(150)
}

function fill(s, x) { return s.replace('{x}', x) }

// actions: [{ type, value }] already validated by the server or by the in-browser parser.
export async function runActions(actions, t) {
  const c = getCursor()
  const start = document.querySelector('.chat')?.getBoundingClientRect() || { left: window.innerWidth - 60, top: window.innerHeight - 60, width: 0, height: 0 }
  c.classList.add('instant'); place(start.left + 24, start.top + 24)
  await sleep(30); c.classList.remove('instant'); c.classList.add('on')
  const said = []
  try {
    for (const a of actions.slice(0, 3)) said.push(await runOne(a, t))
  } finally {
    await sleep(reduced() ? 0 : 400)
    c.classList.remove('on')
  }
  return said.filter(Boolean).join(' ')
}

async function runOne({ type, value }, t) {
  const root = document.documentElement
  if (type === 'set_theme') {
    const now = root.dataset.theme === 'dark' ? 'dark' : 'light'
    const want = value === 'toggle' ? (now === 'dark' ? 'light' : 'dark') : value
    if (!['light', 'dark'].includes(want)) return ''
    const btn = $('[data-ui="theme-toggle"]')
    if (want === now) { if (btn) await show(btn, false); return want === 'dark' ? t.done.alreadyDark : t.done.alreadyLight }
    if (!(btn && await show(btn))) window.dispatchEvent(new CustomEvent('ui:set-theme', { detail: want }))
    return t.done[want]
  }
  if (type === 'set_language') {
    if (!['en', 'es'].includes(value)) return ''
    const btn = $('[data-ui="lang-toggle"]')
    if ((root.lang || 'en') === value) { if (btn) await show(btn, false); return t.done.alreadyLang }
    if (btn) await show(btn)
    return t.done[value]
  }
  if (type === 'go_to_section') {
    if (!SECTIONS.includes(value)) return ''
    await goHome()
    await sleep(60)
    const link = $(`[data-ui="nav-${value}"]`)
    if (!(link && await show(link))) {
      const sec = value === 'top' ? $('[data-ui="section-top"]') : document.getElementById(value)
      if (sec) {
        sec.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' })
        await sleep(reduced() ? 0 : 500)
        const h = sec.querySelector('h1, h2') || sec
        await show(h, false)
      }
    }
    return fill(t.done.section, t.sectionNames[value])
  }
  if (type === 'open_project') {
    if (!PROJECTS.includes(value)) return ''
    await goHome()
    await sleep(80)
    const card = $(`[data-ui="project-${value}"]`)
    if (card) await show(card)
    else window.location.hash = `#/projects/${value}`
    return fill(t.done.project, projects.find(p => p.slug === value)?.name || value)
  }
  if (type === 'download_cv') {
    if (!['en', 'es'].includes(value)) return ''
    const btn = $('[data-ui="cv"]')
    const pageLang = root.lang || 'en'
    if (btn && value === pageLang) await show(btn)
    else {
      if (btn) await show(btn, false)
      const a = document.createElement('a')
      a.href = `cv/Lian_Yang_CV_${value.toUpperCase()}.pdf?v=${CV_VERSION}`; a.download = ''
      document.body.appendChild(a); a.click(); a.remove()
    }
    return fill(t.done.cv, value === 'en' ? 'English' : 'español')
  }
  return ''
}
