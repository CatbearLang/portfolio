// In-browser assistant: no backend, no API key. Curated bilingual answers built from content.js
// plus BM25-style retrieval (MiniSearch) over the same knowledge docs the RAG backend indexes.
import MiniSearch from 'minisearch'
import kb from './kb.json'
import { projects, education, experience, GITHUB } from './content.js'

const LINKEDIN = 'https://www.linkedin.com/in/lianyang-dev'
const P = slug => projects.find(p => p.slug === slug)
const proj = (slug, l) => { const p = P(slug), c = p[l]; return `${p.name}: ${c.tagline}\n\n${l === 'es' ? 'Ejemplo' : 'For example'}: ${c.how[0]}` }

const intents = [
  { id: 'glossub', src: 'glossub.md', kw: 'glossub series serie watching viendo learn aprender subtitles subtitulos subtítulos bilingual bilingues idiomas language learning whisper',
    en: () => `GlosSub: ${P('glossub').en.tagline}\n\n• Video is processed locally; text may go to the configured LLM provider.\n• Colors are in the ASS export; SRT is plain text.`,
    es: () => `GlosSub: ${P('glossub').es.tagline}\n\n• El video se procesa localmente; el texto puede ir al proveedor de LLM configurado.\n• Los colores están en el ASS; el SRT es solo texto.` },
  { id: 'stickman', src: 'codex-stickman-pipeline.md', kw: 'stickman codex pipeline video videos explainer explicativo tts ffmpeg cost costo costos budget presupuesto',
    en: () => `Codex Stickman Pipeline: ${P('codex-stickman-pipeline').en.tagline} ${P('codex-stickman-pipeline').en.context}\n\n• ${P('codex-stickman-pipeline').en.built[1]}\n\nCode: ${GITHUB}/codex-stickman-pipeline`,
    es: () => `Codex Stickman Pipeline: ${P('codex-stickman-pipeline').es.tagline} ${P('codex-stickman-pipeline').es.context}\n\n• ${P('codex-stickman-pipeline').es.built[1]}\n\nCódigo: ${GITHUB}/codex-stickman-pipeline` },
  { id: 'arcane', src: 'arcane-knockout.md', kw: 'arcane knockout unity game juego videojuego wizard magos multiplayer art arte generated generadas',
    en: () => `Arcane Knockout: ${P('arcane-knockout').en.tagline}\n\n${P('arcane-knockout').en.built[0]}`,
    es: () => `Arcane Knockout: ${P('arcane-knockout').es.tagline}\n\n${P('arcane-knockout').es.built[0]}` },
  { id: 'projects', src: 'profile.md', kw: 'projects proyectos portfolio work trabajos hecho built made',
    en: () => 'Lian\'s featured projects are:\n' + projects.map(p => `• ${p.name}: ${p.en.tagline}`).join('\n') + '\n\nThis chat assistant is also a project: the full version is a FastAPI + LangGraph RAG agent over his project docs.',
    es: () => 'Los proyectos destacados de Lian son:\n' + projects.map(p => `• ${p.name}: ${p.es.tagline}`).join('\n') + '\n\nEste asistente también es un proyecto: la versión completa es un agente RAG con FastAPI + LangGraph sobre la documentación de sus proyectos.' },
  { id: 'stack', src: 'profile.md', kw: 'stack stacks skill skills tech habilidades technologies tecnologias tecnologías react python fastapi postgresql docker kubernetes languages lenguajes tools herramientas',
    en: () => 'His main stack: React and JavaScript on the frontend; Python (FastAPI, Pydantic) and PostgreSQL on the backend; LLM APIs, LangGraph, RAG, Whisper and TTS for AI work; Docker and Kubernetes (intermediate); pytest and headless tests; plus Unity/C# and FFmpeg.',
    es: () => 'Su stack principal: React y JavaScript en el frontend; Python (FastAPI, Pydantic) y PostgreSQL en el backend; APIs de LLM, LangGraph, RAG, Whisper y TTS para IA; Docker y Kubernetes (nivel intermedio); pytest y tests headless; además Unity/C# y FFmpeg.' },
  { id: 'education', src: 'profile.md', kw: 'education educacion educación study estudios university universidad degree carrera thesis tesis fiuni english ingles inglés',
    en: () => 'Education:\n• ' + education.en.join('\n• ') + '\n\nLanguages: Spanish (native), English (intermediate).',
    es: () => 'Formación:\n• ' + education.es.join('\n• ') + '\n\nIdiomas: español (nativo), inglés (intermedio).' },
  { id: 'experience', src: 'profile.md', kw: 'experience experiencia years años freelance job empleo worked trabajó',
    en: () => 'Experience:\n• ' + experience.en.map(e => `${e[0]}${e[1] ? ` (${e[1]})` : ''}: ${e[2]}`).join('\n• '),
    es: () => 'Experiencia:\n• ' + experience.es.map(e => `${e[0]}${e[1] ? ` (${e[1]})` : ''}: ${e[2]}`).join('\n• ') },
  { id: 'availability', src: 'profile.md', kw: 'available availability disponible disponibilidad remote remoto hire contratar open roles where donde paraguay timezone horario',
    en: () => 'Lian is based in Paraguay and is open to remote full-stack, backend and AI-automation roles, with USA/Canada teams first and other English- or Spanish-speaking teams too.',
    es: () => 'Lian vive en Paraguay y está abierto a roles remotos full-stack, backend y de automatización con IA, priorizando equipos de EE.UU./Canadá y también otros de habla inglesa o española.' },
  { id: 'contact', src: 'profile.md', kw: 'contact contacto reach linkedin github message mensaje hablar talk',
    en: () => `You can reach Lian on LinkedIn (${LINKEDIN}) or see his code on GitHub (${GITHUB}).`,
    es: () => `Podés contactar a Lian por LinkedIn (${LINKEDIN}) o ver su código en GitHub (${GITHUB}).` },
  { id: 'assistant', src: 'profile.md', kw: 'assistant asistente chatbot bot rag langgraph how you work funcionás funciona this site sitio',
    en: () => 'This page runs an in-browser version: it searches the same project documents the backend uses and answers from them, with no API key. The full version is a FastAPI backend running a LangGraph agent (route → retrieve → answer with citations) over a FAISS vector index.',
    es: () => 'Esta página usa una versión en el navegador: busca en los mismos documentos de proyectos que usa el backend y responde con ellos, sin clave de API. La versión completa es un backend FastAPI con un agente LangGraph (enrutar → recuperar → responder con citas) sobre un índice vectorial FAISS.' },
]

