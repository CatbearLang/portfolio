// Illustrations drawn in SVG with theme colors (light/dark), used as project covers and the architecture diagram.

export function Cover({ kind, title }) {
  if (kind === 'assistant') return <AssistantCover title={title} />
  if (kind === 'reader') return <ReaderCover title={title} />
  return <div className="thumb-fallback">{title}</div>
}

function AssistantCover({ title }) {
  return (
    <svg className="cover" viewBox="0 0 840 320" role="img" aria-label={title} preserveAspectRatio="xMidYMid slice">
      <rect width="840" height="320" className="cv-bg" />
      <g className="cv-grid">{Array.from({ length: 14 }, (_, i) => <line key={i} x1={i * 64} y1="0" x2={i * 64} y2="320" />)}</g>
      <g transform="translate(70 58)">
        <rect width="300" height="204" rx="14" className="cv-panel" />
        <rect x="18" y="18" width="190" height="34" rx="10" className="cv-bubble" />
        <rect x="92" y="66" width="190" height="34" rx="10" className="cv-bubble-me" />
        <rect x="18" y="114" width="230" height="52" rx="10" className="cv-bubble" />
        <rect x="30" y="128" width="150" height="7" rx="3.5" className="cv-line" />
        <rect x="30" y="144" width="110" height="7" rx="3.5" className="cv-line" />
        <rect x="186" y="140" width="22" height="14" rx="4" className="cv-accent" />
        <rect x="18" y="180" width="264" height="10" rx="5" className="cv-line" opacity=".5" />
      </g>
      <g transform="translate(450 70)" className="cv-graph">
        <path d="M30 20 H140 M170 20 H280 M155 36 V82 M155 112 V158 M140 97 H40 M40 112 V158" className="cv-edge" />
        {[[0, 0, 'prefilter'], [125, 0, 'agent'], [250, 0, 'tools'], [125, 82, 'grade'], [0, 82, 'answer'], [0, 158, 'check'], [125, 158, 'page']].map(([x, y, n]) => (
          <g key={n} transform={`translate(${x} ${y})`}><rect width="62" height="34" rx="8" className={n === 'agent' || n === 'page' ? 'cv-node hot' : 'cv-node'} /><text x="31" y="21">{n}</text></g>))}
      </g>
      <g transform="translate(700 236)"><path d="M0 0l16 10-7 1.5 4 8-3 1.5-4-8L0 18z" className="cv-cursor" /></g>
    </svg>
  )
}

function ReaderCover({ title }) {
  const bars = [10, 22, 34, 18, 40, 28, 14, 36, 24, 44, 20, 30, 12, 26, 38, 16]
  return (
    <svg className="cover" viewBox="0 0 840 320" role="img" aria-label={title} preserveAspectRatio="xMidYMid slice">
      <rect width="840" height="320" className="cv-bg" />
      <g className="cv-stars">{[[80, 50], [160, 250], [300, 40], [520, 280], [760, 60], [690, 210], [430, 30], [40, 180]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 2 : 3} />)}</g>
      <g transform="translate(110 40)">
        <rect width="150" height="240" rx="22" className="cv-panel" />
        <rect x="14" y="26" width="122" height="188" rx="6" className="cv-bubble" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => <rect key={i} x="26" y={42 + i * 18} width={i % 3 === 2 ? 70 : 98} height="6" rx="3" className={i === 3 ? 'cv-accent' : 'cv-line'} />)}
        <circle cx="75" cy="196" r="9" className="cv-accent" />
      </g>
      <g transform="translate(330 160)" className="cv-wave">
        {bars.map((h, i) => <rect key={i} x={i * 22} y={-h} width="10" height={h * 2} rx="5" className={i > 4 && i < 11 ? 'cv-accent' : 'cv-line'} />)}
      </g>
      <g transform="translate(700 118)">
        <circle r="44" className="cv-node" />
        <path d="M-14 -10 a18 18 0 1 0 22 26 a14 14 0 1 1 -22 -26z" className="cv-accent" transform="translate(2 -4)" />
      </g>
    </svg>
  )
}

