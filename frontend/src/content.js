export const GITHUB = 'https://github.com/CatbearLang'
export const EMAIL = 'Catbeardarkworld@gmail.com'

export const ui = {
  en: {
    nav: { projects: 'Projects', experience: 'Experience', contact: 'Contact', cv: 'Download CV' },
    role: 'Full-Stack & AI Automation Engineer',
    hero: 'I build end-to-end AI pipelines, full-stack apps and automations. Each project below shows the problem, how it works, my role and measured results.',
    ctaProjects: 'See projects', ctaChat: 'Ask my AI assistant',
    aboutTitle: 'About',
    about: 'Informatics Engineering candidate (thesis stage) from Paraguay with 3 years of hands-on full-stack work in React and PostgreSQL. I design AI workflows (LLMs, speech recognition, TTS, image generation), automate processes with n8n and ship containerized services with Docker and Kubernetes. Open to remote full-stack, backend and AI-automation roles.',
    skillsTitle: 'Skills', projectsTitle: 'Featured projects', expTitle: 'Experience', eduTitle: 'Education',
    contactTitle: 'Let’s talk', contactText: 'Open to remote roles. The fastest way to reach me is email.',
    readMore: 'Read case study →', back: '← All projects', stack: 'Stack', highlights: 'Key results', context: 'Context', stackL: 'Stack', how: 'How it works', built: 'How it was built', links: 'Links',
    chat: { title: 'Ask about my work', hint: 'Answers come only from my project docs, with sources.', localMode: 'Fallback: in-browser keyword search (no AI)', fallbackNote: 'AI server unavailable, quick answer without AI:', aiMode: 'AI assistant (LangGraph + RAG, with memory)', placeholder: 'e.g. How does GlosSub work?', send: 'Send', thinking: 'Thinking…', waking: 'Waking up the AI server… (can take up to a minute)', sources: 'Sources', suggestions: ['What LangGraph project did he build and how does it work?', 'What is his tech stack?', 'How does GlosSub help you learn languages?'], trace: 'Agent trace', sourcesTitle: 'Cited snippets', cachedNote: 'Precomputed by the real graph (0 API calls)', lruNote: 'Cached answer (0 API calls)', tooLong: 'Please keep questions under 300 characters.', limitNote: 'Free questions: 8/day per visitor · max 300 characters' },
    footer: 'Built with React + Vite. Assistant: FastAPI + LangGraph (tool-calling agent → retriever tool: BM25 + model2vec embeddings → relevance grading/query rewrite → cited answer → grounding check), Nemotron via OpenRouter. Visible agent trace, rate limits, injection hardening (not a guarantee).',
  },
  es: {
    nav: { projects: 'Proyectos', experience: 'Experiencia', contact: 'Contacto', cv: 'Descargar CV' },
    role: 'Ingeniero Full-Stack y de Automatización con IA',
    hero: 'Construyo pipelines de IA de punta a punta, apps full-stack y automatizaciones. Cada proyecto muestra el problema, cómo funciona, mi rol y resultados medidos.',
    ctaProjects: 'Ver proyectos', ctaChat: 'Preguntale a mi asistente IA',
    aboutTitle: 'Sobre mí',
    about: 'Estudiante de Ingeniería en Informática en etapa de tesis, de Paraguay, con 3 años de experiencia práctica full-stack en React y PostgreSQL. Diseño flujos con IA (LLMs, reconocimiento de voz, TTS, generación de imágenes), automatizo procesos con n8n y despliego servicios en contenedores con Docker y Kubernetes. Abierto a roles remotos full-stack, backend y de automatización con IA.',
    skillsTitle: 'Habilidades', projectsTitle: 'Proyectos destacados', expTitle: 'Experiencia', eduTitle: 'Formación',
    contactTitle: 'Hablemos', contactText: 'Disponible para roles remotos. La forma más rápida de contactarme es por email.',
    readMore: 'Ver caso de estudio →', back: '← Todos los proyectos', stack: 'Stack', highlights: 'Resultados clave', context: 'Contexto', stackL: 'Stack', how: 'Cómo funciona', built: 'Cómo se hizo', links: 'Enlaces',
    chat: { title: 'Preguntá sobre mi trabajo', hint: 'Responde solo con la documentación de mis proyectos, citando fuentes.', localMode: 'Respaldo: búsqueda en el navegador (sin IA)', fallbackNote: 'Servidor de IA no disponible, respuesta rápida sin IA:', aiMode: 'Asistente IA (LangGraph + RAG, con memoria)', placeholder: 'ej. ¿Cómo funciona GlosSub?', send: 'Enviar', thinking: 'Pensando…', waking: 'Despertando el servidor de IA… (puede tardar hasta un minuto)', sources: 'Fuentes', suggestions: ['¿Qué proyecto de LangGraph hizo y cómo funciona?', '¿Cuál es su stack?', '¿Cómo ayuda GlosSub a aprender idiomas?'], trace: 'Pensamiento del agente', sourcesTitle: 'Fragmentos citados', cachedNote: 'Precalculada con el grafo real (0 llamadas a la API)', lruNote: 'Respuesta en caché (0 llamadas a la API)', tooLong: 'Por favor, escribí preguntas de menos de 300 caracteres.', limitNote: 'Preguntas libres: 8/día por visitante · máx. 300 caracteres' },
    footer: 'Hecho con React + Vite. Asistente: FastAPI + LangGraph (agente con herramienta de búsqueda: BM25 + embeddings model2vec → evaluación de relevancia/reescritura → respuesta con citas → verificación de respaldo), Nemotron vía OpenRouter. Traza visible del agente, límites de uso y defensas contra prompt injection (sin garantía absoluta).',
  },
}

