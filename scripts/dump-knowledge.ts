import { createRequire } from 'module'
import { writeFileSync } from 'fs'

// Allow importing server-only modules outside Next.js
const require = createRequire(import.meta.url)
const Module = require('module') as typeof import('module') & {
  _load: (request: string, parent: unknown, isMain: boolean) => unknown
}
const origLoad = Module._load
Module._load = function (request, parent, isMain) {
  if (request === 'server-only') return {}
  return origLoad.call(this, request, parent, isMain)
}

async function main() {
  const { getKnowledgeBlob } = await import('../lib/chat/knowledge')
  const blob = await getKnowledgeBlob()
  writeFileSync('knowledge-dump.txt', blob)
  const chars = blob.length
  const approxTokens = Math.round(chars / 4)
  console.log(`Total chars: ${chars.toLocaleString()}`)
  console.log(`Approx tokens: ${approxTokens.toLocaleString()}`)
  // Print section headers found, to confirm all sections assembled
  const headers = blob.split('\n').filter((l) => l.startsWith('## '))
  console.log('\nSections assembled:')
  headers.forEach((h) => console.log('  ' + h))
}
main().catch((e) => { console.error(e); process.exit(1) })
