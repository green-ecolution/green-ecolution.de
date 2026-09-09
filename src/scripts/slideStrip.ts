// Touch scrolls the strip natively, which already carries momentum and snaps.
// A mouse gets none of that, so pointer dragging is rebuilt here: the strip
// tracks the cursor one to one, the release projects where the throw was headed
// and a spring carries the remaining distance at the speed the hand let go.

const EDGE_TOLERANCE_PX = 2

// Below this the gesture is still a click, so text and buttons keep working.
const DRAG_THRESHOLD_PX = 8

// Apple's scroll deceleration constant. The projection it feeds is what turns a
// short flick into a long throw.
const DECELERATION_RATE = 0.998

// Critically damped, so the strip settles onto the slide without wobbling past
// it. Matches --ease-spring-settle, which does the same job for the buttons.
const SPRING_RESPONSE_S = 0.35

// Only the tail of the gesture decides the throw. Averaging the whole drag
// would let a slow start swallow a fast flick at the end.
const VELOCITY_WINDOW_MS = 100

const MAX_FRAME_S = 1 / 30
const SETTLED_PX = 0.5
const SETTLED_VELOCITY_PX_S = 8

let page: AbortController | null = null

function stepOf(strip: HTMLElement): number {
  const slide = strip.querySelector<HTMLElement>('[data-slide]')
  if (!slide) {
    return strip.clientWidth
  }

  // The gap belongs to the step: without it the strip drifts out of alignment
  // with the snap points after a few presses.
  const gap = Number.parseFloat(getComputedStyle(strip).columnGap) || 0
  return slide.offsetWidth + gap
}

