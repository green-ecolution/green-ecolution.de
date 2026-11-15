// Drives the watering day of the product page in a headless browser and checks
// what stills cannot show: the tour runs, refills on the way, cuts into the
// ride and ends where it should.
//   node scripts/probe-product-day.mjs [outDir]
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { openPage, sleep } from './lib/headlessPage.mjs'

const base = process.env.PRODUCT_URL ?? 'http://localhost:4321/de/product'
const out = process.argv[2] ?? join(process.env.TMPDIR ?? '/tmp', 'product-day-probe')
mkdirSync(out, { recursive: true })

const sizes = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'ipad', width: 1194, height: 702 },
  { name: 'phone', width: 390, height: 664, mobile: true, scale: 2 },
]

const STATUS = `document.querySelector('#process [role=status]').textContent.trim()`
const DRY = `document.querySelectorAll('#process [data-state=dry]').length`
// Below lg the tour button exists twice, in the panel and in the strip under
// the stage; only one of them is laid out.
const button = (text) =>
  `[...document.querySelectorAll('#process button')].find((node) => node.getClientRects().length > 0 && node.textContent.includes(${JSON.stringify(text)}))`
const STRIP = `(() => {
  const strip = document.querySelector('#process [data-day-strip]')
  if (!strip || strip.getClientRects().length === 0) return null
  const { top, bottom } = strip.getBoundingClientRect()
  return {
    inView: top >= 0 && bottom <= innerHeight,
    rect: Math.round(top) + '–' + Math.round(bottom),
    text: strip.querySelector('p').textContent.trim(),
    status: ${STATUS},
  }
})()`

// Runs inside the page: polling from outside misses the short dips and status
// changes when software rendering is slow.
const RECORDER = `(() => {
  const status = document.querySelector('#process [role=status]')
  const root = document.querySelector('#process [data-day-root]')
  const record = (window.__probe = { statuses: [status.textContent.trim()], dips: 0, lowestTank: 1, dimmed: false })
  new MutationObserver(() => record.statuses.push(status.textContent.trim())).observe(status, {
    childList: true,
    characterData: true,
    subtree: true,
  })
  const sample = () => {
    const canvas = document.querySelector('#process canvas')
    const dimmed = Number(canvas?.style.opacity || 1) < 0.7
    if (dimmed && !record.dimmed) record.dips++
    record.dimmed = dimmed
    const share = Number(root.style.getPropertyValue('--day-tank') || 1)
    record.lowestTank = Math.min(record.lowestTank, share)
    requestAnimationFrame(sample)
  }
  requestAnimationFrame(sample)
})()`

