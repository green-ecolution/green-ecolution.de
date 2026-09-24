#!/usr/bin/env node
// Records the 30-second spot for an advertising wall as an MP4.
//
// The spot is the page /<lang>/showcase/spot, played once. There is no video
// export in the browser, so it is filmed: a virtual X display of exactly
// 1920 × 1080, Chromium in kiosk mode on it, and ffmpeg on that display.
//
//   pnpm showcase:build   # once, so dist/ carries the clips locally
//   pnpm showcase:spot
//
// Needs Xvfb, ffmpeg and chromium on PATH, and an ffmpeg built with x11grab.
// On NixOS the default ffmpeg is not: it has no screen capture device at all,
// so this asks for ffmpeg-full.
//
//   nix shell nixpkgs#xvfb nixpkgs#ffmpeg-full nixpkgs#chromium
//
// The run is timed rather than cut by hand: the page holds its first frame
// until this script releases it, and holds its last one afterwards, so the
// 30 seconds are taken out of a longer recording without either end landing
// inside a moving picture.
import { spawn } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const SPOT_SECONDS = 30
const WIDTH = 1920
const HEIGHT = 1080
// Recorded a little early on purpose: a head that starts before the release
// shows more of the held first frame, while a head that starts late cuts into
// the opening move. The tail it costs is held closing card.
const LEAD_IN_SECONDS = 0.2

const options = parseArgs(process.argv.slice(2))
const display = `:${options.display}`
const url = `http://127.0.0.1:${options.port}/${options.lang}/showcase/spot?hold`

function parseArgs(argv) {
  const values = {
    lang: 'de',
    fps: 60,
    port: Number(process.env.SHOWCASE_PORT ?? 4331),
    display: 99,
    out: join(root, 'out', 'spot'),
    keepRaw: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const [flag, inline] = argv[index].split('=')
    const next = () => inline ?? argv[++index]

    switch (flag) {
      case '--lang':
        values.lang = next()
        break
      case '--fps':
        values.fps = Number(next())
        break
      case '--port':
        values.port = Number(next())
        break
      case '--display':
        values.display = Number(next())
        break
      case '--out':
        values.out = resolve(next())
        break
      case '--keep-raw':
        values.keepRaw = true
        break
      default:
        fail(`Unbekannte Option: ${flag}`)
    }
  }

  return values
}

function fail(message) {
  console.error(message)
  process.exit(1)
}

function sleep(ms) {
  return new Promise((done) => setTimeout(done, ms))
}

async function hasBinary(name) {
  return new Promise((done) => {
    const probe = spawn(name, ['--help'], { stdio: 'ignore' })
    probe.on('error', () => done(false))
    probe.on('exit', () => done(true))
  })
}

async function findChromium() {
  for (const candidate of ['chromium', 'chromium-browser', 'google-chrome']) {
    if (await hasBinary(candidate)) return candidate
  }
  return null
}

const started = []

function start(command, args, env = {}) {
  const child = spawn(command, args, {
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.on('error', (error) => fail(`${command} konnte nicht starten: ${error.message}`))
  started.push(child)
  return child
}

function stopAll() {
  for (const child of started.reverse()) {
    child.kill('SIGTERM')
  }
}

process.on('SIGINT', () => {
  stopAll()
  process.exit(130)
})

// One command, awaited to completion, with its stderr kept for the summary.
function run(command, args) {
  return new Promise((done, failed) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => (stdout += chunk))
    child.stderr.on('data', (chunk) => (stderr += chunk))
    child.on('error', failed)
    child.on('exit', (code) =>
      code === 0 ? done({ stdout, stderr }) : failed(new Error(`${command}: ${stderr.trim()}`)),
    )
  })
}

async function waitFor(description, attempts, check) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await check()) return
    await sleep(500)
  }
  fail(`Zeitüberschreitung: ${description}`)
}

