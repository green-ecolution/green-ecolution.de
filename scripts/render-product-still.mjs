// Photographs the town of the product page off the dev server, for the poster
// that stands in the stage until the 3d scene has loaded.
//   node scripts/render-product-still.mjs
import { statSync } from 'node:fs'
import { openPage, sleep } from './lib/headlessPage.mjs'

const base = process.env.PRODUCT_URL ?? 'http://localhost:4321/de/product'
const file = process.argv[2] ?? 'src/assets/illustrations/product-town-poster.png'
const width = 1500
const height = 1000

const page = await openPage({ width, height })
try {
  await page.goto(`${base}?dayStill`)
  await page.waitFor(
    `document.querySelector('[data-day-stage] [data-ready="true"]') !== null`,
    'the town (is the dev server running, does webgl work?)',
  )
  // Lets the fade-in and the pins finish.
  await sleep(2000)
  await page.screenshot(file)
  // A picture without the town is a plain colour and compresses to almost nothing.
  if (statSync(file).size < width * height * 0.05) throw new Error('the picture looks empty')
  console.log(file)
} finally {
  page.close()
}