const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const STOP = new Set('what which who whom how does did the and for are his her him its this that with from about tell can you your there was were has have will would into more some any que qué cual cuál como cómo del las los una uno por para con sus que hace tiene sobre esta este eso esa son ser fue the where when why'.split(' '))
const opts = { fields: ['title', 'text', 'kw'], storeFields: ['id'], processTerm: t => { t = norm(t); return t.length > 2 && !STOP.has(t) ? t : null }, searchOptions: { boost: { kw: 3, title: 2 }, fuzzy: t => t.length > 5 ? 0.15 : 0, prefix: t => t.length > 4 } }
const iIdx = new MiniSearch(opts); iIdx.addAll(intents.map(i => ({ id: i.id, title: i.id, kw: i.kw, text: '' })))
const cIdx = new MiniSearch(opts); cIdx.addAll(kb.map(c => ({ ...c, kw: '' })))


// Guard before retrieval (mirrors backend/app/guard.py).
const CODE = /\b(source|codigo|code|repo|repositorio|github|descargar|download|clonar|clone)\b/
const PRIVATE = /\b(e-?mail|correo|mail|phone|telefono|celular|whatsapp|numero|address|direccion|domicilio|salar\w*|sueldo|pay|password\w*|contrasena\w*|clave|cedula|dni|id card|api key|token)\b/
const PROFILE = /\b(lian|glossub|stickman|codex|arcane|knockout|portfolio|project\w*|proyecto\w*|stack|skill\w*|habilidad\w*|tecnolog\w*|experien\w*|educa\w*|formacion|estudi\w*|universidad|university|tesis|thesis|work\w*|trabaj\w*|remot\w*|disponib\w*|availab\w*|contact\w*|linkedin|cv|resume|curriculum|ingles|english|idioma\w*|language\w*|serie\w*|subtit\w*|whisper|llm|rag|langgraph|react|python|fastapi|unity|game|juego|assistant|asistente|chatbot|hire|contratar|freelance|role\w*|rol)\b/
const PORTFOLIO_REPO = `${GITHUB}/portfolio`, STICKMAN_REPO = `${GITHUB}/codex-stickman-pipeline`
const MSG = {
  code_private: { en: "I can't share GlosSub's source code: it's a private project. I can tell you how it works or which technologies it uses.", es: 'No puedo compartir el código fuente de GlosSub: es un proyecto privado. Puedo contarte cómo funciona o qué tecnologías usa.' },
  code_arcane: { en: "I can't share Arcane Knockout's source code: it's a private project. I can tell you how it works or what Lian built.", es: 'No puedo compartir el código fuente de Arcane Knockout: es un proyecto privado. Puedo contarte cómo funciona o qué hizo Lian.' },
  code_public: { en: `Public code: Codex Stickman Pipeline (${STICKMAN_REPO}) and this portfolio (${PORTFOLIO_REPO}). GlosSub and Arcane Knockout are private.`, es: `Código público: Codex Stickman Pipeline (${STICKMAN_REPO}) y este portfolio (${PORTFOLIO_REPO}). GlosSub y Arcane Knockout son privados.` },
  private: { en: `I can't share personal data. To contact Lian, use LinkedIn (${LINKEDIN}).`, es: `No puedo compartir datos personales. Para contactar a Lian, usá LinkedIn (${LINKEDIN}).` },
  off_topic: { en: "I can only answer about Lian's projects and professional profile.", es: 'Solo puedo responder sobre los proyectos y el perfil profesional de Lian.' },
}
export function classify(question) {
  const q = norm(question)
  if (CODE.test(q)) {
    if (/stickman|codex|portfolio/.test(q)) return 'code_public'
    if (/arcane|knockout/.test(q)) return 'code_arcane'
    if (q.includes('glossub')) return 'code_private'
    return 'code_public'
  }
  if (PRIVATE.test(q)) return 'private'
  return PROFILE.test(q) ? 'on_topic' : 'off_topic'
}