export const skills = [
  ['Frontend', 'React · JavaScript · HTML/CSS'],
  ['Backend & Data', 'Python · FastAPI · Pydantic · PostgreSQL · REST'],
  ['AI & Automation', 'LLM APIs · LangGraph · RAG · Whisper · TTS · n8n'],
  ['DevOps', 'Docker · Kubernetes · CI/data pipelines · load balancing'],
  ['Quality & Security', 'pytest · headless tests · secret scanning · input validation'],
  ['Games & Media', 'Unity/C# · FFmpeg'],
]

export const projects = [
  {
    slug: 'codex-stickman-pipeline', name: 'Codex Stickman Pipeline', accent: '#7c5cff',
    image: 'img/stickman-demo.gif',
    tags: ['Python', 'LLM', 'TTS', 'FFmpeg', 'pytest'],
    links: [['GitHub', 'https://github.com/CatbearLang/codex-stickman-pipeline']],
    en: { context: 'Open-source project (MIT), public on GitHub.',
      tagline: 'One command turns a topic into a narrated 1080p explainer video.',
      highlights: ['Open source (MIT)', '94 offline tests passing', 'Fail-closed cost controls', 'Resumable jobs with OS locks'],
      how: ['LLM writes a JSON script validated against a schema; quality gates check pacing and budgets before any paid call.', 'Text-to-speech (Edge TTS by default) and word-level alignment map each visual concept to a time range.', 'AI images are generated in one batch and cached by content hash.', 'FFmpeg composes camera motion, crossfades, overlays, SFX and ducked music; ffprobe verifies the output.'],
      built: ['Small provider interfaces so services are swappable and tests use doubles.', 'Durable budget ledger: image calls are counted before they run, so two runs cannot overspend.', 'No credential handling: keys only from environment variables; a secret scanner runs in the test suite.'],
    },
    es: { context: 'Proyecto open source (MIT), público en GitHub.',
      tagline: 'Un comando convierte un tema en un video explicativo narrado en 1080p.',
      highlights: ['Código abierto (MIT)', '94 tests sin conexión aprobados', 'Control de costos con falla cerrada', 'Trabajos reanudables con locks'],
      how: ['Un LLM escribe un guion JSON validado con un esquema; los quality gates revisan ritmo y presupuesto antes de cualquier llamada paga.', 'TTS (Edge TTS por defecto) y alineación por palabra asignan cada concepto visual a un rango de tiempo.', 'Las imágenes con IA se generan en un lote y se cachean por hash.', 'FFmpeg compone movimiento de cámara, transiciones, overlays, efectos y música con ducking; ffprobe verifica la salida.'],
      built: ['Interfaces chicas de proveedores: servicios intercambiables y tests con dobles.', 'Registro de presupuesto persistente: las imágenes se descuentan antes de generarse.', 'Sin manejo de credenciales: claves solo por variables de entorno; escáner de secretos en los tests.'],
    },
  },
  {
    slug: 'glossub', name: 'GlosSub', accent: '#22d3ee',
    image: 'img/glossub-hero.webp',
    imageAlt: { en: 'glosSub web app: bilingual color-matched subtitles', es: 'App web glosSub: subtítulos bilingües con colores coincidentes' },
    tags: ['Python', 'FastAPI', 'Whisper', 'LLM', 'Pydantic'],
    links: [],
    en: { context: 'Personal project for learning languages by watching series: CLI and local web tool (Python, FastAPI). Video is processed locally; text may be sent to an external LLM provider depending on the configuration.',
      tagline: 'Learn languages by watching series: Whisper captures and understands the audio, an LLM translates it and generates bilingual subtitles, then words are aligned between original and translation with colors so the translation is easier to understand.',
      highlights: ['Purpose: understand series in another language with color-aligned original + translation', 'Pipeline orchestration: transcription, segmentation, contextual translation, bilingual alignment, rendering', 'LLM output validated with retries; low-confidence cues flagged', 'Exports ASS (color-coded alignment), SRT and JSON', 'Cached stages avoid repeating work', 'One sample run (23.7-min episode): 253/254 cues translated, 227/254 colored, not a guarantee'],
      how: ['FFmpeg converts the selected audio track (any format FFmpeg can read) to 16 kHz mono; MLX Whisper on Mac transcribes with word-level timestamps and filters some likely hallucinations.', 'Words are grouped into cues using pauses, punctuation, length and duration.', 'Cues are translated in batches with context by a configurable LLM over an OpenAI-compatible API, with validation and retries; untranslated cues can remain, flagged as low confidence.', 'Optional alignment links words and phrases across languages, shown as colors in ASS (meaning, not audio sync; can be partial). SRT is plain text and JSON holds the structured data.'],
      built: ['Spec and a written decisions document first; assumptions checked on real data before building on them.', 'Separate cached stages, so re-working the same material does not repeat finished stages.', 'Local web UI binds to loopback by default with path validation; it is a local tool, not meant for public exposure.'],
    },
    es: { context: 'Proyecto personal para aprender idiomas viendo series: herramienta de línea de comandos y web local (Python, FastAPI). El video se procesa localmente; el texto puede enviarse a un proveedor de LLM externo según la configuración.',
      tagline: 'Aprendé idiomas viendo series: Whisper capta y entiende el audio, un LLM lo traduce y genera subtítulos bilingües, y después alinea las palabras entre el original y la traducción con colores para que la traducción se entienda mejor.',
      highlights: ['Objetivo: entender series en otro idioma con original + traducción alineados por colores', 'Orquestación del pipeline: transcripción, segmentación, traducción contextual, alineación bilingüe y renderizado', 'Respuestas del LLM validadas con reintentos; segmentos de baja confianza marcados', 'Exporta ASS (alineación por colores), SRT y JSON', 'Etapas en caché para no repetir trabajo', 'Una ejecución de muestra (episodio de 23,7 min): 253/254 segmentos traducidos, 227/254 coloreados, no es una garantía'],
      how: ['FFmpeg convierte la pista de audio seleccionada (en formatos que FFmpeg pueda leer) a mono 16 kHz; en Mac, MLX Whisper transcribe con marcas temporales por palabra y filtra algunas posibles alucinaciones.', 'Las palabras se agrupan en subtítulos según pausas, puntuación, longitud y duración.', 'Los segmentos se traducen por lotes con contexto mediante un LLM configurable con API compatible con OpenAI, con validación y reintentos; pueden quedar segmentos sin traducir, marcados con baja confianza.', 'La alineación opcional relaciona palabras y frases entre idiomas y se muestra con colores en el ASS (significado, no sincronía con el audio; puede ser parcial). El SRT es solo texto y el JSON guarda los datos estructurados.'],
      built: ['Primero la especificación y un documento de decisiones; supuestos comprobados con datos reales.', 'Etapas separadas en caché, para no repetir lo ya hecho al volver al mismo material.', 'La web local escucha en loopback por defecto y valida rutas; es una herramienta local, no pensada para exponerse públicamente.'],
    },
  },
  {
    slug: 'arcane-knockout', name: 'Arcane Knockout', accent: '#f97316',
    image: 'img/arcane-knockout-unity-poster.jpg',
    video: 'img/arcane-knockout-unity.mp4',
    tags: ['Unity 6', 'C#', 'Unity Netcode', 'Multiplayer'],
    links: [],
    en: { context: 'Personal game project, Windows build 0.0.9. Code and logic: mine. Art: AI-generated.',
      tagline: '3D online wizard-duel arena game in Unity 6 / C# — game logic and code, AI-assisted workflow.',
      highlights: ['Built in Unity 6 with C# (Windows build 0.0.9)', 'Online sessions with snapshot-based networking and LAN room discovery', 'Bots with personality, navigation and shop logic', 'Procedural arena collapse into lava'],
      how: ['No health bar: each hit raises Instability, so the next push throws you farther while the platform collapses into lava.', 'Gameplay in C#: match controller, combat math, elemental spell clashes and status effects, shop, titles and mastery.', 'Networking on Unity Netcode/Transport: snapshot frames with a history buffer, LAN discovery and a relay/NAT-punch transport.', 'Procedural arenas: a platform graph and collapse planner decide how the ground falls apart.'],
      built: ['I built the game logic and code using AI coding agents, decision records and per-version delivery notes. Art, textures and 3D models were AI-generated.', 'One runtime assembly (~410 types) organized into Gameplay, Net, Core, Arena, Rendering, UI, Audio and Input namespaces.', 'Migrated to Unity 6 from an earlier prototype; uses the Unity Input System and ProBuilder.'],
    },
    es: { context: 'Proyecto personal de juego, build de Windows 0.0.9. Código y lógica: míos. Arte: generado con IA.',
      tagline: 'Juego 3D de duelos de magos en línea hecho en Unity 6 / C#: lógica y código del juego, con flujo asistido por IA.',
      highlights: ['Hecho en Unity 6 con C# (build de Windows 0.0.9)', 'Sesiones en línea con red por snapshots y descubrimiento de salas en LAN', 'Bots con personalidad, navegación y compras', 'Derrumbe procedural de la arena a la lava'],
      how: ['Sin barra de vida: cada impacto sube la Instability y el próximo empujón te lanza más lejos mientras la plataforma cae a la lava.', 'Jugabilidad en C#: controlador de partida, matemática de combate, choques elementales de hechizos y estados, tienda, títulos y maestría.', 'Red sobre Unity Netcode/Transport: frames por snapshot con historial, descubrimiento en LAN y transporte relay/NAT-punch.', 'Arenas procedurales: un grafo de plataformas y un planificador de derrumbe deciden cómo se cae el suelo.'],
      built: ['Hice la lógica y el código con agentes de programación con IA, registros de decisiones y notas por versión. El arte, las texturas y los modelos 3D fueron generados con IA.', 'Un solo assembly de runtime (~410 tipos) organizado en los namespaces Gameplay, Net, Core, Arena, Rendering, UI, Audio e Input.', 'Migrado a Unity 6 desde un prototipo anterior; usa Unity Input System y ProBuilder.'],
    },
  },
]