const BOX = 172, H = 46
function Box({ x, y, title, sub, hot }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={BOX} height={H} rx="9" className={hot ? 'dg-box hot' : 'dg-box'} />
      <text x={BOX / 2} y={sub ? 19 : 28} className="dg-t">{title}</text>
      {sub && <text x={BOX / 2} y="35" className="dg-s">{sub}</text>}
    </g>
  )
}

export function Diagram({ lang }) {
  const es = lang === 'es'
  const cols = [10, 205, 400, 595]
  const A = 34, B = 140, C = 246
  return (
    <figure className="diagram">
      <svg viewBox="0 0 800 320" role="img" aria-label={es ? 'Diagrama de arquitectura del asistente' : 'Assistant architecture diagram'}>
        <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" className="dg-head" /></marker></defs>
        <text x="10" y="18" className="dg-cap">{es ? 'Navegador → API → grafo de LangGraph' : 'Browser → API → LangGraph graph'}</text>
        <Box x={cols[0]} y={A} title="React (browser)" sub={es ? 'chat + página' : 'chat + page'} />
        <Box x={cols[1]} y={A} title="FastAPI" sub={es ? 'límites · caché' : 'limits · cache'} />
        <Box x={cols[2]} y={A} title="prefilter" sub={es ? 'regex: inyección, datos' : 'regex: injection, data'} />
        <Box x={cols[3]} y={A} title="agent" sub="LLM + bind_tools" hot />
        {[0, 1, 2].map(i => <path key={i} d={`M${cols[i] + BOX} ${A + H / 2} H${cols[i + 1] - 4}`} className="dg-edge" markerEnd="url(#arr)" />)}

        <Box x={cols[3]} y={B} title="search_portfolio_docs" sub="BM25 + model2vec · FAISS" />
        <Box x={cols[2]} y={B} title="grade_documents" sub={es ? 'reescribe ×1 si nada sirve' : 'rewrite ×1 if none fit'} />
        <Box x={cols[1]} y={B} title="answer" sub={es ? 'solo fuentes, cita [n]' : 'sources only, cites [n]'} />
        <Box x={cols[0]} y={B} title="check" sub={es ? '¿respaldada? reintento ×1' : 'grounded? retry ×1'} />
        <path d={`M${cols[3] + 60} ${A + H} V${B - 4}`} className="dg-edge" markerEnd="url(#arr)" />
        {[3, 2, 1].map(i => <path key={i} d={`M${cols[i]} ${B + H / 2} H${cols[i - 1] + BOX + 4}`} className="dg-edge" markerEnd="url(#arr)" />)}
        <path d={`M${cols[0] + 86} ${B} V${A + H + 4}`} className="dg-edge" markerEnd="url(#arr)" />
        <text x={cols[0] + 94} y={B - 22} className="dg-s left">{es ? 'respuesta + fuentes + traza' : 'answer + sources + trace'}</text>

        <Box x={cols[3]} y={C} title={es ? 'herramientas de página' : 'page tools'} sub="set_theme · open_project…" hot />
        <Box x={cols[2]} y={C} title={es ? 'lista permitida' : 'whitelist'} sub={es ? 'valida tipo y valor' : 'validates type and value'} />
        <Box x={cols[1]} y={C} title={es ? 'el navegador ejecuta' : 'browser runs it'} sub={es ? 'cursor → resalta → clic' : 'cursor → highlight → click'} />
        <path d={`M${cols[3] + BOX} ${A + H / 2 + 10} H788 V${C + H / 2} H${cols[3] + BOX + 4}`} className="dg-edge hot" markerEnd="url(#arr)" />
        {[3, 2].map(i => <path key={i} d={`M${cols[i]} ${C + H / 2} H${cols[i - 1] + BOX + 4}`} className="dg-edge hot" markerEnd="url(#arr)" />)}
        <text x={cols[0]} y={C + 20} className="dg-s left">{es ? '1 llamada al LLM' : '1 LLM call'}</text>
        <text x={cols[0]} y={C + 38} className="dg-s left">{es ? 'sin servidor: detección' : 'server asleep: in-browser'}</text>
        <text x={cols[0]} y={C + 54} className="dg-s left">{es ? 'de comandos en el navegador' : 'command matching'}</text>
      </svg>
    </figure>
  )
}
