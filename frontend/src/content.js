export const GITHUB = 'https://github.com/CatbearLang'
export const EMAIL = 'Catbeardarkworld@gmail.com'

export const ui = {
  en: {
    nav: { projects: 'Projects', experience: 'Experience', contact: 'Contact', cv: 'Download CV' },
    role: 'Full-Stack & AI Automation Engineer',
    hero: 'I build end-to-end AI pipelines, full-stack apps and automations — tested, documented and secure by default.',
    ctaProjects: 'See projects', ctaChat: 'Ask my AI assistant',
    aboutTitle: 'About',
    about: 'Informatics Engineer from Paraguay with about 2 years of hands-on full-stack work in React and PostgreSQL. I design AI workflows (LLMs, speech recognition, TTS, image generation), automate processes with n8n and ship containerized services with Docker and Kubernetes. Open to remote full-stack, backend and AI-automation roles.',
    skillsTitle: 'Skills', projectsTitle: 'Featured projects', expTitle: 'Experience', eduTitle: 'Education',
    contactTitle: 'Let’s talk', contactText: 'Open to remote roles. The fastest way to reach me is email.',
    readMore: 'Read case study →', back: '← All projects', stack: 'Stack', highlights: 'Highlights', how: 'How it works', built: 'How it was built', links: 'Links',
    chat: { title: 'Ask about Lian', hint: 'Answers come only from Lian’s project docs, with sources.', placeholder: 'e.g. How does GlosSub work?', send: 'Send', offline: 'The assistant is offline right now. Browse the projects below or email Lian at', thinking: 'Thinking…', sources: 'Sources', suggestions: ['What does GlosSub do?', 'What was Lian’s role in Arcane Knockout?', 'How is cost controlled in the stickman pipeline?'] },
    footer: 'Built with React + Vite. Assistant: FastAPI + LangGraph + FAISS.',
  },
  es: {
    nav: { projects: 'Proyectos', experience: 'Experiencia', contact: 'Contacto', cv: 'Descargar CV' },
    role: 'Ingeniero Full-Stack y de Automatización con IA',
    hero: 'Construyo pipelines de IA de punta a punta, apps full-stack y automatizaciones: con tests, documentadas y seguras por defecto.',
    ctaProjects: 'Ver proyectos', ctaChat: 'Preguntale a mi asistente IA',
    aboutTitle: 'Sobre mí',
    about: 'Ingeniero en Informática de Paraguay con unos 2 años de experiencia práctica full-stack en React y PostgreSQL. Diseño flujos con IA (LLMs, reconocimiento de voz, TTS, generación de imágenes), automatizo procesos con n8n y despliego servicios en contenedores con Docker y Kubernetes. Abierto a roles remotos full-stack, backend y de automatización con IA.',
    skillsTitle: 'Habilidades', projectsTitle: 'Proyectos destacados', expTitle: 'Experiencia', eduTitle: 'Formación',
    contactTitle: 'Hablemos', contactText: 'Disponible para roles remotos. La forma más rápida de contactarme es por email.',
    readMore: 'Ver caso de estudio →', back: '← Todos los proyectos', stack: 'Stack', highlights: 'Puntos clave', how: 'Cómo funciona', built: 'Cómo se hizo', links: 'Enlaces',
    chat: { title: 'Preguntá sobre Lian', hint: 'Responde solo con la documentación de los proyectos de Lian, citando fuentes.', placeholder: 'ej. ¿Cómo funciona GlosSub?', send: 'Enviar', offline: 'El asistente no está disponible ahora. Mirá los proyectos o escribile a Lian a', thinking: 'Pensando…', sources: 'Fuentes', suggestions: ['¿Qué hace GlosSub?', '¿Cuál fue el rol de Lian en Arcane Knockout?', '¿Cómo controla costos el pipeline stickman?'] },
    footer: 'Hecho con React + Vite. Asistente: FastAPI + LangGraph + FAISS.',
  },
}

export const skills = [
  ['Frontend', 'React · JavaScript · HTML/CSS'],
  ['Backend & Data', 'Python · FastAPI · Pydantic · PostgreSQL · REST'],
  ['AI & Automation', 'LLM APIs · LangGraph · RAG · Whisper · TTS · n8n'],
  ['DevOps', 'Docker · Kubernetes · CI/data pipelines · load balancing'],
  ['Quality & Security', 'pytest · headless tests · secret scanning · input validation'],
  ['Games & Media', 'Godot/GDScript · Unity/C# · FFmpeg'],
]