export const experience = {
  en: [
    ['Freelance Full-Stack Developer & Open-Source Contributor', '3 years', 'Client web projects with React, backend services and PostgreSQL; maintenance and debugging; open-source projects on GitHub (CatbearLang).'],
    ['IT Support — Vinader Computación', '', 'Hardware and software support, installation, troubleshooting and preventive maintenance.'],
    ['Cashier — Casa Jorge', '5 years', 'Customer service, cash handling and daily register balancing.'],
  ],
  es: [
    ['Desarrollador Full-Stack Freelance y colaborador Open Source', '3 años', 'Proyectos web para clientes con React, backend y PostgreSQL; mantenimiento y depuración; proyectos open source en GitHub (CatbearLang).'],
    ['Soporte TI — Vinader Computación', '', 'Soporte de hardware y software, instalación, resolución de problemas y mantenimiento preventivo.'],
    ['Cajero — Casa Jorge', '5 años', 'Atención al cliente, manejo de efectivo y cierre de caja.'],
  ],
}
export const education = {
  en: ['B.Sc. Informatics Engineering — Faculty of Engineering, Universidad Nacional de Itapúa (FIUNI) — Thesis stage (in progress)', 'Technical High School Diploma in Informatics (2015–2017), Distinguished Student 2016 & 2017', 'English Intermediate 3A — EUROSUR (2015)'],
  es: ['Ingeniería en Informática — Facultad de Ingeniería, Universidad Nacional de Itapúa (FIUNI) — en etapa de tesis', 'Bachiller Técnico en Informática (2015–2017), Alumno Distinguido 2016 y 2017', 'Inglés Intermedio 3A — EUROSUR (2015)'],
}