const failures = []
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`)
  if (!ok) failures.push(name)
}

async function setDays(page, days) {
  await page.evaluate(`(() => {
    const slider = document.querySelector('#process input[type=range]')
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(slider, '${days}')
    slider.dispatchEvent(new Event('input', { bubbles: true }))
  })()`)
  await sleep(300)
}

async function pressEnter(page) {
  const enter = { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }
  await page.call('Input.dispatchKeyEvent', { type: 'keyDown', ...enter, text: '\r' })
  await page.call('Input.dispatchKeyEvent', { type: 'keyUp', ...enter })
}

async function moveMouse(page, x, y) {
  await page.call('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y })
}

async function clickAt(page, x, y) {
  for (const type of ['mousePressed', 'mouseReleased']) {
    await page.call('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 })
  }
}

// Samples a value until it stops changing: the camera glides, and software
// rendering makes the glide slow.
async function settled(page, expression, what) {
  let last = null
  let calm = 0
  for (let i = 0; i < 200; i++) {
    const now = await page.evaluate(expression)
    calm =
      now && last && Math.abs(now.x - last.x) < 0.5 && Math.abs(now.y - last.y) < 0.5 ? calm + 1 : 0
    if (calm >= 4) return now
    last = now
    await sleep(150)
  }
  throw new Error(`timed out waiting for ${what} to settle`)
}

async function clickButton(page, text) {
  await page.evaluate(`${button(text)}.setAttribute('data-probe-target', '')`)
  await page.click('#process [data-probe-target]')
  await page.evaluate(
    `document.querySelector('[data-probe-target]')?.removeAttribute('data-probe-target')`,
  )
}

async function load(page, size, { scene = true } = {}) {
  await page.goto(base)
  await page.waitFor(`document.getElementById('process') !== null`, 'the page')
  await page.evaluate(`document.getElementById('process').scrollIntoView({ behavior: 'instant' })`)
  await page.waitFor(
    `document.querySelector('#process astro-island:not([ssr])') !== null`,
    'the island',
  )
  if (scene) {
    await page.waitFor(
      `document.querySelector('[data-day-stage] [data-ready="true"]') !== null`,
      'the town',
    )
  }
  await sleep(1200)
  const fits = await page.evaluate(`(() => {
    const stage = document.querySelector('[data-day-stage]').getBoundingClientRect()
    return stage.width <= innerWidth && document.documentElement.scrollWidth <= innerWidth
  })()`)
  check(`${size.name}: the stage fits the window`, fits)
}

for (const size of sizes) {
  const page = await openPage(size)
  try {
    await load(page, size)
    await page.screenshot(join(out, `${size.name}-1-idle.png`))

    check(`${size.name}: six trees need water at the start`, (await page.evaluate(DRY)) === 6)
    await setDays(page, 0)
    check(`${size.name}: no tree needs water after rain`, (await page.evaluate(DRY)) === 0)
    check(
      `${size.name}: the plan button is unavailable after rain`,
      (await page.evaluate(`${button('Tour planen')}.getAttribute('aria-disabled')`)) === 'true',
    )
    await setDays(page, 9)

    await page.evaluate(RECORDER)
    await clickButton(page, 'Tour planen')
    let shot = false
    let stripOnTour = null
    // Software rendering runs the tour slower than a real machine does.
    const deadline = Date.now() + 120_000
    let status = ''
    while (Date.now() < deadline) {
      const [now, dips, dimmed] = await Promise.all([
        page.evaluate(STATUS),
        page.evaluate(`window.__probe.dips`),
        page.evaluate(`window.__probe.dimmed`),
      ])
      status = now
      if (!stripOnTour && status.startsWith('Gießt '))
        stripOnTour = { strip: await page.evaluate(STRIP) }
      if (dips >= 1 && !dimmed && !shot) {
        shot = true
        await sleep(600)
        await page.screenshot(join(out, `${size.name}-2-ride.png`))
      }
      if (status.startsWith('Fertig.')) break
      await sleep(50)
    }
    const { statuses, dips, lowestTank } = await page.evaluate(`window.__probe`)
    const watering = new Set(statuses.filter((s) => s.startsWith('Gießt ')))
    check(
      `${size.name}: the tour announces six stops with a refill`,
      statuses.some((s) => s.includes('6 Halte') && s.includes('Nachfüllen')),
    )
    check(`${size.name}: it waters trees on the way`, watering.size >= 4, `${watering.size} seen`)
    check(
      `${size.name}: it tops up on the way`,
      statuses.some((s) => s.startsWith('Füllt unterwegs auf')),
    )
    check(`${size.name}: the picture cuts into the ride and out again`, dips === 2, `${dips} dips`)
    check(`${size.name}: the tank gauge falls`, lowestTank <= 0.3, `lowest ${lowestTank}`)
    check(`${size.name}: it ends with six trees watered`, status.startsWith('Fertig. 6 Bäume'))
    check(`${size.name}: no tree needs water afterwards`, (await page.evaluate(DRY)) === 0)
    await sleep(1500)
    const stripAtEnd = await page.evaluate(STRIP)
    if (size.mobile) {
      const during = stripOnTour?.strip
      check(
        `${size.name}: on the tour the strip under the stage is in view with the status`,
        Boolean(
          during?.inView && during.text === during.status && during.text.startsWith('Gießt '),
        ),
        JSON.stringify(during ?? null),
      )
      check(
        `${size.name}: at the end the strip is in view with the result`,
        Boolean(stripAtEnd?.inView && stripAtEnd.text.startsWith('Fertig. 6 Bäume')),
        JSON.stringify(stripAtEnd),
      )
    } else {
      check(
        `${size.name}: no strip under the stage`,
        stripOnTour !== null && stripOnTour.strip === null && stripAtEnd === null,
      )
    }
    await page.screenshot(join(out, `${size.name}-3-done.png`))

    await clickButton(page, 'Noch einmal')
    await sleep(300)
    check(`${size.name}: once more brings the six dry trees back`, (await page.evaluate(DRY)) === 6)

    await clickButton(page, 'Tour planen')
    await sleep(2500)
    await clickButton(page, 'Überspringen')
    await page.waitFor(`${STATUS}.startsWith('Fertig.')`, 'the skipped tour to end', 30)
    check(`${size.name}: skip jumps to the end`, true)
  } catch (error) {
    check(`${size.name}: ${error.message}`, false)
  } finally {
    page.close()
  }
}

// A visitor who scrolls past the stage before the scene has loaded and comes
// back to the button must still get the drive, not the stop list.
const unseen = await openPage(sizes[2])
try {
  await unseen.goto(base)
  await unseen.waitFor(`document.querySelector('[data-day-stage]') !== null`, 'the page')
  await unseen.evaluate(`(() => {
    window.__stageSeen = false
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) window.__stageSeen = true
    }).observe(document.querySelector('[data-day-stage]'))
    const target = ${button('Tour planen')}
    target.scrollIntoView({ block: 'center', behavior: 'instant' })
  })()`)
  await unseen.waitFor(
    `document.querySelector('[data-day-stage] [data-ready="true"]') !== null`,
    'the town to get ready off screen',
  )
  check(
    'phone, stage never in view: the town gets ready off screen',
    (await unseen.evaluate(`window.__stageSeen`)) === false,
  )
  await unseen.evaluate(RECORDER)
  await clickButton(unseen, 'Tour planen')
  await unseen.waitFor(`${STATUS}.startsWith('Fertig.')`, 'the tour to end', 1500)
  const { statuses } = await unseen.evaluate(`window.__probe`)
  check(
    'phone, stage never in view: the tour is played',
    statuses.some((s) => s.startsWith('Gießt ')) &&
      (await unseen.evaluate(`document.querySelectorAll('#process ol li').length`)) === 0,
    `${statuses.length} statuses`,
  )
} catch (error) {
  check(`phone, stage never in view: ${error.message}`, false)
} finally {
  unseen.close()
}

const plain = await openPage({ width: 1440, height: 900, webgl: false })
try {
  await load(plain, { name: 'without webgl' }, { scene: false })
  await plain.waitFor(
    `(() => { const poster = document.querySelector('[data-day-poster]'); return poster?.complete && poster.naturalWidth > 0 })()`,
    'the poster',
  )
  check(
    'without webgl: the poster stands in, no canvas',
    await plain.evaluate(
      `document.querySelector('[data-day-poster]').dataset.hidden === 'false' && document.querySelector('#process canvas') === null`,
    ),
  )
  await clickButton(plain, 'Tour planen')
  await plain.waitFor(`${STATUS}.startsWith('Fertig.')`, 'the tour to end', 30)
  check(
    'without webgl: the tour is over at once',
    (await plain.evaluate(STATUS)).startsWith('Fertig. 6 Bäume'),
  )
  check(
    'without webgl: the stops are listed',
    (await plain.evaluate(`document.querySelectorAll('#process ol li').length`)) === 8,
  )
  await plain.screenshot(join(out, 'without-webgl-done.png'))
} catch (error) {
  check(`without webgl: ${error.message}`, false)
} finally {
  plain.close()
}

const TREE = 'Am Markt'
const row = `[...document.querySelectorAll('#process li button')].find((node) => node.textContent.includes(${JSON.stringify(TREE)}))`
const namedLabel = `[...document.querySelectorAll('#process [data-day-label]')].find((node) => node.dataset.shown === 'true' && node.textContent.includes(${JSON.stringify(TREE)}))`
const pointer = await openPage(sizes[0])
try {
  await load(pointer, { name: 'desktop pointer' })
  const rowBox = await pointer.evaluate(`(() => {
    const rect = ${row}.getBoundingClientRect()
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  })()`)
  await moveMouse(pointer, rowBox.x, rowBox.y)
  await pointer.waitFor(`${namedLabel} !== undefined`, 'the hovered tree to be named')
  await pointer.evaluate(`${namedLabel}.setAttribute('data-probe-label', '')`)
  // Hidden labels keep following their anchor, and the label's bottom centre is
  // the anchor whatever the label shows.
  const foot = `(() => {
    const rect = document.querySelector('[data-probe-label]').getBoundingClientRect()
    return { x: rect.left + rect.width / 2, y: rect.bottom }
  })()`
  await settled(pointer, foot, 'the camera on the hovered tree')
  // Off the list, so the click below is the only thing that selects the tree.
  await moveMouse(pointer, 700, 200)
  await pointer.waitFor(`${row}.dataset.selected === 'false'`, 'the hover selection to go')
  const at = await settled(pointer, foot, 'the camera back on the town')
  const target = { x: at.x, y: at.y + 25 }
  const onCanvas = await pointer.evaluate(
    `document.elementFromPoint(${target.x}, ${target.y})?.tagName === 'CANVAS'`,
  )
  await clickAt(pointer, target.x, target.y)
  await pointer.waitFor(`${namedLabel} !== undefined`, 'the clicked tree to be named', 50)
  const named = await pointer.evaluate(`document.querySelector('[data-probe-label]').textContent`)
  check(
    'desktop: a click on a tree in the town names it and marks its row',
    onCanvas &&
      named.includes(TREE) &&
      (await pointer.evaluate(`${row}.dataset.selected`)) === 'true',
    `${named} at ${Math.round(target.x)},${Math.round(target.y)}`,
  )
  await pointer.screenshot(join(out, 'desktop-tree-clicked.png'))

  await pointer.evaluate(`(window.__primary = ${button('Tour planen')}).focus()`)
  const focusKept = `document.activeElement === window.__primary`
  await pressEnter(pointer)
  await pointer.waitFor(`${STATUS}.startsWith('Gießt ')`, 'the tour to run', 600)
  check(
    'desktop, keyboard: the button keeps focus while the tour runs',
    await pointer.evaluate(`${focusKept} && window.__primary.textContent.includes('Überspringen')`),
  )
  await pointer.waitFor(`${STATUS}.startsWith('Fertig.')`, 'the tour to end', 1500)
  check(
    'desktop, keyboard: the button keeps focus when the tour is done',
    await pointer.evaluate(`${focusKept} && window.__primary.textContent.includes('Noch einmal')`),
  )
} catch (error) {
  check(`desktop pointer and keyboard: ${error.message}`, false)
} finally {
  pointer.close()
}

const still = await openPage({ width: 1440, height: 900, reducedMotion: true })
try {
  await load(still, { name: 'reduced motion' })
  await clickButton(still, 'Tour planen')
  await sleep(400)
  check(
    'reduced motion: the tour is over at once',
    (await still.evaluate(STATUS)).startsWith('Fertig. 6 Bäume'),
  )
  check(
    'reduced motion: the stops are listed',
    (await still.evaluate(`document.querySelectorAll('#process ol li').length`)) === 8,
  )
  await still.screenshot(join(out, 'reduced-motion-done.png'))
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
