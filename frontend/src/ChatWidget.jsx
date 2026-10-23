import { useEffect, useRef, useState } from 'react'
import { EMAIL } from './content.js'

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export default function ChatWidget({ lang, t, open, setOpen }) {
  const [status, setStatus] = useState('checking') // checking | online | offline
  const [msgs, setMsgs] = useState([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef(null)

  useEffect(() => {
    if (!open || status === 'online') return
    if (!API) { setStatus('offline'); return }
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 4000)
    fetch(`${API}/api/health`, { signal: ctl.signal }).then(r => setStatus(r.ok ? 'online' : 'offline')).catch(() => setStatus('offline')).finally(() => clearTimeout(timer))
  }, [open])
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }) }, [msgs, busy])

  async function ask(text) {
    const question = (text ?? q).trim()
    if (question.length < 2 || busy) return
    setQ(''); setMsgs(m => [...m, { role: 'user', text: question }]); setBusy(true)
    try {
      const r = await fetch(`${API}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, lang }) })
      if (!r.ok) throw new Error()
      const d = await r.json()
      setMsgs(m => [...m, { role: 'bot', text: d.answer, sources: d.sources }])
    } catch { setStatus('offline'); setMsgs(m => [...m, { role: 'bot', offline: true }]) }
    finally { setBusy(false) }
  }

  const offlineMsg = <span>{t.offline} <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.</span>

  return (
    <>
      <button className="fab" onClick={() => setOpen(!open)} aria-label={t.title}>{open ? '×' : '💬'}</button>
      {open && (
        <div className="chat" role="dialog" aria-label={t.title}>
          <div className="chat-head"><div><b>{t.title}</b><small><i className={`dot ${status}`} />{status === 'online' ? 'LangGraph · RAG' : status}</small></div></div>
          <div className="chat-body">
            <p className="hint">{t.hint}</p>
            {status === 'offline' && msgs.length === 0 && <div className="msg bot">{offlineMsg}</div>}
            {msgs.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                {m.offline ? offlineMsg : m.text}
                {m.sources?.length > 0 && <div className="srcs">{t.sources}: {m.sources.map(s => <span key={s.id} title={s.title}>[{s.id}] {s.source}</span>)}</div>}
              </div>))}
            {busy && <div className="msg bot typing">{t.thinking}</div>}
            {status !== 'offline' && msgs.length === 0 && <div className="sugg">{t.suggestions.map(s => <button key={s} onClick={() => ask(s)}>{s}</button>)}</div>}
            <div ref={end} />
          </div>
          <form className="chat-input" onSubmit={e => { e.preventDefault(); ask() }}>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={t.placeholder} maxLength={500} disabled={status === 'offline'} />
            <button disabled={busy || status === 'offline'}>{t.send}</button>
          </form>
        </div>)}
    </>
  )
}
