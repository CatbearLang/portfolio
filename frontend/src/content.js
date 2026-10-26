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
    readMore: 'Read case study →', back: '← All projects', stack: 'Stack', highlights: 'Key results', context: 'Context', stackL: 'Stack', noRepo: 'Source code available on request.', how: 'How it works', built: 'How it was built', links: 'Links',
    chat: { title: 'Ask about my work', hint: 'Answers come only from my project docs, with sources.', placeholder: 'e.g. How does GlosSub work?', send: 'Send', offline: 'The assistant is offline right now. Browse the projects below or email me at', thinking: 'Thinking…', sources: 'Sources', suggestions: ['What does GlosSub do?', 'Which parts of Arcane Knockout are AI-generated?', 'How is cost controlled in the stickman pipeline?'] },
    footer: 'Built with React + Vite. Assistant: FastAPI + LangGraph + FAISS.',
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
    readMore: 'Ver caso de estudio →', back: '← Todos los proyectos', stack: 'Stack', highlights: 'Resultados clave', context: 'Contexto', stackL: 'Stack', noRepo: 'Código fuente disponible a pedido.', how: 'Cómo funciona', built: 'Cómo se hizo', links: 'Enlaces',
    chat: { title: 'Preguntá sobre mi trabajo', hint: 'Responde solo con la documentación de mis proyectos, citando fuentes.', placeholder: 'ej. ¿Cómo funciona GlosSub?', send: 'Enviar', offline: 'El asistente no está disponible ahora. Mirá los proyectos o escribime a', thinking: 'Pensando…', sources: 'Fuentes', suggestions: ['¿Qué hace GlosSub?', '¿Qué partes de Arcane Knockout son generadas con IA?', '¿Cómo controla costos el pipeline stickman?'] },
    footer: 'Hecho con React + Vite. Asistente: FastAPI + LangGraph + FAISS.',
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
    image: null,
    tags: ['Python', 'FastAPI', 'Whisper', 'LLM', 'Pydantic'],
    links: [],
    en: { context: 'Personal project: local tool for language learners.',
      tagline: 'Color-aligned bilingual subtitles for learning languages from real video.',
      highlights: ['99% of cues translated on a 23.7-min episode', '89% phrase-alignment coverage (688 groups)', 'Cached re-render in under 1 s', 'Loopback-only, path-traversal-safe web UI'],
      how: ['ffmpeg extracts audio; Whisper (MLX on Apple Silicon, CPU fallback) transcribes with word timestamps.', 'Words are segmented into readable cues, then translated by any OpenAI-compatible LLM using structured JSON.', 'An alignment stage maps original ↔ translation phrases; every group is validated before use.', 'Render writes .ass/.srt/.json with shared colors, stacked or column-aligned layouts and optional romaji.'],
      built: ['Spec and a written decisions contract first; assumptions verified on real data before coding.', 'Six pure, idempotent stages with a content-addressed cache and atomic writes.', 'Tuned with measurements: batch size 20 (40 truncated JSON), per-language length guards, fill colors over outlines.'],
    },
    es: { context: 'Proyecto personal: herramienta local para aprender idiomas.',
      tagline: 'Subtítulos bilingües con colores alineados para aprender idiomas con video real.',
      highlights: ['99 % de subtítulos traducidos en un episodio de 23,7 min', '89 % de cobertura de alineación (688 grupos)', 'Re-render desde caché en menos de 1 s', 'Web local solo en loopback y a prueba de path traversal'],
      how: ['ffmpeg extrae el audio; Whisper (MLX en Apple Silicon, CPU como respaldo) transcribe con tiempos por palabra.', 'Las palabras se agrupan en subtítulos legibles y se traducen con cualquier LLM compatible con OpenAI usando JSON estructurado.', 'Una etapa de alineación empareja frases original ↔ traducción; cada grupo se valida antes de usarse.', 'El render escribe .ass/.srt/.json con colores compartidos, layout apilado o en columnas y romaji opcional.'],
      built: ['Primero la especificación y un contrato de decisiones; supuestos verificados con datos reales.', 'Seis etapas puras e idempotentes con caché por huella y escrituras atómicas.', 'Ajustado con mediciones: lotes de 20 (40 truncaba el JSON), límites de largo por idioma, color de relleno en vez de borde.'],
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
  {
    slug: 'n8n-pilots', name: 'n8n Automation Pilots', accent: '#22c55e',
    image: null,
    tags: ['n8n', 'APIs', 'AI workflows'],
    links: [],
    en: { context: 'Practice/pilot automations.', tagline: 'Pilot workflow automations integrating APIs and AI steps.', highlights: ['Workflow design in n8n', 'API integrations', 'LLM steps inside workflows'], how: ['Pilot automations built in n8n that connect external APIs with AI steps.'], built: ['Practice/pilot projects; detailed case studies are not published yet.'] },
    es: { context: 'Automatizaciones de práctica/piloto.', tagline: 'Automatizaciones piloto que integran APIs y pasos con IA.', highlights: ['Diseño de flujos en n8n', 'Integración de APIs', 'Pasos con LLM dentro de los flujos'], how: ['Automatizaciones piloto en n8n que conectan APIs externas con pasos de IA.'], built: ['Proyectos de práctica/piloto; los casos detallados aún no están publicados.'] },
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
