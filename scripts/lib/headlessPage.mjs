// Starts a headless chromium with webgl and hands back one page to drive over
// the DevTools protocol. Node's own WebSocket, no dependency.
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

export { sleep }

export async function openPage({
  width,
  height,
  scale = 1,
  mobile = false,
  reducedMotion = false,
  webgl = true,
}) {
  const chromium = process.env.CHROMIUM ?? 'chromium'
  const profile = mkdtempSync(join(tmpdir(), 'headless-page-'))
  const gpuFlags = webgl
    ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    : ['--disable-gpu', '--disable-software-rasterizer']
  const browser = spawn(
    chromium,
    [
      '--headless',
      ...gpuFlags,
      '--hide-scrollbars',
      '--remote-debugging-port=0',
      `--user-data-dir=${profile}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  )

  const close = () => {
    browser.kill()
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  }
  process.on('exit', close)

  let endpoint
  for (let i = 0; i < 100 && !endpoint; i++) {
    try {
      const [port] = readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')
      endpoint = (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json())
        .webSocketDebuggerUrl
    } catch {
      await sleep(100)
    }
  }
  if (!endpoint) throw new Error(`could not reach ${chromium}`)

  const socket = new WebSocket(endpoint)
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
  const call = (method, params) => send(method, params, sessionId)

  await call('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: scale,
    mobile,
  })
  if (mobile) await call('Emulation.setTouchEmulationEnabled', { enabled: true })
  if (reducedMotion) {
    await call('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    })
  }

  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await call('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })
    if (exceptionDetails)
      throw new Error(exceptionDetails.exception?.description ?? 'evaluate failed')
    return result.value
  }

  return {
    call,
    evaluate,
    close: () => {
      socket.close()
      close()
    },
    async goto(url) {
      const { errorText } = await call('Page.navigate', { url })
      if (errorText) throw new Error(`could not load ${url}: ${errorText}`)
    },
    async waitFor(expression, what, tries = 300) {
      for (let i = 0; i < tries; i++) {
        if (await evaluate(expression)) return
        await sleep(100)
      }
      throw new Error(`timed out waiting for ${what}`)
    },
    async screenshot(file) {
      const { data } = await call('Page.captureScreenshot', { format: 'png' })
      writeFileSync(file, Buffer.from(data, 'base64'))
    },
    /** A real mouse click on the middle of the first element the selector finds. */
    async click(selector) {
      const box = await evaluate(`(() => {
        const node = document.querySelector(${JSON.stringify(selector)})
        if (!node) return null
        // The site scrolls smoothly; measuring before it arrives misses the target.
        node.scrollIntoView({ block: 'center', behavior: 'instant' })
        const rect = node.getBoundingClientRect()
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      })()`)
      if (!box) throw new Error(`nothing matches ${selector}`)
      for (const type of ['mousePressed', 'mouseReleased']) {
        await call('Input.dispatchMouseEvent', { type, ...box, button: 'left', clickCount: 1 })
      }
    },
  }
}
