import { useEffect, useRef, useState } from 'react'
import { localAnswer } from './localAssistant.js'
import { parseCommands } from './intents.js'
import { runActions } from './pageActions.js'
import suggested from './suggested.json'

const MAX_Q = 300
const keyOf = (q, l) => `${l}:${q.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean).join(' ')}`
const PRE = Object.fromEntries(suggested.map(i => [keyOf(i.question, i.lang), i.response]))

function Trace({ m, t }) {
  if (!m.trace?.length && !m.sources?.some(s => s.snippet)) return null
  return (
    <details className="trace">
      <summary>{t.trace}{m.cached ? ` · ${m.cached === 'suggested' ? t.cachedNote : t.lruNote}` : ''}</summary>
      <ol>{(m.trace || []).map((s, i) => <li key={i}><b>{s.node}</b>: {s.detail}
        {s.hits?.length > 0 && <ul>{s.hits.map((h, j) => <li key={j}>[{j + 1}] {h.title} <code>{h.score}</code></li>)}</ul>}</li>)}</ol>
      {m.sources?.some(s => s.snippet) && <><p className="trace-h">{t.sourcesTitle}</p>
        {m.sources.map(s => <blockquote key={s.id}><b>[{s.id}] {s.title}</b><br />{s.snippet}{s.snippet.length >= 400 ? '…' : ''}</blockquote>)}</>}
    </details>)
}

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

// Plain text -> clickable links (+ **bold**), no HTML injection.
function Rich({ text }) {
  const parts = String(text).split(/(https?:\/\/[^\s)\]]+|\*\*[^*]+\*\*)/g)
  return parts.map((p, i) => /^https?:\/\//.test(p)
    ? <a key={i} href={p.replace(/[.,;:]+$/, '')} target="_blank" rel="noopener noreferrer">{p}</a>
    : /^\*\*[^*]+\*\*$/.test(p) ? <b key={i}>{p.slice(2, -2)}</b> : p)
}

const narrow = () => window.matchMedia?.('(max-width: 760px)').matches

