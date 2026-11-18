// Drives the sections below the town of the product page in a headless
// browser and checks what stills cannot show: the requirements stay in the
// window, the roadmap's rings grow with the scroll and stand full-grown
// without motion, and the links stay in the window.
//   node scripts/probe-product-page.mjs [outDir]
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { openPage, sleep } from './lib/headlessPage.mjs'

const base = process.env.PRODUCT_URL ?? 'http://localhost:4321/de/product'
const out = process.argv[2] ?? join(process.env.TMPDIR ?? '/tmp', 'product-page-probe')
mkdirSync(out, { recursive: true })

const sizes = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'ipad', width: 1194, height: 702 },
  { name: 'phone', width: 390, height: 664, mobile: true, scale: 2 },
]

const COUNTS = `[...document.querySelectorAll('#requirements ul')].map((list) => list.children.length).join()`
const RINGS = `document.querySelector('[data-roadmap-rings]')`
const DISC = `document.querySelector('[data-roadmap-disc]')`
const GROWN = `Number(${RINGS}.style.getPropertyValue('--grow') || 1)`
const ENTRIES = `[...document.querySelectorAll('[data-roadmap-rings] [data-entry]')]`
// How far each entry's middle stands from the end of its leader, in px.
const LEADER_GAPS = `${ENTRIES}.map((entry) => {
  const leader = document.querySelector(\`[data-leader="\${entry.dataset.entry}"] path\`)
  const end = leader.getPointAtLength(leader.getTotalLength()).matrixTransform(leader.getScreenCTM())
  const row = entry.getBoundingClientRect()
  return Math.round(Math.abs(end.y - (row.top + row.height / 2)))
})`
const ENTRIES_OVERLAP = `${ENTRIES}.some((entry, index, all) =>
  index > 0 &&
  entry.firstElementChild.nextElementSibling.getBoundingClientRect().top <
    all[index - 1].firstElementChild.nextElementSibling.getBoundingClientRect().bottom,
)`
const OVERFLOWS = `document.documentElement.scrollWidth > innerWidth`
const failures = []
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`)
  if (!ok) failures.push(name)
}

const scrollTo = (page, expression, block = 'start') =>
  page.evaluate(`${expression}.scrollIntoView({ block: '${block}', behavior: 'instant' })`)

async function load(page, url = base) {
  await page.goto(url)
  await page.waitFor(`document.getElementById('requirements') !== null`, 'the page')
  await sleep(600)
}

for (const size of sizes) {
  const page = await openPage(size)
  try {
    await load(page)
    check(
      `${size.name}: five things are spared and three are enough`,
      (await page.evaluate(COUNTS)) === '5,3',
      await page.evaluate(COUNTS),
    )
    await scrollTo(page, `document.querySelector('#requirements ul')`, 'center')
    await sleep(300)
    await page.screenshot(join(out, `${size.name}-0-requirements.png`))
    check(
      `${size.name}: the button leads to the contact page`,
      (await page.evaluate(`document.querySelector('#requirements a').getAttribute('href')`)) ===
        new URL(base).pathname.replace(/product$/, 'contact'),
    )
    check(
      `${size.name}: the requirements stay inside the window`,
      !(await page.evaluate(OVERFLOWS)),
    )

    check(
      `${size.name}: the disc has one ring and one entry per item`,
      (await page.evaluate(
        `${ENTRIES}.length + ',' + document.querySelectorAll('[data-roadmap-disc] [data-ring]').length`,
      )) === '4,4',
    )
    check(`${size.name}: no entry runs into the next`, !(await page.evaluate(ENTRIES_OVERLAP)))
    if (size.width >= 1024) {
      const gaps = await page.evaluate(LEADER_GAPS)
      check(
        `${size.name}: every leader ends at the middle of its entry`,
        gaps.every((gap) => gap <= 2),
        gaps.join(),
      )
    }

    // The disc: as it comes in it has grown a part, once it stands in the window it is full-grown.
    await scrollTo(page, DISC, 'end')
    await sleep(500)
    const entering = await page.evaluate(GROWN)
    await page.screenshot(join(out, `${size.name}-2-rings-entering.png`))
    await page.evaluate(
      `scrollBy({ top: ${DISC}.getBoundingClientRect().bottom - innerHeight / 2, behavior: 'instant' })`,
    )
    await sleep(500)
    const grown = await page.evaluate(GROWN)
    await page.screenshot(join(out, `${size.name}-3-rings.png`))
    check(
      `${size.name}: the rings grow as the disc scrolls into the window`,
      entering > 0 && entering < 1 && grown === 1,
      `${entering} → ${grown}`,
    )
    await scrollTo(page, `document.getElementById('requirements')`)
    await sleep(500)
    check(
      `${size.name}: what has grown stays when the page scrolls back`,
      (await page.evaluate(GROWN)) === grown,
    )

    await scrollTo(page, `[...document.querySelectorAll('main a[target=_blank]')].at(-1)`, 'center')
    await sleep(400)
    await page.screenshot(join(out, `${size.name}-4-links.png`))
    check(`${size.name}: the links stay inside the window`, !(await page.evaluate(OVERFLOWS)))
  } catch (error) {
    check(`${size.name}: ${error.message}`, false)
  } finally {
    page.close()
  }
}

const anchor = await openPage(sizes[0])
try {
  await anchor.goto(`${base}#requirements`)
  await anchor.waitFor(`document.getElementById('requirements') !== null`, 'the page')
  await sleep(1500)
  const top = await anchor.evaluate(
    `document.getElementById('requirements').getBoundingClientRect().top`,
  )
  check(
    'anchor: #requirements lands on the requirements',
    top >= 0 && top < 400,
    `${Math.round(top)}`,
  )
} catch (error) {
  check(`anchor: ${error.message}`, false)
} finally {
  anchor.close()
}

const still = await openPage({ ...sizes[0], reducedMotion: true })
try {
  await load(still)
  await scrollTo(still, DISC, 'end')
  await sleep(400)
  check(
    'reduced motion: the disc stands full-grown from the start',
    (await still.evaluate(GROWN)) === 1,
  )
  await still.screenshot(join(out, 'reduced-motion-rings.png'))
} catch (error) {
  check(`reduced motion: ${error.message}`, false)
} finally {
  still.close()
}

console.log(`screenshots in ${out}`)
if (failures.length > 0) {
  console.error(`${failures.length} check(s) failed`)
  process.exit(1)
}
process.exit(0)