export const projects = [
  {
    slug: 'codex-stickman-pipeline', name: 'Codex Stickman Pipeline', accent: '#7c5cff',
    image: 'img/stickman-demo.gif',
    tags: ['Python', 'LLM', 'TTS', 'FFmpeg', 'pytest'],
    links: [['GitHub', 'https://github.com/CatbearLang/codex-stickman-pipeline']],
    en: {
      tagline: 'One command turns a topic into a narrated 1080p explainer video.',
      highlights: ['Open source (MIT)', '94 offline tests passing', 'Fail-closed cost controls', 'Resumable jobs with OS locks'],
      how: ['LLM writes a JSON script validated against a schema; quality gates check pacing and budgets before any paid call.', 'Text-to-speech (Edge TTS by default) and word-level alignment map each visual concept to a time range.', 'AI images are generated in one batch and cached by content hash.', 'FFmpeg composes camera motion, crossfades, overlays, SFX and ducked music; ffprobe verifies the output.'],
      built: ['Small provider interfaces so services are swappable and tests use doubles.', 'Durable budget ledger: image calls are counted before they run, so two runs cannot overspend.', 'No credential handling: keys only from environment variables; a secret scanner runs in the test suite.'],
    },
    es: {
      tagline: 'Un comando convierte un tema en un video explicativo narrado en 1080p.',
      highlights: ['Código abierto (MIT)', '94 tests sin conexión aprobados', 'Control de costos con falla cerrada', 'Trabajos reanudables con locks'],
      how: ['Un LLM escribe un guion JSON validado con un esquema; los quality gates revisan ritmo y presupuesto antes de cualquier llamada paga.', 'TTS (Edge TTS por defecto) y alineación por palabra asignan cada concepto visual a un rango de tiempo.', 'Las imágenes con IA se generan en un lote y se cachean por hash.', 'FFmpeg compone movimiento de cámara, transiciones, overlays, efectos y música con ducking; ffprobe verifica la salida.'],
      built: ['Interfaces chicas de proveedores: servicios intercambiables y tests con dobles.', 'Registro de presupuesto persistente: las imágenes se descuentan antes de generarse.', 'Sin manejo de credenciales: claves solo por variables de entorno; escáner de secretos en los tests.'],
    },
  },
  {
    slug: 'glossub', name: 'GlosSub', accent: '#22d3ee',
    image: null,
    tags: ['Python', 'FastAPI', 'Whisper', 'LLM', 'Pydantic'],
    links: [],
    en: {
      tagline: 'Color-aligned bilingual subtitles for learning languages from real video.',
      highlights: ['99% of cues translated on a 23.7-min episode', '89% phrase-alignment coverage (688 groups)', 'Cached re-render in under 1 s', 'Loopback-only, path-traversal-safe web UI'],
      how: ['ffmpeg extracts audio; Whisper (MLX on Apple Silicon, CPU fallback) transcribes with word timestamps.', 'Words are segmented into readable cues, then translated by any OpenAI-compatible LLM using structured JSON.', 'An alignment stage maps original ↔ translation phrases; every group is validated before use.', 'Render writes .ass/.srt/.json with shared colors, stacked or column-aligned layouts and optional romaji.'],
      built: ['Spec and a written decisions contract first; assumptions verified on real data before coding.', 'Six pure, idempotent stages with a content-addressed cache and atomic writes.', 'Tuned with measurements: batch size 20 (40 truncated JSON), per-language length guards, fill colors over outlines.'],
    },
    es: {
      tagline: 'Subtítulos bilingües con colores alineados para aprender idiomas con video real.',
      highlights: ['99 % de subtítulos traducidos en un episodio de 23,7 min', '89 % de cobertura de alineación (688 grupos)', 'Re-render desde caché en menos de 1 s', 'Web local solo en loopback y a prueba de path traversal'],
      how: ['ffmpeg extrae el audio; Whisper (MLX en Apple Silicon, CPU como respaldo) transcribe con tiempos por palabra.', 'Las palabras se agrupan en subtítulos legibles y se traducen con cualquier LLM compatible con OpenAI usando JSON estructurado.', 'Una etapa de alineación empareja frases original ↔ traducción; cada grupo se valida antes de usarse.', 'El render escribe .ass/.srt/.json con colores compartidos, layout apilado o en columnas y romaji opcional.'],
      built: ['Primero la especificación y un contrato de decisiones; supuestos verificados con datos reales.', 'Seis etapas puras e idempotentes con caché por huella y escrituras atómicas.', 'Ajustado con mediciones: lotes de 20 (40 truncaba el JSON), límites de largo por idioma, color de relleno en vez de borde.'],
    },
  },
  {
    slug: 'arcane-knockout', name: 'Arcane Knockout', accent: '#f97316',
    image: 'img/ak-partida-red-anfitrion.webp',
    gallery: ['img/ak-partida-red-anfitrion.webp', 'img/ak-partida-red-cliente.webp', 'img/ak-sala-anfitrion.webp', 'img/ak-unirse.webp'],
    tags: ['Godot 4.7', 'GDScript', 'Unity 6', 'C#', 'Multiplayer'],
    links: [],
    en: {
      tagline: '3D online wizard-duel arena game — game logic and code, AI-assisted workflow.',
      highlights: ['Online multiplayer: 2–4 players + bots (ENet/UDP)', '~190 GDScript files with headless test runner', 'Windows and Android builds (v1.3.1)', 'Unity 6 / C# port in progress (build 0.0.9)'],
      how: ['No health bar: each hit raises Instability, so the next push throws you farther while the platform collapses into lava.', 'Data-driven spell system, 10-power Grimoire, shop economy, bots with personality, perception and shopping logic.', 'Rooms by code or IP, LAN discovery and UPnP; spells synchronized over the network.'],
      built: ['Lian built the game logic and code using AI coding agents, decision records and per-version delivery notes. Art, textures and 3D models were AI-generated.', 'Headless automated tests (e.g. 519 checks / 0 failures in the main runner, 349 economy checks) are mandatory before exporting an Android build.', 'Now being ported to Unity 6 in C#: gameplay, elemental spell clashes, snapshot-based networking and procedural arena collapse.'],
    },
    es: {
      tagline: 'Juego 3D de duelos de magos en línea: lógica y código del juego, con flujo asistido por IA.',
      highlights: ['Multijugador en línea: 2–4 personas + bots (ENet/UDP)', '~190 archivos GDScript con runner de tests headless', 'Builds de Windows y Android (v1.3.1)', 'Port a Unity 6 / C# en curso (build 0.0.9)'],
      how: ['Sin barra de vida: cada impacto sube la Instability y el próximo empujón te lanza más lejos mientras la plataforma cae a la lava.', 'Sistema de poderes basado en datos, Grimorio de 10 poderes, tienda, bots con personalidad, percepción y compras.', 'Salas por código o IP, descubrimiento en LAN y UPnP; poderes sincronizados en red.'],
      built: ['Lian hizo la lógica y el código con agentes de programación con IA, registros de decisiones y notas por versión. El arte, las texturas y los modelos 3D fueron generados con IA.', 'Tests automáticos headless (p. ej. 519 chequeos / 0 fallos en el runner principal, 349 de economía) obligatorios antes de exportar a Android.', 'En port a Unity 6 con C#: jugabilidad, choques elementales de hechizos, red por snapshots y derrumbe procedural de la arena.'],
    },
  },
  {
    slug: 'n8n-pilots', name: 'n8n Automation Pilots', accent: '#22c55e',
    image: null,
    tags: ['n8n', 'APIs', 'AI workflows'],
    links: [],
    en: { tagline: 'Pilot workflow automations integrating APIs and AI steps.', highlights: ['Workflow design in n8n', 'API integrations', 'LLM steps inside workflows'], how: ['Pilot automations built in n8n that connect external APIs with AI steps.'], built: ['Practice/pilot projects; detailed case studies are not published yet.'] },
    es: { tagline: 'Automatizaciones piloto que integran APIs y pasos con IA.', highlights: ['Diseño de flujos en n8n', 'Integración de APIs', 'Pasos con LLM dentro de los flujos'], how: ['Automatizaciones piloto en n8n que conectan APIs externas con pasos de IA.'], built: ['Proyectos de práctica/piloto; los casos detallados aún no están publicados.'] },
  },
]

