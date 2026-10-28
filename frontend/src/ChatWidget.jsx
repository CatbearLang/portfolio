import { useEffect, useRef, useState } from 'react'
import { localAnswer } from './localAssistant.js'

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export default function ChatWidget({ lang, t, open, setOpen }) {
  const [status, setStatus] = useState(API ? 'checking' : 'local') // checking | online | local
  const [msgs, setMsgs] = useState([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef(null)

  useEffect(() => {
    if (!open || status === 'online') return
    if (!API) { setStatus('local'); return }
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 4000)
    fetch(`${API}/api/health`, { signal: ctl.signal }).then(r => setStatus(r.ok ? 'online' : 'local')).catch(() => setStatus('local')).finally(() => clearTimeout(timer))
  }, [open])
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }) }, [msgs, busy])

  async function ask(text) {
    const question = (text ?? q).trim()
    if (question.length < 2 || busy) return
    setQ(''); setMsgs(m => [...m, { role: 'user', text: question }]); setBusy(true)
    const local = () => { const d = localAnswer(question, lang); setMsgs(m => [...m, { role: 'bot', text: d.answer, sources: d.sources }]) }
    if (status !== 'online') { setTimeout(() => { local(); setBusy(false) }, 250); return }
    try {
      const r = await fetch(`${API}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, lang }) })
      if (!r.ok) throw new Error()
      const d = await r.json()
      setMsgs(m => [...m, { role: 'bot', text: d.answer, sources: d.sources }])
    } catch { setStatus('local'); local() }
    finally { setBusy(false) }
  }


  return (
    <>
      <button className="fab" onClick={() => setOpen(!open)} aria-label={t.title} aria-expanded={open}>{open ? '×' : <><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg><span>{t.title}</span></>}</button>
      {open && (
        <div className="chat" role="dialog" aria-label={t.title}>
          <div className="chat-head"><div><b>{t.title}</b><small><i className={`dot ${status}`} />{status === 'online' ? 'LangGraph · RAG' : status === 'local' ? t.localMode : '…'}</small></div></div>
          <div className="chat-body" aria-live="polite">
            <p className="hint">{t.hint}</p>
            {msgs.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                <span style={{ whiteSpace: 'pre-line' }}>{m.text}</span>
                {m.sources?.length > 0 && <div className="srcs">{t.sources}: {m.sources.map(s => <span key={s.id} title={s.title}>[{s.id}] {s.source}</span>)}</div>}
              </div>))}
            {busy && <div className="msg bot typing">{t.thinking}</div>}
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
