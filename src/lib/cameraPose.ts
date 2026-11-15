export type Vec3 = readonly [number, number, number]

export interface CameraPose {
  position: Vec3
  target: Vec3
  /** Vertical field of view in degrees. */
  fov: number
  /**
   * Lens shift: where the picture's centre lies off the line of sight, in half
   * picture widths and heights. The camera keeps facing `target`.
   */
  shift?: readonly [number, number]
}

const NO_SHIFT = [0, 0] as const

/** From `a` to `b` by ratio rather than difference. */
export const geometric = (a: number, b: number, share: number) => a ** (1 - share) * b ** share

const halfTan = (fov: number) => Math.tan((fov * Math.PI) / 360)
const fromHalfTan = (tan: number) => (Math.atan(tan) * 360) / Math.PI

/**
 * A perspective camera that draws nearly the picture of an orthographic one
 * looking at `target` from `direction` and showing `height` world units.
 */
export function matchedPose(
  target: Vec3,
  direction: Vec3,
  height: number,
  fov: number,
): CameraPose {
  const distance = height / (2 * halfTan(fov))
  const norm = Math.hypot(direction[0], direction[1], direction[2])
  return {
    position: [
      target[0] + (direction[0] / norm) * distance,
      target[1] + (direction[1] / norm) * distance,
      target[2] + (direction[2] / norm) * distance,
    ],
    target,
    fov,
  }
}

/**
 * Between two poses whose distances may differ a hundredfold: the target moves
 * straight, the camera swings round it and closes in by ratio, and the lens
 * widens by ratio, so every part of the move keeps an even pace on screen.
 */
export function blendPoses(a: CameraPose, b: CameraPose, share: number): CameraPose {
  const target: Vec3 = [
    a.target[0] + (b.target[0] - a.target[0]) * share,
    a.target[1] + (b.target[1] - a.target[1]) * share,
    a.target[2] + (b.target[2] - a.target[2]) * share,
  ]
  const fromA = a.position.map((value, axis) => value - a.target[axis])
  const fromB = b.position.map((value, axis) => value - b.target[axis])
  const lengthA = Math.hypot(fromA[0], fromA[1], fromA[2])
  const lengthB = Math.hypot(fromB[0], fromB[1], fromB[2])
  const unitA = fromA.map((value) => value / lengthA)
  const unitB = fromB.map((value) => value / lengthB)

  const cos = Math.min(
    1,
    Math.max(-1, unitA[0] * unitB[0] + unitA[1] * unitB[1] + unitA[2] * unitB[2]),
  )
  const angle = Math.acos(cos)
  let direction: number[]
  if (angle < 1e-6) {
    direction = unitA
  } else {
    const sin = Math.sin(angle)
    const weightA = Math.sin((1 - share) * angle) / sin
    const weightB = Math.sin(share * angle) / sin
    direction = unitA.map((value, axis) => value * weightA + unitB[axis] * weightB)
  }

  const distance = geometric(lengthA, lengthB, share)
  const [fromX, fromY] = a.shift ?? NO_SHIFT
  const [toX, toY] = b.shift ?? NO_SHIFT
  return {
    position: [
      target[0] + direction[0] * distance,
      target[1] + direction[1] * distance,
      target[2] + direction[2] * distance,
    ],
    target,
    fov: fromHalfTan(geometric(halfTan(a.fov), halfTan(b.fov), share)),
    shift: [fromX + (toX - fromX) * share, fromY + (toY - fromY) * share],
  }
}

/** Where a point lands in the picture, -1 to 1 from left to right and bottom to top; null behind the camera. */
export function projected(pose: CameraPose, aspect: number, point: Vec3): [number, number] | null {
  const forward = unit([
    pose.target[0] - pose.position[0],
    pose.target[1] - pose.position[1],
    pose.target[2] - pose.position[2],
  ])
  const right = unit([-forward[2], 0, forward[0]])
  const up: Vec3 = [
    right[1] * forward[2] - right[2] * forward[1],
    right[2] * forward[0] - right[0] * forward[2],
    right[0] * forward[1] - right[1] * forward[0],
  ]
  const away: Vec3 = [
    point[0] - pose.position[0],
    point[1] - pose.position[1],
    point[2] - pose.position[2],
  ]
  const depth = dot(away, forward)
  if (depth <= 1e-9) return null
  const tan = halfTan(pose.fov)
  const [shiftX, shiftY] = pose.shift ?? NO_SHIFT
  return [dot(away, right) / depth / (tan * aspect) - shiftX, dot(away, up) / depth / tan - shiftY]
}

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

function unit(v: Vec3): Vec3 {
  const length = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / length, v[1] / length, v[2] / length]
}