export default function ChatWidget({ lang, t: tAll, open, setOpen, seed }) {
  const t = tAll.chat
  const [status, setStatus] = useState(API ? 'checking' : 'local') // checking | online | local
  const [msgs, setMsgs] = useState([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const body = useRef(null)
  const last = useRef(null)
  const tRef = useRef(tAll)
  tRef.current = tAll

  // Wake the free backend as soon as the page loads (not when the chat opens), so it is ready by the first question.
  const ping = () => {
    if (!API) { setStatus('local'); return }
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 75000) // free server may be waking up (~1 min)
    fetch(`${API}/api/health`, { signal: ctl.signal }).then(r => setStatus(r.ok ? 'online' : 'local')).catch(() => setStatus('local')).finally(() => clearTimeout(timer))
  }
  useEffect(ping, [])
  useEffect(() => { if (open && status === 'local' && API) ping() }, [open])
  // While waiting, keep the question and the typing line in view. When an answer arrives, show it from its
  // first line (not the bottom of the chat), so a long answer can be read top to bottom without scrolling up.
  useEffect(() => {
    const box = body.current
    if (!box) return
    const behavior = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    const el = last.current
    if (busy || !el || msgs[msgs.length - 1]?.role !== 'bot') { box.scrollTo({ top: box.scrollHeight, behavior }); return }
    const top = box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top - 8
    box.scrollTo({ top: Math.max(0, top), behavior })
  }, [msgs, busy, open])
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(''), 4500); return () => clearTimeout(id) }, [toast])

  async function perform(actions, extra) {
    // On phones the chat covers the page: get out of the way so the visitor sees the cursor work.
    const hide = narrow()
    if (hide) setOpen(false)
    await new Promise(r => setTimeout(r, hide ? 250 : 0))
    let text = ''
    try { text = await runActions(actions, tRef.current) } catch { text = '' }
    if (hide && text) setToast(text)
    setMsgs(m => [...m, { role: 'bot', text: text || extra.fallbackText || '', actions, ...extra }])
  }

  async function ask(text) {
    const question = (text ?? q).trim()
    if (question.length < 2 || busy) return
    if (question.length > MAX_Q) { setMsgs(m => [...m, { role: 'user', text: question.slice(0, 80) + '…' }, { role: 'bot', text: t.tooLong, local: true }]); return }
    setQ('')
    const pre = PRE[keyOf(question, lang)]
    if (pre) { setMsgs(m => [...m, { role: 'user', text: question }, { role: 'bot', text: pre.answer, sources: pre.sources, trace: pre.trace, cached: 'suggested' }]); return }
    setMsgs(m => [...m, { role: 'user', text: question }]); setBusy(true)
    const commands = parseCommands(question, lang)
    const localCmd = () => perform(commands, { local: true, cmd: true, trace: [{ node: 'browser', detail: t.localTrace }] })
    const local = () => { const d = localAnswer(question, lang); setMsgs(m => [...m, { role: 'bot', text: d.answer, sources: d.sources, local: Boolean(API) }]) }
    try {
      // Server not ready (asleep, waking up or unreachable): obvious page commands run right away in the browser.
      if (commands.length && status !== 'online') { await localCmd(); return }
      if (!API) { await new Promise(r => setTimeout(r, 250)); local(); return }
      // Conversation memory: last 6 AI turns (fallback answers are not sent back).
      const history = msgs.filter(m => !m.local && !m.limited).slice(-6).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', text: m.text.slice(0, 1500) }))
      const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), status === 'online' ? 60000 : 90000)
      let d
      try {
        const r = await fetch(`${API}/api/chat`, { method: 'POST', signal: ctl.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, lang, history }) })
        if (!r.ok) throw new Error()
        d = await r.json()
        setStatus('online')
      } catch { setStatus('local'); if (commands.length) await localCmd(); else local(); return } finally { clearTimeout(timer) }
      if (d.actions?.length) { await perform(d.actions, { trace: d.trace, cached: d.cached, fallbackText: d.answer }); return }
      // Out of free quota, or the model answered without a page tool: the in-browser matcher still handles commands.
      if (commands.length && (d.limited || !d.sources?.length)) { await localCmd(); return }
      setMsgs(m => [...m, { role: 'bot', text: d.answer, sources: d.sources, trace: d.trace, cached: d.cached, limited: d.limited }])
    } finally { setBusy(false) }
  }

  // A question sent from the box at the top of the page opens the chat and is asked here.
  useEffect(() => { if (seed?.q) ask(seed.q) }, [seed?.n])

  const unused = list => list.filter(s => !msgs.some(m => m.role === 'user' && m.text === s))
  // After the first message, suggestions shrink to one row above the input, outside the conversation.
  const followUps = [...unused(t.commands).slice(0, 2).map(s => [s, true]), ...unused(t.suggestions).slice(0, 4).map(s => [s, false])]
  return (
    <>
      {toast && !open && <div className="chat-toast" role="status">{toast}</div>}
      <button className="fab" onClick={() => setOpen(!open)} aria-label={t.title} aria-expanded={open}>{open ? '×' : <><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg><span>{t.title}</span></>}</button>
      {open && (
        <div className="chat" role="dialog" aria-label={t.title}>
          <div className="chat-head"><div><b>{t.title}</b><small><i className={`dot ${status}`} />{status === 'online' ? t.aiMode : status === 'local' ? t.localMode : t.waking}</small></div></div>
          <div className="chat-body" aria-live="polite" ref={body}>
            <p className="hint">{t.hint}</p>
            {msgs.map((m, i) => (
              <div key={i} ref={i === msgs.length - 1 ? last : null} className={`msg ${m.role}${m.actions ? ' did' : ''}`}>
                {m.local && !m.cmd && <small className="fallback">{t.fallbackNote}</small>}
                {m.cmd && <small className="fallback">{t.localCmd}</small>}
                <span style={{ whiteSpace: 'pre-line' }}><Rich text={m.text} /></span>
                <Trace m={m} t={t} />
                {(() => { const n = [...new Set((m.sources || []).map(s => (s.source || '').replace(/\.md$/, '')).filter(Boolean))]; return n.length > 0 && <div className="srcs">{t.sources}: {n.map(x => <span key={x}>{x}</span>)}</div> })()}
              </div>))}
            {busy && <div className="msg bot typing">{status === 'checking' ? t.waking : t.thinking}</div>}
            {!busy && msgs.length === 0 && <div className="sugg">
              {unused(t.commands).length > 0 && <><small>{t.commandsLabel}</small>{unused(t.commands).map(s => <button key={s} className="cmd" onClick={() => ask(s)}>{s}</button>)}</>}
              {unused(t.suggestions).length > 0 && <><small>{t.questionsLabel}</small>{unused(t.suggestions).map(s => <button key={s} onClick={() => ask(s)}>{s}</button>)}</>}
            </div>}
          </div>
          {!busy && msgs.length > 0 && followUps.length > 0 && <div className="sugg-row" aria-label={t.questionsLabel}>
            {followUps.map(([s, cmd]) => <button key={s} title={s} className={cmd ? "cmd" : undefined} onClick={() => ask(s)}>{s}</button>)}
          </div>}
          <form className="chat-input" onSubmit={e => { e.preventDefault(); ask() }}>
            <input aria-label={t.placeholder} value={q} onChange={e => setQ(e.target.value)} placeholder={t.placeholder} maxLength={MAX_Q} />
            <button disabled={busy}>{t.send}</button>
          </form>
          <small className="limit-note">{t.limitNote}{q.length > 200 ? ` · ${q.length}/${MAX_Q}` : ''}</small>
        </div>)}
    </>
  )
}
