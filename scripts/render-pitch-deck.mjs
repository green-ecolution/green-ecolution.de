// Renders the slide previews for the press page from the pitch deck PDF.
//
// The source is the same bucket object the download button links to, so the
// strip on the page can never show a different deck than the one visitors get.
// Run it after replacing that object:
//
//   node scripts/render-pitch-deck.mjs
//
// Needs pdftoppm from poppler on PATH. That stays a local requirement on
// purpose: the build and CI never render anything, so the container image does
// not have to carry poppler.

import { execFileSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PDF_URL =
  'https://green-ecolution-public-videos.s3.de.io.cloud.ovh.net/press/pitch-deck/green-ecolution-pitch-deck.pdf'

// 1280px wide covers the largest slide the strip renders at twice over, which
// is what astro needs to emit a sharp 2x variant.
const RENDER_WIDTH = 1280
const JPEG_QUALITY = 82

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const targetDir = join(root, 'src', 'assets', 'press', 'pitch-deck')

function requirePdftoppm() {
  try {
    execFileSync('pdftoppm', ['-v'], { stdio: 'pipe' })
  } catch {
    console.error('pdftoppm not found. Install poppler and make sure it is on PATH.')
    process.exit(1)
  }
}

async function fetchPdf(into) {
  const response = await fetch(PDF_URL)
  if (!response.ok) {
    console.error(`Could not fetch the PDF: HTTP ${response.status}`)
    process.exit(1)
  }

  writeFileSync(into, Buffer.from(await response.arrayBuffer()))
  return response.headers.get('last-modified')
}

requirePdftoppm()

const work = mkdtempSync(join(tmpdir(), 'pitch-deck-'))
const pdfPath = join(work, 'deck.pdf')

try {
  const lastModified = await fetchPdf(pdfPath)

  execFileSync('pdftoppm', [
    '-jpeg',
    '-jpegopt',
    `quality=${JPEG_QUALITY}`,
    '-scale-to-x',
    String(RENDER_WIDTH),
    '-scale-to-y',
    '-1',
    pdfPath,
    join(work, 'slide'),
  ])

  const rendered = readdirSync(work)
    .filter((entry) => entry.startsWith('slide-') && entry.endsWith('.jpg'))
    .sort()

  if (rendered.length === 0) {
    console.error('pdftoppm wrote no pages.')
    process.exit(1)
  }

  mkdirSync(targetDir, { recursive: true })
  // Dropping the old set first means a shorter deck cannot leave orphaned
  // slides behind, which the glob in the component would happily render.
  for (const stale of readdirSync(targetDir).filter((entry) => entry.endsWith('.jpg'))) {
    rmSync(join(targetDir, stale))
  }

  let bytes = 0
  for (const slide of rendered) {
    const destination = join(targetDir, slide)
    renameSync(join(work, slide), destination)
    bytes += statSync(destination).size
  }

  const megabytes = (bytes / 1024 / 1024).toFixed(1)
  console.log(`Rendered ${rendered.length} slides (${megabytes} MB) to src/assets/press/pitch-deck`)
  console.log(`Source: PDF last modified ${lastModified ?? 'unknown'}`)
} finally {
  rmSync(work, { recursive: true, force: true })
}
