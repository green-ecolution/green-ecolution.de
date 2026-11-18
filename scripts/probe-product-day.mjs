// Drives the watering day of the product page in a headless browser and checks
// what stills cannot show: the probe reports, the map shows it, the tour runs, refills on the
// way, flies into the close-ups and out again without a cut, never turns round
// at a stop and ends with the day's result where it should.
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
// The status reads the result from the arrival at the depot; the tour is over
// once its close-up has flown out and the tour button offers it once more.
const TOUR_DONE = `[...document.querySelectorAll('#process [data-day-tour-button]')].some((node) => node.getClientRects().length > 0 && node.textContent.includes('Noch einmal'))`
const DRY = `document.querySelectorAll('#process [data-state=dry]').length`
// Below lg the tour button exists twice, in the panel and in the strip under
// the stage; only one of them is laid out. The stage card stays laid out while
// hidden, and after the tour its button reads „Noch einmal“ too.
const button = (text) =>
  `[...document.querySelectorAll('#process button')].find((node) => node.getClientRects().length > 0 && getComputedStyle(node).visibility !== 'hidden' && node.textContent.includes(${JSON.stringify(text)}))`
const STRIP_CARD = `(() => {
  const card = document.querySelector('#process [data-day-strip] [data-day-card]')
  if (!card) return null
  const { top, bottom } = card.getBoundingClientRect()
  return {
    title: card.children[1].textContent.trim(),
    text: card.children[2].textContent.trim(),
    inView: top >= 0 && bottom <= innerHeight,
    next: card.querySelector('button')?.textContent.trim() ?? null,
  }
})()`
const STRIP = `(() => {
  const strip = document.querySelector('#process [data-day-strip]')
  if (!strip || strip.getClientRects().length === 0) return null
  const { top, bottom } = strip.getBoundingClientRect()
  return {
    inView: top >= 0 && bottom <= innerHeight,
    rect: Math.round(top) + '–' + Math.round(bottom),
    text: strip.querySelector('p')?.textContent.trim() ?? null,
    status: ${STATUS},
  }
})()`
// What the bar over the stage says while the scene plays.
const HUD = `(() => {
  const hud = document.querySelector('#process [data-day-hud]')
  if (!hud) return null
  const stage = document.querySelector('#process [data-day-stage]').getBoundingClientRect()
  const { top, bottom, left, right } = hud.getBoundingClientRect()
  return {
    shown: hud.dataset.shown === 'true',
    text: hud.querySelector('p').textContent.trim(),
    inStage: top >= stage.top && bottom <= stage.bottom && left >= stage.left && right <= stage.right,
    status: ${STATUS},
  }
})()`

// What holds or draws right now: the map's hold has no camera of its own.
const SCENE = `(() => {
  const stage = document.querySelector('#process [data-day-stage]')
  return stage.dataset.dayHold === 'map' ? 'map' : stage.dataset.dayCamera
})()`
const HOLD_NAMES = ['probing', 'gateway', 'map', 'watering', 'refilling', 'result']
// The picture under the map's card: which camera draws, what the bar says and
// which trees' pins the card on the stage covers.
const MAP_SEEN = `(() => {
  const stage = document.querySelector('#process [data-day-stage]')
  const card = stage.querySelector('[data-day-card]').getBoundingClientRect()
  const labels = [...stage.querySelectorAll('[data-day-label]')]
  return {
    camera: stage.dataset.dayCamera,
    status: ${STATUS},
    hud: stage.querySelector('[data-day-hud] p').textContent.trim(),
    numbers: labels.some((label) => label.dataset.shown === 'true' && /^[0-9]+$/.test(label.textContent.trim())),
    // The first twelve labels are the trees'; each stands over its pin's head.
    covered: labels.slice(0, 12).flatMap((label, index) => {
      const { left, right, bottom } = label.getBoundingClientRect()
      const x = (left + right) / 2
      const isUnder = x > card.left - 12 && x < card.right + 12 && bottom + 24 > card.top && bottom < card.bottom
      return isUnder ? [index] : []
    }),
  }
})()`

// Runs inside the page: polling from outside misses the short close-ups and
// status changes when software rendering is slow.
const RECORDER = `(() => {
  const status = document.querySelector('#process [role=status]')
  const root = document.querySelector('#process [data-day-root]')
  const stage = document.querySelector('#process [data-day-stage]')
  const caption = document.querySelector('#process [data-day-caption]')
  const record = (window.__probe = {
    statuses: [status.textContent.trim()],
    cameras: [stage.dataset.dayCamera],
    turns: [],
    caption: {},
    cards: {},
    holds: { probing: [], gateway: [], map: [], watering: [], refilling: [], result: [] },
    cardTexts: {},
    // Cameras, statuses and the route's numbers in the order they came.
    timeline: ['camera:' + stage.dataset.dayCamera, 'status:' + status.textContent.trim()],
    lowestOpacity: 1,
    lowestTank: 1,
  })
  new MutationObserver(() => {
    record.statuses.push(status.textContent.trim())
    record.timeline.push('status:' + status.textContent.trim())
  }).observe(status, {
    childList: true,
    characterData: true,
    subtree: true,
  })
  new MutationObserver(() => {
    if (record.cameras.at(-1) !== stage.dataset.dayCamera) {
      record.cameras.push(stage.dataset.dayCamera)
      record.timeline.push('camera:' + stage.dataset.dayCamera)
    }
    if (stage.dataset.dayTurn && record.turns.at(-1) !== stage.dataset.dayTurn) record.turns.push(stage.dataset.dayTurn)
    const hold = stage.dataset.dayHold ?? ''
    if (hold !== (record.hold ?? '')) {
      record.hold = hold
      if (hold) record.timeline.push('hold:' + hold)
    }
  }).observe(stage, {
    attributes: true,
    attributeFilter: ['data-day-camera', 'data-day-turn', 'data-day-hold'],
  })
  const sample = () => {
    const canvas = document.querySelector('#process canvas')
    record.lowestOpacity = Math.min(record.lowestOpacity, Number(getComputedStyle(canvas).opacity))
    const shown = Number(getComputedStyle(caption).opacity)
    record.caption[stage.dataset.dayCamera] = Math.max(record.caption[stage.dataset.dayCamera] ?? 0, shown)
    // The map's hold stands in the slanted view; every other hold has a camera of its own.
    const camera = ${SCENE}
    const shownCards = [...document.querySelectorAll('#process [data-day-card]')].filter(
      (card) =>
        card.getClientRects().length > 0 &&
        card.dataset.shown !== 'false' &&
        getComputedStyle(card).visibility !== 'hidden',
    )
    for (const card of shownCards) {
      if (card.dataset.dayCard === 'watering') record.wateringAt ??= status.textContent.trim()
      if (card.dataset.dayCard === 'result') record.resultAt ??= status.textContent.trim()
      record.cardTexts[card.dataset.dayCard] ??= card.children[2].textContent.trim()
      const seen = (record.cards[camera] ??= {})
      const title = card.children[1].textContent.trim()
      seen[title] = (seen[title] ?? 0) + 1
    }
    if (camera in record.holds) {
      record.holds[camera].push(Number(root.style.getPropertyValue('--day-hold') || 1))
    }
    // The tour's numbers stand over the trees once the route draws.
    const numbers = [...document.querySelectorAll('#process [data-day-label]')].some(
      (label) => label.dataset.shown === 'true' && /^[0-9]+$/.test(label.textContent.trim()),
    )
    if (numbers !== (record.numbers ?? false)) {
      record.numbers = numbers
      record.timeline.push(numbers ? 'numbers' : 'no-numbers')
    }
    const share = Number(root.style.getPropertyValue('--day-tank') || 1)
    record.lowestTank = Math.min(record.lowestTank, share)
    requestAnimationFrame(sample)
  }
  requestAnimationFrame(sample)
})()`

