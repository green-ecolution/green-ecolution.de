import {
  crossedRing,
  grabString,
  ringGive,
  ringPath,
  ringPointCount,
  stepString,
  type RingString,
  type StringShape,
} from '../lib/growthRings'

// Side length of the drawing's viewBox.
const VIEW = 400
// How close the pointer has to come for a ring to catch on it, and how far the
// ring lets itself be pulled before it slips off and swings.
const GRAB = 8
const RELEASE = 20
// A pointer too fast to be caught still strums the ring it jumps over.
const STRUM = 11
const TENSION = 2400
const DAMPING = 3
// Swings per second, from the innermost ring to the outermost: the longer the
// string, the lower its note.
const PITCH_INNER = 4.2
const PITCH_OUTER = 2.4
// A press sends a ripple outwards: each ring gets this push on all its points.
const RIPPLE_KICK = 170
const RIPPLE_DELAY_MS = 55
const STEP_S = 1 / 120
const MAX_FRAME_S = 1 / 30
const REST = 0.02

interface Ring {
  path: SVGPathElement
  radius: number
  turn: number
  string: RingString
  shape: StringShape
  // Share of a pull this ring follows; small rings are stiffer.
  give: number
  // Where the pointer holds the ring: its angle and how far it pulls.
  held: { angle: number; pull: number } | null
}

let page: AbortController | null = null

function setup() {
  page?.abort()
  page = new AbortController()
  const { signal } = page

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  for (const drawing of document.querySelectorAll<SVGSVGElement>('[data-rings]')) {
    const surface = drawing.closest<HTMLElement>('section')
    if (!surface) continue

    const paths = [...drawing.querySelectorAll<SVGPathElement>('[data-ring]')]
    const outermost = Math.max(...paths.map((path) => Number(path.dataset.radius)))
    const rings: Ring[] = paths.map((path, index) => {
      const radius = Number(path.dataset.radius)
      const count = ringPointCount(radius)
      const share = paths.length > 1 ? index / (paths.length - 1) : 0
      const pitch = PITCH_INNER + (PITCH_OUTER - PITCH_INNER) * share
      return {
        path,
        radius,
        turn: Number(path.dataset.turn),
        string: { offset: new Float32Array(count), speed: new Float32Array(count) },
        shape: { tension: TENSION, stiffness: (2 * Math.PI * pitch) ** 2, damping: DAMPING },
        give: ringGive(radius, outermost),
        held: null,
      }
    })

    let distance: number | null = null
    let frame = 0
    let last = 0

    // The pointer in the drawing's own units, measured from its centre.
    const locate = (event: PointerEvent) => {
      const rect = drawing.getBoundingClientRect()
      if (rect.width === 0) return null
      const unit = VIEW / rect.width
      return {
        x: (event.clientX - rect.left - rect.width / 2) * unit,
        y: (event.clientY - rect.top - rect.height / 2) * unit,
      }
    }

    const tick = (now: number) => {
      const elapsed = Math.min((now - last) / 1000, MAX_FRAME_S)
      last = now
      const steps = Math.max(1, Math.round(elapsed / STEP_S))
      let moving = false

      for (const ring of rings) {
        for (let step = 0; step < steps; step++) {
          stepString(ring.string, STEP_S, ring.shape)
          // The held place stays under the pointer while the rest swings.
          if (ring.held) {
            grabString(ring.string, ring.held.angle, ring.held.pull, ring.radius, ring.turn)
          }
        }
        ring.path.setAttribute('d', ringPath(ring.radius, ring.string.offset, ring.turn))

        const { offset, speed } = ring.string
        const swinging = speed.some((value) => Math.abs(value) > REST)
        const displaced = !ring.held && offset.some((value) => Math.abs(value) > REST)
        if (swinging || displaced) moving = true
      }

      frame = moving ? window.requestAnimationFrame(tick) : 0
    }

    const wake = () => {
      if (frame !== 0) return
      last = performance.now()
      frame = window.requestAnimationFrame(tick)
    }

    const release = () => {
      distance = null
      for (const ring of rings) ring.held = null
      wake()
    }

    surface.addEventListener(
      'pointermove',
      (event) => {
        const at = locate(event)
        if (!at) return
        const now = Math.hypot(at.x, at.y)
        const angle = Math.atan2(at.y, at.x)

        for (const ring of rings) {
          const apart = now - ring.radius
          const pull = apart * ring.give
          if (ring.held) {
            ring.held = Math.abs(apart) > RELEASE ? null : { angle, pull }
          } else if (Math.abs(apart) <= GRAB) {
            ring.held = { angle, pull }
          } else if (distance !== null && crossedRing(distance, now, ring.radius)) {
            const strum = Math.sign(apart) * STRUM * ring.give
            grabString(ring.string, angle, strum, ring.radius, ring.turn)
          }
        }
        distance = now
        wake()
      },
      { passive: true, signal },
    )
    surface.addEventListener('pointerleave', release, { signal })

    const timers = new Set<number>()
    surface.addEventListener(
      'pointerdown',
      (event) => {
        const at = locate(event)
        if (!at || Math.hypot(at.x, at.y) > outermost + GRAB) return
        rings.forEach((ring, index) => {
          const timer = window.setTimeout(() => {
            timers.delete(timer)
            ring.string.speed.forEach((value, point) => {
              ring.string.speed[point] = value + RIPPLE_KICK * ring.give
            })
            wake()
          }, index * RIPPLE_DELAY_MS)
          timers.add(timer)
        })
      },
      { signal },
    )

    signal.addEventListener('abort', () => {
      if (frame !== 0) window.cancelAnimationFrame(frame)
      timers.forEach((timer) => window.clearTimeout(timer))
    })
  }
}

document.addEventListener('astro:page-load', setup)
