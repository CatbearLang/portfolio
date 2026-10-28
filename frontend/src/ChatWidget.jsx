import { useEffect, useRef, useState } from 'react'
import { localAnswer } from './localAssistant.js'

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

// Plain text -> clickable links (+ **bold**), no HTML injection.
function Rich({ text }) {
  const parts = String(text).split(/(https?:\/\/[^\s)\]]+|\*\*[^*]+\*\*)/g)
  return parts.map((p, i) => /^https?:\/\//.test(p)
    ? <a key={i} href={p.replace(/[.,;:]+$/, '')} target="_blank" rel="noopener noreferrer">{p}</a>
    : /^\*\*[^*]+\*\*$/.test(p) ? <b key={i}>{p.slice(2, -2)}</b> : p)
}

export default function ChatWidget({ lang, t, open, setOpen }) {
  const [status, setStatus] = useState(API ? 'checking' : 'local') // checking | online | local
  const [msgs, setMsgs] = useState([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef(null)

  useEffect(() => {
    if (!open || status === 'online') return
    if (!API) { setStatus('local'); return }
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 75000) // free server may be waking up (~1 min)
    fetch(`${API}/api/health`, { signal: ctl.signal }).then(r => setStatus(r.ok ? 'online' : 'local')).catch(() => setStatus('local')).finally(() => clearTimeout(timer))
  }, [open])
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }) }, [msgs, busy])

  async function ask(text) {
    const question = (text ?? q).trim()
    if (question.length < 2 || busy) return
    setQ(''); setMsgs(m => [...m, { role: 'user', text: question }]); setBusy(true)
    const local = () => { const d = localAnswer(question, lang); setMsgs(m => [...m, { role: 'bot', text: d.answer, sources: d.sources, local: Boolean(API) }]) }
    if (!API) { setTimeout(() => { local(); setBusy(false) }, 250); return }
    // Conversation memory: last 6 AI turns (fallback answers are not sent back).
    const history = msgs.filter(m => !m.local).slice(-6).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', text: m.text.slice(0, 1500) }))
    // Always try the real backend (it may have woken up); fall back only for this message.
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), status === 'online' ? 60000 : 90000)
    try {
      const r = await fetch(`${API}/api/chat`, { method: 'POST', signal: ctl.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, lang, history }) })
      if (!r.ok) throw new Error()
      const d = await r.json()
      setStatus('online')
      setMsgs(m => [...m, { role: 'bot', text: d.answer, sources: d.sources }])
    } catch { setStatus('local'); local() }
    finally { clearTimeout(timer); setBusy(false) }
  }


  return (
    <>
      <button className="fab" onClick={() => setOpen(!open)} aria-label={t.title} aria-expanded={open}>{open ? '×' : <><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg><span>{t.title}</span></>}</button>
      {open && (
        <div className="chat" role="dialog" aria-label={t.title}>
          <div className="chat-head"><div><b>{t.title}</b><small><i className={`dot ${status}`} />{status === 'online' ? t.aiMode : status === 'local' ? t.localMode : '…'}</small></div></div>
          <div className="chat-body" aria-live="polite">
            <p className="hint">{t.hint}</p>
            {msgs.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                {m.local && <small className="fallback">{t.fallbackNote}</small>}
                <span style={{ whiteSpace: 'pre-line' }}><Rich text={m.text} /></span>
                {(() => { const n = [...new Set((m.sources || []).map(s => (s.source || '').replace(/\.md$/, '')).filter(Boolean))]; return n.length > 0 && <div className="srcs">{t.sources}: {n.map(x => <span key={x}>{x}</span>)}</div> })()}
              </div>))}
            {busy && <div className="msg bot typing">{status !== 'online' ? t.waking : t.thinking}</div>}
            {status === 'checking' && !busy && msgs.length === 0 && <p className="hint">{t.waking}</p>}
            {msgs.length === 0 && <div className="sugg">{t.suggestions.map(s => <button key={s} onClick={() => ask(s)}>{s}</button>)}</div>}
            <div ref={end} />
          </div>
          <form className="chat-input" onSubmit={e => { e.preventDefault(); ask() }}>
            <input aria-label={t.placeholder} value={q} onChange={e => setQ(e.target.value)} placeholder={t.placeholder} maxLength={500} />
            <button disabled={busy}>{t.send}</button>
          </form>
        </div>)}
    </>
  )
}
