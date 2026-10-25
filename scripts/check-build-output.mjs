import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'

// Grows in plan 2 and 3 as pages are ported. A file listed here that is absent
// from dist is a routing regression, not a missing feature.
const REQUIRED = [
  'index.html',
  '404.html',
  'robots.txt',
  'sitemap-index.xml',
  // build.format 'file' names the page de/releases.html and serves it at /de/releases.
  'de/releases.html',
  'en/releases.html',
  // The oldest release never changes, which makes it a stable anchor.
  'de/releases/v0.1.0.html',
  'en/releases/v0.1.0.html',
  'de/impressum.html',
  'en/impressum.html',
  'de/datenschutz.html',
  'en/datenschutz.html',
  'de/contact.html',
  'en/contact.html',
  'de/product.html',
  'en/product.html',
  'de/services.html',
  'en/services.html',
  'de/streamlet.html',
  'en/streamlet.html',
  'de/blog.html',
  'en/blog.html',
  // The first article is the oldest, which makes it a stable anchor.
  'de/blog/erste-sensoren-im-boden.html',
  'en/blog/erste-sensoren-im-boden.html',
  'de/rss.xml',
  'en/rss.xml',
  'de/releases/rss.xml',
  'en/releases/rss.xml',
  // build.format 'file' names the start page de.html, not de/index.html.
  'de.html',
  'en.html',
]

// Mirrors MISSING_PREFIX in src/i18n/resolve.ts.
const MISSING_KEY = /\?\?([\w]+(?:\.[\w]+)*)/g

// Script bodies are stripped before scanning: the JS nullish operator ('a ?? b')
// is spelled the same as the marker, and legal:translationNotice proves keys are
// not always dotted, so the pattern alone cannot tell them apart.
const SCRIPT_BLOCK = /<script\b[^>]*>[\s\S]*?<\/script>/gi

const problems = []

for (const file of REQUIRED) {
  try {
    statSync(join(DIST, file))
  } catch {
    problems.push(`fehlende Datei: ${file}`)
  }
}

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return htmlFiles(path)
    return entry.name.endsWith('.html') ? [path] : []
  })
}

const pages = htmlFiles(DIST)

for (const path of pages) {
  const html = readFileSync(path, 'utf8').replace(SCRIPT_BLOCK, '')
  // The resolver emits this marker instead of throwing, so an unresolved key
  // would reach the page silently. This is where it gets caught.
  for (const match of new Set([...html.matchAll(MISSING_KEY)].map((hit) => hit[1]))) {
    problems.push(`${path}: unaufgelöster Schlüssel ??${match}`)
  }
}

if (problems.length > 0) {
  console.error(`Build-Prüfung fehlgeschlagen, ${problems.length} Problem(e):`)
  for (const problem of problems) {
    console.error(`  ${problem}`)
  }
  process.exit(1)
}

console.log(`Build-Prüfung in Ordnung, ${pages.length} HTML-Datei(en) geprüft.`)
