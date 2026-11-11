import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseCommands } from '../src/intents.js'

const cases = [
  ['quiero cambiar de modo claro a oscuro', 'es', [{ type: 'set_theme', value: 'dark' }]],
  ['Switch to dark mode', 'en', [{ type: 'set_theme', value: 'dark' }]],
  ['Cambiá a modo oscuro', 'es', [{ type: 'set_theme', value: 'dark' }]],
  ['ponelo en modo claro', 'es', [{ type: 'set_theme', value: 'light' }]],
  ['cambiá el tema', 'es', [{ type: 'set_theme', value: 'toggle' }]],
  ['Show me the ELF Reader project', 'en', [{ type: 'open_project', value: 'elf-reader' }]],
  ['Quiero ver el proyecto ELF Reader', 'es', [{ type: 'open_project', value: 'elf-reader' }]],
  ['abrí glossub', 'es', [{ type: 'open_project', value: 'glossub' }]],
  ['open the stickman project', 'en', [{ type: 'open_project', value: 'codex-stickman-pipeline' }]],
  ['Llevame a la sección de contacto', 'es', [{ type: 'go_to_section', value: 'contact' }]],
  ['Take me to the contact section', 'en', [{ type: 'go_to_section', value: 'contact' }]],
  ['ir a experiencia', 'es', [{ type: 'go_to_section', value: 'experience' }]],
  ['ponelo en inglés', 'es', [{ type: 'set_language', value: 'en' }]],
  ['view it in spanish', 'en', [{ type: 'set_language', value: 'es' }]],
  ['descargar su CV', 'es', [{ type: 'download_cv', value: 'es' }]],
  ['download the resume in english', 'es', [{ type: 'download_cv', value: 'en' }]],
  ['modo oscuro y mostrame arcane knockout', 'es', [{ type: 'set_theme', value: 'dark' }, { type: 'open_project', value: 'arcane-knockout' }]],
]
for (const [q, lang, want] of cases) test(q, () => assert.deepEqual(parseCommands(q, lang), want))

// Plain questions must stay questions (answered by RAG, not turned into page actions).
for (const q of ['How does GlosSub work?', '¿Cuál es su stack?', 'What LangGraph project did he build and how does it work?',
  '¿Qué estudió Lian?', 'Is he available for remote work?', 'How can I try GlosSub?', 'What is his tech stack?']) {
  test(`question: ${q}`, () => assert.deepEqual(parseCommands(q, 'en'), []))
}