export function localAnswer(question, lang = 'en') {
  const l = lang === 'es' ? 'es' : 'en'
  const g = classify(question)
  if (g !== 'on_topic') return { answer: MSG[g][l], sources: [] }
  const ih = iIdx.search(question), ch = cIdx.search(question)
  const best = ih[0]
  // Specific doc chunk beats the generic intent only for detailed questions about a project's internals.
  const specific = ch[0] && ch[0].score > (best?.score || 0) * 2.5 && !['projects', 'contact', 'availability'].includes(best?.id)
  if (best && best.score > 1 && !specific) {
    const it = intents.find(i => i.id === best.id)
    return { answer: it[l](), sources: [{ id: 1, source: it.src, title: it.id }] }
  }
  if (ch[0] && ch[0].score > 4 && ch[0].queryTerms.length >= Math.min(2, new Set(question.split(/\W+/u).map(norm).filter(t => t.length > 2 && !STOP.has(t))).size)) {
    const c = kb.find(k => k.id === ch[0].id)
    const text = c.text.split('\n').slice(0, 3).join('\n')
    const pre = l === 'es' ? `De la documentación de ${c.title} (en inglés):\n` : `From the ${c.title} docs:\n`
    return { answer: pre + text, sources: [{ id: 1, source: c.source, title: c.title }] }
  }
  return { answer: l === 'es'
    ? `No encontré eso en la documentación de los proyectos, así que prefiero no inventar. Podés preguntar por sus proyectos, stack, formación o disponibilidad, o escribirle por LinkedIn (${LINKEDIN}) o ver GitHub (${GITHUB}).`
    : `I couldn't find that in the project docs, so I won't guess. Try asking about his projects, stack, education or availability, or reach him on LinkedIn (${LINKEDIN}) or GitHub (${GITHUB}).`, sources: [] }
}