// Chromium's debugging endpoint, used for the two things the page cannot do on
// its own: telling the recorder it is ready, and being released on cue.
async function pageSocket(debugPort) {
  const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`)
  const targets = await response.json()
  const page = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl)
  if (!page) return null

  const socket = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((open, broken) => {
    socket.addEventListener('open', open, { once: true })
    socket.addEventListener('error', broken, { once: true })
  })
  return socket
}

let messageId = 0

function evaluate(socket, expression) {
  const id = ++messageId
  return new Promise((done, failed) => {
    const onMessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.id !== id) return
      socket.removeEventListener('message', onMessage)
      if (message.error) {
        failed(new Error(message.error.message))
        return
      }
      done(message.result?.result?.value)
    }
    socket.addEventListener('message', onMessage)
    socket.send(
      JSON.stringify({
        id,
        method: 'Runtime.evaluate',
        params: { expression, returnByValue: true },
      }),
    )
  })
}

const HELD = 'typeof window.__showcaseStart === "function"'

async function playOnce(socket, seconds) {
  await waitFor('die Seite hält ihr erstes Bild', 60, () => evaluate(socket, HELD))
  await evaluate(socket, 'window.__showcaseStart()')
  await sleep(seconds * 1000)
}

if (!statSync(join(root, 'dist'), { throwIfNoEntry: false })?.isDirectory()) {
  fail("dist/ fehlt. Erst 'pnpm showcase:build' ausführen.")
}

const chromium = await findChromium()
if (!chromium) fail('Kein Chromium gefunden.')
const NIX_HINT = 'Unter NixOS: nix shell nixpkgs#xvfb nixpkgs#ffmpeg-full nixpkgs#chromium'

for (const binary of ['Xvfb', 'ffmpeg', 'ffprobe']) {
  if (!(await hasBinary(binary))) {
    fail(`${binary} nicht gefunden. ${NIX_HINT}`)
  }
}

// An ffmpeg without x11grab dies on the first frame with nothing but an
// unknown-option message, which reads like a mistake in the call rather than a
// build that cannot film a screen at all.
const devices = await run('ffmpeg', ['-hide_banner', '-devices'])
if (!devices.stdout.includes('x11grab')) {
  fail(`Dieses ffmpeg kennt kein x11grab und kann keinen Bildschirm aufnehmen. ${NIX_HINT}`)
}

mkdirSync(options.out, { recursive: true })
const profile = mkdtempSync(join(tmpdir(), 'spot-chromium-'))
const rawPath = join(options.out, 'spot-raw.mkv')
const outPath = join(options.out, `green-ecolution-spot-30s-${options.lang}.mp4`)
const debugPort = options.port + 1

try {
  start('Xvfb', [display, '-screen', '0', `${WIDTH}x${HEIGHT}x24`, '-nolisten', 'tcp'])
  start('node', [join(root, 'scripts', 'showcase-server.mjs'), join(root, 'dist')], {
    SHOWCASE_PORT: String(options.port),
  })

  await waitFor('der lokale Server antwortet', 40, () =>
    fetch(url)
      .then((response) => response.ok)
      .catch(() => false),
  )

  start(
    chromium,
    [
      '--kiosk',
      '--incognito',
      '--noerrdialogs',
      '--disable-infobars',
      '--hide-scrollbars',
      '--autoplay-policy=no-user-gesture-required',
      '--force-device-scale-factor=1',
      `--window-size=${WIDTH},${HEIGHT}`,
      '--window-position=0,0',
      `--user-data-dir=${profile}`,
      `--remote-debugging-port=${debugPort}`,
      '--no-first-run',
      '--ozone-platform=x11',
      url,
    ],
    { DISPLAY: display },
  )

  let socket = null
  await waitFor('Chromium meldet sich am Debug-Port', 60, async () => {
    socket = await pageSocket(debugPort).catch(() => null)
    return socket !== null
  })

  // A dry run before the take. The screencasts are mounted with their scene,
  // so on a cold cache the map clip would still be loading when its scene is
  // already on screen. After one full pass everything is in Chromium's cache.
  console.log('Vorlauf: ein Durchgang, damit Clips und Bilder im Cache liegen.')
  await playOnce(socket, SPOT_SECONDS + 1)

  // Reloading rather than reusing the finished run: the clock only moves
  // forward, so a second take needs a fresh page.
  await evaluate(socket, `window.location.href = ${JSON.stringify(url)}`)
  socket.close()
  socket = null

  await sleep(2000)
  let takeSocket = null
  await waitFor('die Seite ist nach dem Neuladen bereit', 60, async () => {
    takeSocket = await pageSocket(debugPort).catch(() => null)
    return takeSocket !== null && (await evaluate(takeSocket, HELD).catch(() => false))
  })

  console.log('Aufnahme läuft.')
  const capture = start('ffmpeg', [
    '-y',
    '-f',
    'x11grab',
    '-draw_mouse',
    '0',
    '-video_size',
    `${WIDTH}x${HEIGHT}`,
    '-framerate',
    String(options.fps),
    '-i',
    display,
    '-c:v',
    'libx264',
    '-preset',
    'ultrafast',
    '-crf',
    '12',
    '-t',
    String(SPOT_SECONDS + 6),
    rawPath,
  ])
  const captureStartedAt = Date.now()
  let captureLog = ''
  capture.stderr.on('data', (chunk) => (captureLog += chunk))
  // Attached now rather than after the release below: ffmpeg that refuses the
  // display is gone in a fraction of a second, and a listener added afterwards
  // would wait for an exit that has already happened.
  const captureDone = new Promise((done) => capture.on('exit', done))

  // Long enough for ffmpeg to have the display open. Precision here does not
  // decide the cut: the offset below is measured, not assumed.
  await sleep(1500)
  await evaluate(takeSocket, 'window.__showcaseStart()')
  const releasedAt = Date.now()

  const captureCode = await captureDone
  if (captureCode !== 0) {
    fail(
      `ffmpeg hat die Aufnahme abgebrochen:\n${captureLog.trim().split('\n').slice(-6).join('\n')}`,
    )
  }

  const offset = Math.max(0, (releasedAt - captureStartedAt) / 1000 - LEAD_IN_SECONDS)

  console.log(`Schnitt bei ${offset.toFixed(2)} s, Länge ${SPOT_SECONDS} s.`)
  await run('ffmpeg', [
    '-y',
    '-ss',
    offset.toFixed(3),
    '-i',
    rawPath,
    '-t',
    String(SPOT_SECONDS),
    '-an',
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '16',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    outPath,
  ])

  const probe = await run('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-count_frames',
    '-show_entries',
    'stream=nb_read_frames,avg_frame_rate,width,height',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1',
    outPath,
  ])

  const frames = Number(/nb_read_frames=(\d+)/.exec(probe.stdout)?.[1] ?? 0)
  const expected = SPOT_SECONDS * options.fps
  // ffmpeg's last progress line says how many frames the display actually gave
  // it. Fewer than asked for means the machine dropped some while filming.
  const captured = Number([...captureLog.matchAll(/frame=\s*(\d+)/g)].pop()?.[1] ?? 0)

  console.log(probe.stdout.trim())
  if (frames < expected - options.fps) {
    console.warn(
      `Achtung: ${frames} Bilder statt ${expected}. Die Maschine kam bei der Aufnahme nicht mit.`,
    )
  }
  const expectedCapture = (SPOT_SECONDS + 6) * options.fps
  if (captured && captured < expectedCapture * 0.98) {
    console.warn(
      `Achtung: ffmpeg hat ${captured} statt ${expectedCapture} Bilder abgegriffen, es sind also welche ausgefallen.`,
    )
  }

  console.log(`Fertig: ${outPath}`)
} finally {
  stopAll()
  if (!options.keepRaw) rmSync(rawPath, { force: true })
  rmSync(profile, { recursive: true, force: true })
}