// Where a throw would come to rest under exponential decay. This is the form
// apple ships; the v²/2a from physics class overshoots badly at low speeds.
function projectedDistance(velocity: number): number {
  return ((velocity / 1000) * DECELERATION_RATE) / (1 - DECELERATION_RATE)
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

interface Sample {
  x: number
  at: number
}

// Critically damped spring on scrollLeft, seeded with the release velocity so
// there is no seam between the drag and the animation. Interruptible: the
// caller keeps the handle and cancels the moment the pointer comes back down.
function springTo(
  strip: HTMLElement,
  target: number,
  velocity: number,
  onSettle: () => void,
): (() => void) | null {
  if (prefersReducedMotion()) {
    strip.scrollLeft = target
    onSettle()
    return null
  }

  const omega = (2 * Math.PI) / SPRING_RESPONSE_S
  let displacement = strip.scrollLeft - target
  let speed = velocity
  let previous = performance.now()
  let frame = requestAnimationFrame(tick)

  function tick(now: number) {
    // A tab that was in the background hands back a huge delta, which would
    // blow the integration up.
    const dt = Math.min((now - previous) / 1000, MAX_FRAME_S)
    previous = now

    const acceleration = -omega * omega * displacement - 2 * omega * speed
    speed += acceleration * dt
    displacement += speed * dt

    if (Math.abs(displacement) < SETTLED_PX && Math.abs(speed) < SETTLED_VELOCITY_PX_S) {
      strip.scrollLeft = target
      onSettle()
      return
    }

    strip.scrollLeft = target + displacement
    frame = requestAnimationFrame(tick)
  }

  return () => cancelAnimationFrame(frame)
}

function enableDragging(strip: HTMLElement, signal: AbortSignal) {
  let pointer: number | null = null
  let dragging = false
  let originX = 0
  let originScroll = 0
  let samples: Sample[] = []
  let cancelSpring: (() => void) | null = null

  const releaseVelocity = (): number => {
    const now = performance.now()
    const recent = samples.filter((sample) => now - sample.at <= VELOCITY_WINDOW_MS)
    const first = recent[0]
    const last = recent[recent.length - 1]
    if (!first || !last || last.at === first.at) {
      return 0
    }

    // Dragging left moves the content right, so the strip's velocity is the
    // pointer's, inverted.
    return -((last.x - first.x) / (last.at - first.at)) * 1000
  }

  // Mandatory snapping has to stay off until the strip is back on a snap
  // point. Restore it while the scroll offset sits between two, and the browser
  // yanks the strip to the nearest one and overrides the spring mid-flight.
  const restoreSnap = () => {
    strip.style.scrollSnapType = ''
  }

  const stop = () => {
    pointer = null
    if (!dragging) {
      // A click that stopped a spring leaves the strip off-grid, so hand it
      // back to the browser and let it settle.
      restoreSnap()
      return
    }

    dragging = false
    delete strip.dataset.dragging

    const step = stepOf(strip)
    const velocity = releaseVelocity()
    const maxScroll = strip.scrollWidth - strip.clientWidth
    const projected = strip.scrollLeft + projectedDistance(velocity)
    const index = Math.round(projected / step)
    const target = Math.min(Math.max(index * step, 0), maxScroll)

    cancelSpring = springTo(strip, target, velocity, restoreSnap)
  }

  strip.dataset.draggable = ''

  strip.addEventListener(
    'pointerdown',
    (event) => {
      if (event.pointerType === 'touch' || event.button !== 0) {
        return
      }

      // Grabbing a strip in flight has to take it over from where it is, not
      // from where it was headed.
      cancelSpring?.()
      cancelSpring = null
      strip.style.scrollSnapType = 'none'

      pointer = event.pointerId
      originX = event.clientX
      originScroll = strip.scrollLeft
      samples = [{ x: event.clientX, at: performance.now() }]
    },
    { signal },
  )

  strip.addEventListener(
    'pointermove',
    (event) => {
      if (pointer !== event.pointerId) {
        return
      }

      samples.push({ x: event.clientX, at: performance.now() })
      if (samples.length > 8) {
        samples.shift()
      }

      const travelled = event.clientX - originX
      if (!dragging) {
        if (Math.abs(travelled) < DRAG_THRESHOLD_PX) {
          return
        }

        dragging = true
        strip.dataset.dragging = ''
        strip.setPointerCapture(event.pointerId)
      }

      // Keeps the browser from starting a text or image drag mid-gesture.
      event.preventDefault()
      strip.scrollLeft = originScroll - travelled
    },
    { signal },
  )

  for (const type of ['pointerup', 'pointercancel'] as const) {
    strip.addEventListener(type, stop, { signal })
  }

  strip.addEventListener('dragstart', (event) => event.preventDefault(), { signal })
}

export function setup() {
  page?.abort()
  page = new AbortController()
  const { signal } = page

  for (const strip of document.querySelectorAll<HTMLElement>('[data-slide-strip]')) {
    const controls = document.querySelectorAll<HTMLButtonElement>(
      `[data-slide-strip-control][data-for="${strip.id}"]`,
    )
    const readout = document.querySelector<HTMLElement>(`[data-slide-position="${strip.id}"]`)
    const total = strip.querySelectorAll('[data-slide]').length
    // Server-rendered with page 1 filled in, so the template survives a reload
    // without javascript and only the number has to be swapped afterwards.
    const template = readout?.textContent?.trim() ?? ''

    const sync = () => {
      const maxScroll = strip.scrollWidth - strip.clientWidth
      for (const control of controls) {
        control.hidden = false
        const back = control.dataset.slideStripControl === 'previous'
        const atEdge = back
          ? strip.scrollLeft <= EDGE_TOLERANCE_PX
          : strip.scrollLeft >= maxScroll - EDGE_TOLERANCE_PX
        control.disabled = maxScroll <= EDGE_TOLERANCE_PX || atEdge
      }

      if (readout && template) {
        const page = Math.min(total, Math.round(strip.scrollLeft / stepOf(strip)) + 1)
        readout.textContent = template.replace(/\d+/, String(page))
      }
    }

    for (const control of controls) {
      control.addEventListener(
        'click',
        () => {
          const direction = control.dataset.slideStripControl === 'previous' ? -1 : 1
          strip.scrollBy({ left: direction * stepOf(strip), behavior: 'smooth' })
        },
        { signal },
      )
    }

    strip.addEventListener('scroll', sync, { passive: true, signal })
    window.addEventListener('resize', sync, { signal })
    enableDragging(strip, signal)
    sync()
  }
}

document.addEventListener('astro:page-load', setup)
