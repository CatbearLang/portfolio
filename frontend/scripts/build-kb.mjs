// Bundles backend/data/knowledge/*.md into src/kb.json (chunks by "## " heading) for the in-browser assistant.
import fs from 'fs'; import path from 'path'
const dir = path.resolve('../backend/data/knowledge'); const out = []
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort()) {
  const md = fs.readFileSync(path.join(dir, f), 'utf8')
  const title = (md.match(/^# (.+)$/m) || [, f])[1].trim()
  md.split(/^## /m).forEach((sec, i) => {
    let [head, ...rest] = sec.split('\n'); let body = (i === 0 ? sec : rest.join('\n'))
    body = body.replace(/^#.*$/gm, '').replace(/^.*(email|@gmail|Leer en español).*$/gim, '').replace(/```[\s\S]*?```/g, '')
      .replace(/^\|.*\|$/gm, l => /^\|[\s-|]+\|$/.test(l) ? '' : l.split('|').map(s => s.trim()).filter(Boolean).slice(1).join(': ') + '.')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_`>]/g, '').replace(/^\s*[-•]\s*/gm, '').replace(/\n{2,}/g, '\n').trim()
    if (body.length > 40) out.push({ id: `${f.replace('.md', '')}-${i}`, title: i ? `${title} — ${head.trim()}` : title, source: f, text: body })
  })
}
fs.writeFileSync('src/kb.json', JSON.stringify(out)); console.log(out.length, 'chunks')
fs.copyFileSync('../backend/data/suggested.json', 'src/suggested.json'); console.log('suggested answers copied')
