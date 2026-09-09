interface SpringOptions {
  from: number
  to: number
  /** Release velocity of the gesture in px/s. Carried into the animation so the
      handover from finger to physics has no visible seam. */
  velocity?: number
  /** 1 settles without overshoot; below that it bounces. */
  damping?: number
  /** Seconds to reach the target. Not a duration: the settle time follows from
      the physics, this only sets how eager the pull is. */
  response?: number
  /** Close enough to the target to stop. Defaults suit px; a spring driving a
      unitless value such as a scale factor has to pass its own. */
  restDistance?: number
  restVelocity?: number
  onFrame: (value: number) => void
  onRest?: () => void
}

const REST_DISTANCE_PX = 0.5
const REST_VELOCITY_PX_S = 10
const MAX_STEP_S = 1 / 30

// A spring rather than a transition, because a transition cannot be grabbed
// halfway and redirected: it always replays from its own start value.
export function spring({
  from,
  to,
  velocity = 0,
  damping = 1,
  response = 0.3,
  restDistance = REST_DISTANCE_PX,
  restVelocity = REST_VELOCITY_PX_S,
  onFrame,
  onRest,
}: SpringOptions) {
  const omega = (2 * Math.PI) / response
  let value = from
  let speed = velocity
  let last = performance.now()
  let frame = 0

  const step = (now: number) => {
    // A backgrounded tab hands back one enormous delta, which would integrate
    // into a jump across the screen.
    const dt = Math.min((now - last) / 1000, MAX_STEP_S)
    last = now

    const acceleration = -omega * omega * (value - to) - 2 * damping * omega * speed
    speed += acceleration * dt
    value += speed * dt

    if (Math.abs(value - to) < restDistance && Math.abs(speed) < restVelocity) {
      onFrame(to)
      onRest?.()
      return
    }

    onFrame(value)
    frame = requestAnimationFrame(step)
  }

  frame = requestAnimationFrame(step)

  return () => cancelAnimationFrame(frame)
}

const DECELERATION_RATE = 0.998

// Where a flick would come to rest if nothing stopped it. Snapping to the
// nearest edge from the release point instead would ignore the throw entirely.
export function projectMomentum(velocity: number, decelerationRate = DECELERATION_RATE) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate)
}

// Real things slow down before they stop. Past the edge the drawer follows the
// finger less and less instead of simply refusing to move.
export function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot))
}
