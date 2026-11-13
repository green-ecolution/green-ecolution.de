// Photographs the four stills of the how-it-works story off the dev server.
//   node scripts/render-story-stills.mjs                                   posters for the site
//   node scripts/render-story-stills.mjs --labels --size=1000x625 --scale=5 out   labelled, for print
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

const args = process.argv.slice(2)
const option = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3)
const labels = args.includes('--labels')
const scale = Number(option('scale') ?? 1)
const [width, height] = (option('size') ?? '1600x1000').split('x').map(Number)
const out = args.find((arg) => !arg.startsWith('--')) ?? 'src/assets/illustrations'
const base = process.env.STORY_URL ?? 'http://localhost:4321/de'
const chromium = process.env.CHROMIUM ?? 'chromium'
const attempts = 4
// A scene-less capture is a plain gradient, about 0.013 bytes per pixel.
const minBytesPerPixel = 0.05

mkdirSync(out, { recursive: true })

// Driven over the DevTools protocol because the headless window is smaller than
// --window-size asks for (no scrollbar and browser chrome are subtracted), so a
// flag-only screenshot never has the requested size. The metrics override gives
// exactly width x height css pixels, and the page can be awaited until the model
// has faded in instead of guessing a time budget.
const profile = mkdtempSync(join(tmpdir(), 'story-stills-'))
const browser = spawn(
  chromium,
  [
    '--headless',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--hide-scrollbars',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
)

const cleanup = () => {
  browser.kill()
  rmSync(profile, { recursive: true, force: true })
}
process.on('exit', cleanup)

async function debuggerUrl() {
  for (let i = 0; i < 100; i++) {
    try {
      const [port] = readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')
      const response = await fetch(`http://127.0.0.1:${port}/json/version`)
      return (await response.json()).webSocketDebuggerUrl
    } catch {
      await sleep(100)
    }
  }
  throw new Error(`could not reach ${chromium}`)
}

const socket = new WebSocket(await debuggerUrl())
await new Promise((resolve, reject) => {
  socket.onopen = resolve
  socket.onerror = reject
})

let nextId = 0
const pending = new Map()
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data)
  const call = pending.get(message.id)
  if (!call) return
  pending.delete(message.id)
  if (message.error) call.reject(new Error(message.error.message))
  else call.resolve(message.result)
}

const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const id = ++nextId
    pending.set(id, { resolve, reject })
    socket.send(JSON.stringify({ id, method, params, sessionId }))
  })

const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
const page = (method, params) => send(method, params, sessionId)

await page('Emulation.setDeviceMetricsOverride', {
  width,
  height,
  deviceScaleFactor: scale,
  mobile: false,
})

const evaluate = async (expression) =>
  (await page('Runtime.evaluate', { expression, returnByValue: true })).result.value

async function capture(act, file) {
  await page('Page.navigate', {
    url: `${base}?storyStill=${act}${labels ? '&storyLabels' : ''}`,
  })

  const ready = `document.documentElement.dataset.storyCapture !== undefined &&
    document.querySelector('[data-story-root]')?.dataset.modelReady !== undefined`
  for (let i = 0; !(await evaluate(ready)); i++) {
    if (i >= 600) throw new Error('the model did not become ready (WebGL missing?)')
    await sleep(100)
  }
  // Lets the model's fade-in finish.
  await sleep(1500)

  const { data } = await page('Page.captureScreenshot', { format: 'png' })
  writeFileSync(file, Buffer.from(data, 'base64'))
  if (statSync(file).size < width * height * scale * scale * minBytesPerPixel) {
    throw new Error('the picture looks empty')
  }
}

let failed = false
for (const act of [0, 1, 2, 3]) {
  const file = join(out, `story-act-${act + 1}.png`)
  for (let attempt = 1; ; attempt++) {
    try {
      await capture(act, file)
      console.log(file)
      break
    } catch (error) {
      console.error(`act ${act + 1}, attempt ${attempt}/${attempts}: ${error.message}`)
      if (attempt === attempts) {
        failed = true
        break
      }
    }
  }
}

socket.close()
cleanup()
if (failed) {
  console.error('Some stills could not be captured. Is the dev server running at ' + base + '?')
  process.exit(1)
}
