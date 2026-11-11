// Every media path a project lists must exist in public/, so a page never points at a missing file.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { projects } from '../src/content.js'

const local = s => typeof s === 'string' && !/^https?:/.test(s)

test('project media files exist in public/', () => {
  const missing = []
  for (const p of projects) {
    const paths = [p.image, p.icon, p.video, p.poster, ...(p.gallery || []).map(g => g[0]), ...(p.scenes || []).map(g => g[0]), ...(p.audio || []).map(a => a[0])]
    for (const src of paths.filter(local)) {
      if (!existsSync(new URL(`../public/${src}`, import.meta.url))) missing.push(`${p.slug}: ${src}`)
    }
  }
  assert.deepEqual(missing, [])
})