const MAP_STATUS = '6 Bäume brauchen Wasser. Der Rest kann warten.'

// The probe at the first tree reports first and the camera follows its message
// to the gateway; that tree gets the ride and the watering close-up, the
// hydrant later on its own close-up, the depot the result.
const CAMERAS = [
  'iso',
  'fly-in',
  'probing',
  'to-gateway',
  'gateway',
  'fly-out',
  'iso',
  'fly-in',
  'ride',
  'to-watering',
  'watering',
  'fly-out',
  'iso',
  'fly-in',
  'refilling',
  'fly-out',
  'iso',
  'fly-in',
  'result',
  'fly-out',
  'iso',
]

const PROBE_TITLE = 'Die Sonde meldet sich'
const GATEWAY_TITLE = 'Das Gateway gibt die Meldung weiter'
const MAP_TITLE = 'Die Karte zeigt, wo es trocken ist'
const WATERING_TITLE = 'Wasser nur dort, wo es fehlt'
const REFILL_TITLE = 'Das Auffüllen ist mitgeplant'
const RESULT_TITLE = 'Fertig für heute'
const RESULT_TEXT = '6 Bäume gegossen. 6 hatten noch genug Wasser, dorthin musste niemand fahren.'
// The scene ends a hold within a frame; React may take one more to hide the card.
const CARD_LAG_SAMPLES = 2

/** The cards seen in each camera mode where none belongs, beyond a frame of lag. */
const strayCards = (cards) =>
  Object.entries(cards).flatMap(([camera, titles]) =>
    Object.entries(titles)
      .filter(([title, samples]) => {
        const due =
          (camera === 'probing' && title === PROBE_TITLE) ||
          (camera === 'gateway' && title === GATEWAY_TITLE) ||
          (camera === 'map' && title === MAP_TITLE) ||
          (camera === 'watering' && title === WATERING_TITLE) ||
          (camera === 'refilling' && title === REFILL_TITLE) ||
          (camera === 'result' && title === RESULT_TITLE)
        return !due && samples > CARD_LAG_SAMPLES
      })
      .map(([title, samples]) => `${title} in ${camera} (${samples})`),
  )

/** Stops at a tree or the hydrant the truck left facing another way than it came. */
const turnedRound = (turns) =>
  turns.filter((turn) => {
    const [, place, degrees] = turn.split(':')
    return place !== 'depot' && Number(degrees) > 10
  })

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

