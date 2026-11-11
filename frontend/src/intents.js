// In-browser command matching (no LLM). Used when the AI server is asleep, out of free quota, or did not pick
// a page tool. Produces the same whitelisted actions as the backend: [{ type, value }].
export const SECTIONS = ['top', 'projects', 'about', 'skills', 'experience', 'education', 'contact']
export const PROJECTS = ['portfolio-assistant', 'elf-reader', 'glossub', 'codex-stickman-pipeline', 'arcane-knockout']
const MAX = 3

const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const PROJECT_WORDS = [
  ['elf-reader', /\belf\b|elf ?reader|lector de libros|e-?book reader/],
  ['glossub', /\bglos ?sub\b|subtitul/],
  ['codex-stickman-pipeline', /stickman|\bcodex\b/],
  ['arcane-knockout', /\barcane\b|knockout|\bjuego\b|\bgame\b/],
  ['portfolio-assistant', /asistente|assistant|chatbot|\brag\b|langgraph/],
]
const SECTION_WORDS = [
  ['contact', /contact/],
  ['experience', /experien/],
  ['education', /educa|formacion|estudios/],
  ['skills', /habilidad|skill|stack/],
  ['about', /sobre (el|mi|lian)|\babout\b/],
  ['projects', /proyectos\b|projects\b/],
  ['top', /\binicio\b|\barriba\b|\btop\b|\bhome\b|principio/],
]
// Imperative / "I want to see" wording, so plain questions ("how does GlosSub work?") stay questions.
const GO = /\b(ir|ve|anda|vamos|lleva\w*|mostra\w*|muestra\w*|ensena\w*|abri\w*|abre|abrir|ver|quiero ver|scroll|go|take me|bring me|show( me)?|open|navigate|jump|display|see)\b/
const DARK = /\b(oscur\w*|dark|noche|nocturno|night)\b/
const LIGHT = /\b(claro|light|dia|day|blanco)\b/
const THEME = /\b(modo|tema|mode|theme|fondo|colores?)\b/

export function parseCommands(text, lang = 'en') {
  const q = norm(text)
  const out = []
  const add = (type, value) => { if (out.length < MAX && !out.some(a => a.type === type && a.value === value)) out.push({ type, value }) }

  if (THEME.test(q) || /\b(dark|oscuro)\b/.test(q)) {
    if (DARK.test(q)) add('set_theme', 'dark')
    else if (LIGHT.test(q)) add('set_theme', 'light')
    else if (/\b(cambia\w*|toggle|switch|change|alterna\w*)\b/.test(q)) add('set_theme', 'toggle')
  }
  const toEn = /\b(en|in|to|a|al)\s+(ingles|english)\b|\benglish (please|version)\b/.test(q)
  const toEs = /\b(en|in|to|a|al)\s+(espanol|spanish|castellano)\b|\bspanish (please|version)\b/.test(q)
  const cv = /\b(cv|curriculum|resume|hoja de vida)\b/.test(q) && /\b(descarg\w*|baj\w*|download|get|dame|pasame|quiero)\b/.test(q)
  if (cv) add('download_cv', toEn ? 'en' : toEs ? 'es' : lang)
  else if (toEn) add('set_language', 'en')
  else if (toEs) add('set_language', 'es')
  else if (/\b(idioma|language|lenguaje)\b/.test(q) && /\b(cambia\w*|switch|change|toggle)\b/.test(q)) add('set_language', lang === 'en' ? 'es' : 'en')

  if (GO.test(q)) {
    const project = PROJECT_WORDS.find(([, re]) => re.test(q))
    const section = SECTION_WORDS.find(([, re]) => re.test(q))
    if (project && (/proyecto|project/.test(q) || !section)) add('open_project', project[0])
    else if (section && !(section[0] === 'skills' && !/seccion|section|habilidad|skill/.test(q))) add('go_to_section', section[0])
  }
  return out
}