export const experience = {
  en: [
    ['Junior Programmer', '3 years', 'Web features across React frontend and backend with PostgreSQL; maintenance, debugging and support.'],
    ['IT Support — Vinader Computación', '', 'Hardware and software support, installation, troubleshooting and preventive maintenance.'],
    ['Cashier — Casa Jorge', '5 years', 'Customer service, cash handling and daily register balancing.'],
  ],
  es: [
    ['Programador Junior', '3 años', 'Funcionalidades web en frontend React y backend con PostgreSQL; mantenimiento, depuración y soporte.'],
    ['Soporte TI — Vinader Computación', '', 'Soporte de hardware y software, instalación, resolución de problemas y mantenimiento preventivo.'],
    ['Cajero — Casa Jorge', '5 años', 'Atención al cliente, manejo de efectivo y cierre de caja.'],
  ],
}
export const education = {
  en: ['Informatics Engineering — Universidad Nacional de Itapúa', 'Technical High School Diploma in Informatics (2015–2017), Distinguished Student 2016 & 2017', 'English Intermediate 3A — EUROSUR (2015)'],
  es: ['Ingeniería en Informática — Universidad Nacional de Itapúa', 'Bachiller Técnico en Informática (2015–2017), Alumno Distinguido 2016 y 2017', 'Inglés Intermedio 3A — EUROSUR (2015)'],
}