async function pressKey(page, key) {
  const codes = { Tab: 9 }
  const event = { key, code: key, windowsVirtualKeyCode: codes[key] }
  await page.call('Input.dispatchKeyEvent', { type: 'keyDown', ...event })
  await page.call('Input.dispatchKeyEvent', { type: 'keyUp', ...event })
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
      (await page.evaluate(`${button('Gießtag starten')}.getAttribute('aria-disabled')`)) ===
        'true',
    )
    await setDays(page, 9)

    await page.evaluate(RECORDER)
    await clickButton(page, 'Gießtag starten')
    // A resting mouse holds a close-up wherever its card appears under it.
    await moveMouse(page, 1, 1)
    const photographed = new Set()
    const stripCards = {}
    let stripOnTour = null
    let mapSeen = null
    // Software rendering runs the tour slower than a real machine does.
    const deadline = Date.now() + 600_000
    let status = ''
    while (Date.now() < deadline) {
      const [now, camera] = await Promise.all([page.evaluate(STATUS), page.evaluate(SCENE)])
      status = now
      if (!stripOnTour && status.startsWith('Gießt '))
        stripOnTour = { strip: await page.evaluate(STRIP), hud: await page.evaluate(HUD) }
      const isHold = HOLD_NAMES.includes(camera)
      if ((isHold || camera === 'ride') && !photographed.has(camera)) {
        photographed.add(camera)
        await sleep(400)
        await page.screenshot(join(out, `${size.name}-2-${camera}.png`))
        if (size.mobile && isHold) stripCards[camera] = await page.evaluate(STRIP_CARD)
        if (camera === 'map') mapSeen = await page.evaluate(MAP_SEEN)
      }
      if (await page.evaluate(TOUR_DONE)) break
      await sleep(50)
    }
    const {
      statuses,
      cameras,
      turns,
      caption,
      cards,
      holds,
      lowestOpacity,
      lowestTank,
      resultAt,
      cardTexts,
    } = await page.evaluate(`window.__probe`)
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
    check(`${size.name}: the picture never dims`, lowestOpacity === 1, `lowest ${lowestOpacity}`)
    check(
      `${size.name}: the camera visits the probe, rides to the first tree, watches the watering, flies to the hydrant and to the depot and comes back each time`,
      cameras.join() === CAMERAS.join(),
      cameras.join(' > '),
    )
    const captionElsewhere = Object.entries(caption).filter(
      ([camera, shown]) => !['ride', 'to-watering'].includes(camera) && shown > 0,
    )
    check(
      `${size.name}: the caption stands in the picture during the ride and only then`,
      (caption.ride ?? 0) > 0.95 && captionElsewhere.length === 0,
      JSON.stringify(caption),
    )
    check(
      `${size.name}: a card explains the probe, the gateway, the map, the watering, the refill and the result while they hold, at no other time`,
      (cards.probing?.[PROBE_TITLE] ?? 0) > 0 &&
        (cards.gateway?.[GATEWAY_TITLE] ?? 0) > 0 &&
        (cards.map?.[MAP_TITLE] ?? 0) > 0 &&
        (cards.watering?.[WATERING_TITLE] ?? 0) > 0 &&
        (cards.refilling?.[REFILL_TITLE] ?? 0) > 0 &&
        (cards.result?.[RESULT_TITLE] ?? 0) > 0 &&
        strayCards(cards).length === 0,
      JSON.stringify(cards),
    )
    check(
      `${size.name}: the result card counts six trees watered and six left alone`,
      cardTexts.result === RESULT_TEXT,
      JSON.stringify(cardTexts.result ?? null),
    )
    check(
      `${size.name}: the status reads the result as soon as the truck is back at the depot`,
      resultAt?.startsWith('Fertig. 6 Bäume'),
      JSON.stringify(resultAt ?? null),
    )
    const falls = (values) => values.length > 2 && values[0] > values.at(-1) + 0.3
    check(
      `${size.name}: the card's bar runs down over each hold`,
      HOLD_NAMES.every((name) => falls(holds[name])),
      HOLD_NAMES.map((name) => `${name} ${holds[name][0]} to ${holds[name].at(-1)}`).join(', '),
    )
    check(
      `${size.name}: while the map's card stands the whole town is in the picture, the bar counts the dry trees and no route is drawn yet`,
      Boolean(
        mapSeen &&
        mapSeen.camera === 'iso' &&
        mapSeen.status === MAP_STATUS &&
        mapSeen.hud === MAP_STATUS &&
        !mapSeen.numbers,
      ),
      JSON.stringify(mapSeen),
    )
    if (!size.mobile) {
      check(
        `${size.name}: the map's card covers no tree's pin`,
        mapSeen?.covered.length === 0,
        JSON.stringify(mapSeen?.covered ?? null),
      )
    }
    if (size.mobile) {
      const expected = [
        ['probing', PROBE_TITLE, 'Weiter'],
        ['gateway', GATEWAY_TITLE, 'Weiter'],
        ['map', MAP_TITLE, 'Tour planen'],
        ['watering', WATERING_TITLE, 'Weiterfahren'],
        ['refilling', REFILL_TITLE, 'Weiterfahren'],
        ['result', RESULT_TITLE, 'Noch einmal'],
      ]
      check(
        `${size.name}: during each hold the card stands in the strip, in view, with its way on`,
        expected.every(([camera, title, next]) => {
          const card = stripCards[camera]
          return card?.inView && card.title === title && card.next === next
        }),
        JSON.stringify(stripCards),
      )
    }
    check(
      `${size.name}: the truck never turns round at a tree or the hydrant`,
      turns.length >= 7 && turnedRound(turns).length === 0,
      turns.join(' '),
    )
    check(`${size.name}: the tank gauge falls`, lowestTank <= 0.3, `lowest ${lowestTank}`)
    check(`${size.name}: it ends with six trees watered`, status.startsWith('Fertig. 6 Bäume'))
    check(`${size.name}: no tree needs water afterwards`, (await page.evaluate(DRY)) === 0)
    await sleep(1500)
    const stripAtEnd = await page.evaluate(STRIP)
    const hudOnTour = stripOnTour?.hud
    const hudAtEnd = await page.evaluate(HUD)
    check(
      `${size.name}: on the tour a bar over the stage says what happens, and it goes with the tour`,
      Boolean(
        hudOnTour?.shown &&
        hudOnTour.inStage &&
        hudOnTour.text === hudOnTour.status &&
        hudOnTour.text.startsWith('Gießt ') &&
        hudAtEnd &&
        !hudAtEnd.shown,
      ),
      JSON.stringify({ hudOnTour, hudAtEnd }),
    )
    if (size.mobile) {
      const during = stripOnTour?.strip
      check(
        `${size.name}: on the tour the strip under the stage is in view with the way to skip`,
        Boolean(during?.inView && during.text === null),
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

    await clickButton(page, 'Gießtag starten')
    await sleep(2500)
    await clickButton(page, 'Überspringen')
    await page.waitFor(TOUR_DONE, 'the skipped tour to end', 30)
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
    const target = ${button('Gießtag starten')}
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
  await clickButton(unseen, 'Gießtag starten')
  await moveMouse(unseen, 1, 1)
  await unseen.waitFor(TOUR_DONE, 'the tour to end', 6000)
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
  await clickButton(plain, 'Gießtag starten')
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
const rowOf = (name) =>
  `[...document.querySelectorAll('#process li button')].find((node) => node.textContent.includes(${JSON.stringify(name)}))`
const labelOf = (name) =>
  `[...document.querySelectorAll('#process [data-day-label]')].find((node) => node.dataset.shown === 'true' && node.textContent.includes(${JSON.stringify(name)}))`
const row = rowOf(TREE)
const namedLabel = labelOf(TREE)
const middleOf = (node) => `(() => {
  const rect = ${node}.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
})()`
// The depot's label stands over a fixed point of the town: where its foot is
// on screen tells where the camera looks.
const LOOK = `(() => {
  const label = [...document.querySelectorAll('#process [data-day-label]')].find((node) => node.textContent.trim() === 'Bauhof')
  const rect = label.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.bottom }
})()`
const apart = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const pointer = await openPage(sizes[0])
try {
  await load(pointer, { name: 'desktop pointer' })
  const rest = await settled(pointer, LOOK, 'the camera on the town')

  for (const [index, name] of ['Am Markt', 'Marktgasse', 'Bahnhofstraße'].entries()) {
    const box = await pointer.evaluate(middleOf(rowOf(name)))
    await moveMouse(pointer, box.x, box.y)
    await pointer.waitFor(`${labelOf(name)} !== undefined`, `${name} to be named`)
    // Long enough for a glide to show; the camera answers within a frame.
    await sleep(1500)
    const look = await pointer.evaluate(LOOK)
    const marked = await pointer.evaluate(
      `document.querySelectorAll('#process li button[data-selected=true]').length`,
    )
    check(
      `desktop: hovering ${name} names it and leaves the camera where it is`,
      apart(look, rest) < 0.5 && marked === 0,
      `moved ${apart(look, rest).toFixed(1)} px, ${marked} marked`,
    )
    await pointer.screenshot(join(out, `desktop-4-hover-${index + 1}.png`))
  }

  const target = 'Bahnhofstraße'
  const box = await pointer.evaluate(middleOf(rowOf(target)))
  await clickAt(pointer, box.x, box.y)
  await pointer.waitFor(
    `${rowOf(target)}.dataset.selected === 'true'`,
    'the clicked row to be marked',
  )
  const flown = await settled(pointer, LOOK, 'the camera on the clicked tree')
  check(
    'desktop: a click on a row marks it and the camera glides there',
    apart(flown, rest) > 40 && (await pointer.evaluate(`${labelOf(target)} !== undefined`)),
    `moved ${apart(flown, rest).toFixed(0)} px`,
  )
  await pointer.screenshot(join(out, 'desktop-5-row-clicked.png'))

  await clickAt(pointer, box.x, box.y)
  await pointer.waitFor(`${rowOf(target)}.dataset.selected === 'false'`, 'the row to let go')
  const back = await settled(pointer, LOOK, 'the camera back on the town')
  check(
    'desktop: a second click lets the row go and the camera returns',
    apart(back, rest) < 2,
    `${apart(back, rest).toFixed(1)} px off`,
  )

  const rowBox = await pointer.evaluate(middleOf(row))
  await moveMouse(pointer, rowBox.x, rowBox.y)
  await pointer.waitFor(`${namedLabel} !== undefined`, 'the hovered tree to be named')
  await pointer.evaluate(`${namedLabel}.setAttribute('data-probe-label', '')`)
  // Hidden labels keep following their anchor, and the label's bottom centre is
  // the anchor whatever the label shows.
  const foot = `(() => {
    const rect = document.querySelector('[data-probe-label]').getBoundingClientRect()
    return { x: rect.left + rect.width / 2, y: rect.bottom }
  })()`
  // Off the list, so the click below is the only thing that selects the tree.
  await moveMouse(pointer, 700, 200)
  await pointer.waitFor(`${namedLabel} === undefined`, 'the hover name to go')
  const at = await settled(pointer, foot, 'the tree on screen')
  const spot = { x: at.x, y: at.y + 25 }
  const onCanvas = await pointer.evaluate(
    `document.elementFromPoint(${spot.x}, ${spot.y})?.tagName === 'CANVAS'`,
  )
  await clickAt(pointer, spot.x, spot.y)
  await pointer.waitFor(`${namedLabel} !== undefined`, 'the clicked tree to be named', 50)
  const named = await pointer.evaluate(`document.querySelector('[data-probe-label]').textContent`)
  check(
    'desktop: a click on a tree in the town names it and marks its row',
    onCanvas &&
      named.includes(TREE) &&
      (await pointer.evaluate(`${row}.dataset.selected`)) === 'true',
    `${named} at ${Math.round(spot.x)},${Math.round(spot.y)}`,
  )
  await pointer.screenshot(join(out, 'desktop-tree-clicked.png'))

  await pointer.evaluate(`(window.__primary = ${button('Gießtag starten')}).focus()`)
  const focusKept = `document.activeElement === window.__primary`
  await moveMouse(pointer, 1, 1)
  await pressEnter(pointer)
  await pointer.waitFor(`${STATUS}.startsWith('Gießt ')`, 'the tour to run', 600)
  check(
    'desktop, keyboard: the button keeps focus while the tour runs',
    await pointer.evaluate(`${focusKept} && window.__primary.textContent.includes('Überspringen')`),
  )
  await pointer.waitFor(TOUR_DONE, 'the tour to end', 6000)
  check(
    'desktop, keyboard: the button keeps focus when the tour is done',
    await pointer.evaluate(`${focusKept} && window.__primary.textContent.includes('Noch einmal')`),
  )
} catch (error) {
  check(`desktop pointer and keyboard: ${error.message}`, false)
} finally {
  pointer.close()
}

// One tree at five days: it still gets its close-up and card.
const five = await openPage(sizes[0])
try {
  await load(five, { name: 'desktop, five days' })
  await setDays(five, 5)
  await five.evaluate(RECORDER)
  await clickButton(five, 'Gießtag starten')
  await moveMouse(five, 1, 1)
  await five.waitFor(TOUR_DONE, 'the tour at five days to end', 6000)
  const { cards, wateringAt, cameras, cardTexts } = await five.evaluate(`window.__probe`)
  check(
    'desktop, five days: the one tree gets the watering close-up with its card',
    (cards.watering?.[WATERING_TITLE] ?? 0) > 0 && wateringAt === 'Gießt Am Markt.',
    `${wateringAt}, ${JSON.stringify(cards)}`,
  )
  check(
    'desktop, five days: the probe reports first and the result counts the one tree',
    cameras.slice(0, 7).join() === 'iso,fly-in,probing,to-gateway,gateway,fly-out,iso' &&
      cameras.slice(-4).join() === 'fly-in,result,fly-out,iso' &&
      (cards.probing?.[PROBE_TITLE] ?? 0) > 0 &&
      cardTexts.result ===
        '1 Baum gegossen. 11 hatten noch genug Wasser, dorthin musste niemand fahren.',
    `${cameras.join(' > ')}, ${JSON.stringify(cardTexts.result ?? null)}`,
  )
} catch (error) {
  check(`desktop, five days: ${error.message}`, false)
} finally {
  five.close()
}

// At eight days the old planner turned the truck round on the cross street.
const eight = await openPage(sizes[0])
try {
  await load(eight, { name: 'desktop, eight days' })
  await setDays(eight, 8)
  await eight.evaluate(RECORDER)
  await clickButton(eight, 'Gießtag starten')
  await moveMouse(eight, 1, 1)
  await eight.waitFor(TOUR_DONE, 'the tour at eight days to end', 6000)
  const { turns } = await eight.evaluate(`window.__probe`)
  check(
    'desktop, eight days: the truck never turns round at a tree or the hydrant',
    turns.length >= 6 && turnedRound(turns).length === 0,
    turns.join(' '),
  )
} catch (error) {
  check(`desktop, eight days: ${error.message}`, false)
} finally {
  eight.close()
}

const CAMERA = `document.querySelector('#process [data-day-stage]').dataset.dayCamera`
const HOLD = `Number(document.querySelector('#process [data-day-root]').style.getPropertyValue('--day-hold') || 1)`
const STAGE_CARD = `document.querySelector('#process [data-day-stage] [data-day-card]')`
const nextIn = (card) =>
  `[...${card}.querySelectorAll('button')].find((node) => node.textContent.includes('Weiterfahren'))`
const PICTURE = `document.querySelector('#process [data-day-stage] [role=img]')`

/** Two readings of the card's bar a second apart. */
async function barOverASecond(page) {
  const first = await page.evaluate(HOLD)
  await sleep(1000)
  return [first, await page.evaluate(HOLD)]
}

const buttonIn = (card, text) =>
  `[...${card}.querySelectorAll('button')].find((node) => node.textContent.trim() === ${JSON.stringify(text)})`

// „Weiter“ at the probe goes on to the plan, the truck leaves after it; „Noch
// einmal“ in the result's card starts the day over.
const beats = await openPage(sizes[0])
try {
  await load(beats, { name: 'desktop beats' })
  await beats.evaluate(RECORDER)
  await clickButton(beats, 'Gießtag starten')
  await moveMouse(beats, 1, 1)
  await beats.waitFor(`${CAMERA} === 'probing'`, 'the probe close-up', 600)
  await sleep(500)
  const weiter = await beats.evaluate(middleOf(buttonIn(STAGE_CARD, 'Weiter')))
  await moveMouse(beats, weiter.x, weiter.y)
  await clickAt(beats, weiter.x, weiter.y)
  const clicked = Date.now()
  await beats.waitFor(`${CAMERA} !== 'probing'`, 'the probe hold to end', 50)
  const left = Date.now() - clicked
  const after = await beats.evaluate(CAMERA)
  check(
    '„Weiter“ at the probe sets out for the gateway within a second and the focus waits at the picture',
    after === 'to-gateway' &&
      left < 1000 &&
      (await beats.evaluate(`document.activeElement === ${PICTURE}`)),
    `${after} after ${left} ms`,
  )
  await moveMouse(beats, 40, 40)
  await beats.waitFor(`${STATUS}.startsWith('Gießt ')`, 'the first tree', 6000)
  const { timeline } = await beats.evaluate(`window.__probe`)
  // From the probe's hold on: over to the gateway, back to the slanted view,
  // the map's card stands there, the route draws with its numbers, and only
  // then the camera goes down again and the truck waters.
  const from = timeline.indexOf('camera:probing')
  const at = (entry) => timeline.indexOf(entry, from)
  const firstWatering = timeline.findIndex(
    (entry, index) => index > from && entry.startsWith('status:Gießt '),
  )
  const order = [
    at('camera:to-gateway'),
    at('camera:gateway'),
    at('camera:fly-out'),
    at('camera:iso'),
    at('hold:map'),
    at('numbers'),
    at('camera:fly-in'),
    firstWatering,
  ]
  check(
    'after „Weiter“ the camera goes to the gateway and back to the slanted view, the map shows who needs water, the route draws, then the camera goes down and the truck waters the first tree',
    from >= 0 && order.every((index, step) => index > (step === 0 ? from : order[step - 1])),
    timeline
      .slice(Math.max(0, from))
      .filter((entry) => !entry.startsWith('status:Tour'))
      .slice(0, 12)
      .join(' > '),
  )
  await beats.waitFor(`${CAMERA} === 'result'`, 'the result close-up', 6000)
  await sleep(500)
  const again = await beats.evaluate(middleOf(buttonIn(STAGE_CARD, 'Noch einmal')))
  await beats.screenshot(join(out, 'desktop-9-result.png'))
  await moveMouse(beats, again.x, again.y)
  await clickAt(beats, again.x, again.y)
  await sleep(100)
  await beats.screenshot(join(out, 'desktop-10-after-noch-einmal.png'))
  const placeholderWhileFading = await beats.evaluate(
    `document.getElementById('process').textContent.includes('{{')`,
  )
  await beats.waitFor(`${CAMERA} === 'iso'`, 'the slanted view after „Noch einmal“', 50)
  await sleep(400)
  await moveMouse(beats, 40, 40)
  const afterAgain = await beats.evaluate(`(() => ({
    camera: ${CAMERA},
    stageCard: ${STAGE_CARD}.dataset.shown,
    strip: document.querySelector('#process [data-day-strip] [data-day-card]') !== null,
    placeholder: document.getElementById('process').textContent.includes('{{'),
    dry: ${DRY},
    focus: document.activeElement === ${PICTURE},
    plan: ${button('Gießtag starten')} !== undefined,
  }))()`)
  check(
    '„Noch einmal“ in the result card shows the slanted view, no card and no placeholder, the six dry trees are back and the focus waits at the picture',
    !placeholderWhileFading &&
      afterAgain.camera === 'iso' &&
      afterAgain.stageCard === 'false' &&
      !afterAgain.strip &&
      !afterAgain.placeholder &&
      afterAgain.dry === 6 &&
      afterAgain.focus &&
      afterAgain.plan,
    JSON.stringify({ placeholderWhileFading, ...afterAgain }),
  )
} catch (error) {
  check(`desktop beats: ${error.message}`, false)
} finally {
  beats.close()
}

// On a phone the strip can be in view while the stage is not, and a stage
// out of view draws no frame. „Noch einmal“ in the result card must still
// leave nothing of the result behind for the next tour.
const offStage = await openPage(sizes[2])
try {
  await load(offStage, { name: 'phone, result card off stage' })
  await clickButton(offStage, 'Gießtag starten')
  await offStage.waitFor(`${CAMERA} === 'result'`, 'the result close-up', 6000)
  await sleep(500)
  await offStage.evaluate(`(() => {
    const stage = document.querySelector('#process [data-day-stage]').getBoundingClientRect()
    scrollBy({ top: stage.bottom + 2, behavior: 'instant' })
  })()`)
  await sleep(800)
  const placed = await offStage.evaluate(`(() => {
    const stage = document.querySelector('#process [data-day-stage]').getBoundingClientRect()
    const button = ${buttonIn(`document.querySelector('#process [data-day-strip] [data-day-card]')`, 'Noch einmal')}
    const rect = button?.getBoundingClientRect()
    return { stageOut: stage.bottom <= 0, buttonIn: Boolean(rect && rect.top >= 0 && rect.bottom <= innerHeight) }
  })()`)
  if (!placed.stageOut || !placed.buttonIn) {
    throw new Error(`could not put the strip in view without the stage: ${JSON.stringify(placed)}`)
  }
  await offStage.evaluate(
    `${buttonIn(`document.querySelector('#process [data-day-strip] [data-day-card]')`, 'Noch einmal')}.click()`,
  )
  await sleep(300)
  const LEFT_OVER = `(() => {
    const strip = document.querySelector('#process [data-day-strip] [data-day-card]')
    const spoken = document.querySelector('#process p[aria-live=polite]').textContent
    return { strip: strip?.children[1].textContent.trim() ?? null, spoken }
  })()`
  // Read in the same task as the click, before any frame of the scene.
  const atStart = await offStage.evaluate(`(() => {
    ${button('Gießtag starten')}.click()
    return ${LEFT_OVER}
  })()`)
  await sleep(300)
  const soon = await offStage.evaluate(LEFT_OVER)
  const isClean = ({ strip, spoken }) =>
    strip !== 'Fertig für heute' && !spoken.includes('Fertig für heute')
  check(
    'phone, stage out of view: after „Noch einmal“ in the result card the next tour starts without the result card or its announcement',
    isClean(atStart) && isClean(soon),
    JSON.stringify({ atStart, soon }),
  )
} catch (error) {
  check(`phone, result card off stage: ${error.message}`, false)
} finally {
  offStage.close()
}

// Reading the card holds the tour; „Weiterfahren“ ends the hold at once.
const reader = await openPage(sizes[0])
try {
  await load(reader, { name: 'desktop card' })
  check(
    "desktop: the stage card's „Weiterfahren“ stands outside the image role",
    await reader.evaluate(`(() => {
      const next = ${nextIn(STAGE_CARD)}
      return next !== undefined && next.closest('[role=img]') === null && ${PICTURE} !== null
    })()`),
  )
  await reader.evaluate(RECORDER)
  await clickButton(reader, 'Gießtag starten')
  // Where the card will appear, before it does; the mouse then stays put.
  const parked = await reader.evaluate(middleOf(STAGE_CARD))
  await moveMouse(reader, parked.x, parked.y)
  const camera = CAMERA
  const hold = HOLD
  const card = STAGE_CARD
  await reader.waitFor(`${camera} === 'watering'`, 'the watering shot', 4200)
  await sleep(300)
  const resting = await barOverASecond(reader)
  const underMouse = await reader.evaluate(
    `document.elementFromPoint(${parked.x}, ${parked.y})?.closest('[data-day-card]') !== null`,
  )
  check(
    'desktop: a mouse resting where the card appears does not hold the bar',
    underMouse && resting[1] < resting[0],
    `${resting.join(' to ')}, card under the mouse: ${underMouse}`,
  )
  await reader.waitFor(`${hold} < 0.6`, 'the bar to pass half way', 600)
  await reader.screenshot(join(out, 'desktop-7-card-half.png'))
  const tree = await reader.evaluate(`(() => {
    const title = document.querySelector('#process [role=status]').textContent
    return title.replace(/^Gießt (.*)\.$/, '$1')
  })()`)
  const next = await reader.evaluate(middleOf(nextIn(card)))
  await moveMouse(reader, next.x, next.y)
  await clickAt(reader, next.x, next.y)
  const clicked = Date.now()
  await reader.waitFor(`${camera} !== 'watering'`, 'the hold to end', 50)
  const left = Date.now() - clicked
  const after = await reader.evaluate(camera)
  await reader.screenshot(join(out, 'desktop-8-after-next.png'))
  await moveMouse(reader, 40, 40)
  await reader.waitFor(
    `${rowOf(tree)}.textContent.includes('gegossen')`,
    `${tree} to count as watered`,
    100,
  )
  check(
    'desktop: „Weiterfahren“ flies out within a second and the tree counts as watered',
    after === 'fly-out' && left < 1000,
    `${tree}: ${after} after ${left} ms`,
  )
  check(
    'desktop: after „Weiterfahren“ the focus waits at the picture, not on the tour button',
    await reader.evaluate(`document.activeElement === ${PICTURE}`),
    await reader.evaluate(`document.activeElement?.outerHTML.slice(0, 60)`),
  )
  await reader.waitFor(`${camera} === 'refilling'`, 'the refill close-up', 4200)
  await sleep(800)
  const box = await reader.evaluate(middleOf(card))
  await moveMouse(reader, box.x, box.y)
  await sleep(300)
  const first = await reader.evaluate(hold)
  await sleep(1000)
  const second = await reader.evaluate(hold)
  await reader.screenshot(join(out, 'desktop-6-card-read.png'))
  await moveMouse(reader, 40, 40)
  await sleep(1000)
  const third = await reader.evaluate(hold)
  check(
    'desktop: the bar stops while the pointer rests on the card and runs on when it leaves',
    first === second && third < second && first < 1,
    `${first} ${second} ${third}`,
  )
  await pressKey(reader, 'Tab')
  check(
    "desktop, keyboard: Tab from the picture reaches the refill card's „Weiterfahren“",
    await reader.evaluate(`document.activeElement === ${nextIn(card)}`),
    await reader.evaluate(`document.activeElement?.textContent.trim()`),
  )
  await pressEnter(reader)
  await reader.waitFor(`${camera} !== 'refilling'`, 'the refill hold to end', 50)
  await pressEnter(reader)
  await sleep(500)
  check(
    'desktop, keyboard: Enter on the card moves on, a second Enter does not skip the tour',
    (await reader.evaluate(`document.activeElement === ${PICTURE}`)) &&
      !(await reader.evaluate(STATUS)).startsWith('Fertig.'),
    await reader.evaluate(STATUS),
  )
} catch (error) {
  check(`desktop card: ${error.message}`, false)
} finally {
  reader.close()
}

// Below lg the strip's card goes away under a mouse that clicked „Weiterfahren“:
// no pointerleave tells the island, and the next hold must still run.
const narrow = await openPage({ width: 900, height: 900 })
try {
  await load(narrow, { name: 'narrow, mouse' })
  await clickButton(narrow, 'Gießtag starten')
  await moveMouse(narrow, 1, 1)
  const stripCard = `document.querySelector('#process [data-day-strip] [data-day-card]')`
  await narrow.waitFor(
    `${CAMERA} === 'watering' && ${stripCard} !== null`,
    'the watering card',
    4200,
  )
  await sleep(500)
  const next = await narrow.evaluate(middleOf(nextIn(stripCard)))
  await moveMouse(narrow, next.x, next.y)
  await clickAt(narrow, next.x, next.y)
  await narrow.waitFor(`${CAMERA} !== 'watering'`, 'the watering hold to end', 50)
  await narrow.waitFor(`${CAMERA} === 'refilling'`, 'the refill hold', 4200)
  await sleep(500)
  const bar = await barOverASecond(narrow)
  check(
    'narrow, mouse: after „Weiterfahren“ in the strip the refill bar runs under the resting mouse',
    bar[1] < bar[0],
    `${bar.join(' to ')}, mouse at ${Math.round(next.x)},${Math.round(next.y)}`,
  )
} catch (error) {
  check(`narrow, mouse: ${error.message}`, false)
} finally {
  narrow.close()
}

// The stage is as tall as the panel beside it. It has to fit between the header
// and the window's bottom, so the tour starts in a whole picture.
for (const [width, height] of [
  [1194, 702],
  [1366, 768],
]) {
  const name = `${width} × ${height}`
  const fitted = await openPage({ width, height })
  try {
    await load(fitted, { name })
    await clickButton(fitted, 'Gießtag starten')
    await sleep(2500)
    const seen = await fitted.evaluate(`(() => {
      const stage = document.querySelector('#process [data-day-stage]')
      const header = document.getElementById('site-header')
      if (!stage || !header) return null
      const { top, bottom } = stage.getBoundingClientRect()
      return { top, bottom, header: header.getBoundingClientRect().bottom, window: innerHeight }
    })()`)
    if (!seen) throw new Error('the stage or the header is missing, nothing to measure')
    check(
      `${name}: after the tour button the stage lies between the header and the window's bottom`,
      seen.top >= seen.header && seen.bottom <= seen.window,
      JSON.stringify(seen),
    )
    await fitted.screenshot(join(out, `fitted-${width}x${height}.png`))
  } catch (error) {
    check(`${name}, stage in view: ${error.message}`, false)
  } finally {
    fitted.close()
  }
}

const relay = await openPage(sizes[0])
try {
  await load(relay, { name: 'relay' })
  const STAGE = `document.querySelector('#process [data-day-stage]')`
  const CAMERA_NOW = `${STAGE}.dataset.dayCamera`
  const UNDER_WAY = `${STAGE}.hasAttribute('data-day-relay')`
  const SHOWN_CARD = `[...document.querySelectorAll('#process [data-day-card]')].find((node) => node.getClientRects().length > 0 && node.dataset.shown !== 'false')`
  // Runs inside the page: which cameras draw while the message is under way.
  await relay.evaluate(`(() => {
    const stage = ${STAGE}
    const cameras = (window.__relay = [])
    new MutationObserver(() => {
      if (!${UNDER_WAY}) return
      if (cameras[cameras.length - 1] !== stage.dataset.dayCamera) cameras.push(stage.dataset.dayCamera)
    }).observe(stage, { attributes: true })
  })()`)
  await clickButton(relay, 'Gießtag starten')
  await moveMouse(relay, 1, 1)
  await relay.waitFor(`${CAMERA_NOW} === 'probing'`, 'the probe to report', 600)
  check(
    'relay: nothing is under way while the probe still reports',
    !(await relay.evaluate(UNDER_WAY)),
  )
  await sleep(600)
  await clickButton(relay, 'Weiter')
  await moveMouse(relay, 1, 1)
  await relay.waitFor(UNDER_WAY, 'the message to set out', 100)
  await sleep(1200)
  check(
    'relay: the camera follows the message from the probe to the gateway',
    (await relay.evaluate(CAMERA_NOW)) === 'to-gateway',
    await relay.evaluate(CAMERA_NOW),
  )
  await relay.screenshot(join(out, 'desktop-relay-1-on-the-way.png'))
  await relay.waitFor(`${CAMERA_NOW} === 'gateway'`, 'the gateway', 300)
  await sleep(1500)
  check(
    'relay: at the gateway a card says where the message goes, with a way on',
    (await relay.evaluate(`${SHOWN_CARD}?.children[1].textContent.trim()`)) === GATEWAY_TITLE &&
      (await relay.evaluate(`${SHOWN_CARD}?.querySelector('button')?.textContent.trim()`)) ===
        'Weiter',
    await relay.evaluate(`${SHOWN_CARD}?.children[1].textContent.trim() ?? null`),
  )
  await relay.screenshot(join(out, 'desktop-relay-2-gateway.png'))
  await clickButton(relay, 'Weiter')
  await moveMouse(relay, 1, 1)
  const moved = Date.now()
  await relay.waitFor(`${CAMERA_NOW} === 'fly-out'`, 'the camera to fly back', 50)
  check(
    'relay: „Weiter“ sends the camera back at once while the message flies on',
    Date.now() - moved < 1500 && (await relay.evaluate(UNDER_WAY)),
    `${Date.now() - moved} ms`,
  )
  await relay.waitFor(`${CAMERA_NOW} === 'iso'`, 'the picture of the whole town', 300)
  check(
    'relay: the message is still on its way to the depot when the whole town is back',
    await relay.evaluate(UNDER_WAY),
  )
  await sleep(300)
  await relay.screenshot(join(out, 'desktop-relay-3-to-depot.png'))
  await relay.waitFor(`!${UNDER_WAY}`, 'the message to arrive', 300)
  check(
    'relay: from the probe to the depot the cameras are the flight over, the gateway, the flight back and the whole town',
    (await relay.evaluate(`window.__relay.join()`)) === 'to-gateway,gateway,fly-out,iso',
    await relay.evaluate(`window.__relay.join()`),
  )
  await relay.waitFor(`${STAGE}.dataset.dayHold === 'map'`, 'the map to show it', 100)
  await sleep(600)
  const NUMBERS = `[...document.querySelectorAll('#process [data-day-label]')].some((label) => label.dataset.shown === 'true' && /^[0-9]+$/.test(label.textContent.trim()))`
  check(
    'relay: once the message is in, a card in the whole town says the map shows who needs water, with the way on to the plan',
    (await relay.evaluate(CAMERA_NOW)) === 'iso' &&
      (await relay.evaluate(`${SHOWN_CARD}?.children[1].textContent.trim()`)) === MAP_TITLE &&
      (await relay.evaluate(`${SHOWN_CARD}?.querySelector('button')?.textContent.trim()`)) ===
        'Tour planen' &&
      (await relay.evaluate(STATUS)) === MAP_STATUS &&
      !(await relay.evaluate(NUMBERS)),
    `${await relay.evaluate(`${SHOWN_CARD}?.children[1].textContent.trim() ?? null`)}, ${await relay.evaluate(STATUS)}`,
  )
  await relay.screenshot(join(out, 'desktop-relay-4-map.png'))
  // A mouse on the card reads it: the hold waits.
  const onCard = await relay.evaluate(`(() => {
    const rect = ${SHOWN_CARD}.children[2].getBoundingClientRect()
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  })()`)
  await moveMouse(relay, onCard.x, onCard.y)
  await sleep(300)
  const HOLD_LEFT = `Number(document.querySelector('#process [data-day-root]').style.getPropertyValue('--day-hold') || 1)`
  const before = await relay.evaluate(HOLD_LEFT)
  await sleep(1200)
  const later = await relay.evaluate(HOLD_LEFT)
  check(
    'relay: the map waits while the mouse is on its card',
    before === later && (await relay.evaluate(`${STAGE}.dataset.dayHold`)) === 'map',
    `${before} then ${later}`,
  )
  await clickButton(relay, 'Tour planen')
  await moveMouse(relay, 1, 1)
  const planned = Date.now()
  await relay.waitFor(NUMBERS, 'the route to draw', 50)
  check(
    'relay: „Tour planen“ draws the route at once, the card goes and the bar announces the tour',
    Date.now() - planned < 1500 &&
      (await relay.evaluate(`${STAGE}.dataset.dayHold`)) === '' &&
      (await relay.evaluate(STATUS)).startsWith('Tour steht: 6 Halte'),
    `${Date.now() - planned} ms, ${await relay.evaluate(STATUS)}`,
  )
  await relay.waitFor(`${CAMERA_NOW} === 'fly-in'`, 'the tour to go on to the first tree', 600)
  check('relay: the truck sets out for the first tree afterwards', true)

  const DETAILS = `document.querySelector('#architecture details')`
  check('tech: the block for IT starts closed', !(await relay.evaluate(`${DETAILS}.open`)))
  await relay.click('#architecture summary')
  await sleep(300)
  check('tech: a click opens it', await relay.evaluate(`${DETAILS}.open`))
  await relay.screenshot(join(out, 'desktop-tech.png'))
} catch (error) {
  check(`relay: ${error.message}`, false)
} finally {
  relay.close()
}

const anchor = await openPage(sizes[0])
try {
  await anchor.goto(`${base}#architecture`)
  await anchor.waitFor(`document.getElementById('architecture') !== null`, 'the page')
  await sleep(1500)
  const landed = await anchor.evaluate(`(() => {
    const block = document.getElementById('architecture')
    return { top: block.getBoundingClientRect().top, open: block.querySelector('details').open }
  })()`)
  check(
    'tech: a link to #architecture lands on the block and opens it',
    landed.open && landed.top >= 0 && landed.top < 400,
    JSON.stringify(landed),
  )
} catch (error) {
  check(`tech: ${error.message}`, false)
} finally {
  anchor.close()
}

const still = await openPage({ width: 1440, height: 900, reducedMotion: true })
try {
  await load(still, { name: 'reduced motion' })
  await clickButton(still, 'Gießtag starten')
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
