export type GroundPoint = readonly [number, number]

export interface PathPoint {
  at: GroundPoint
  /** Direction of travel as an angle about the vertical axis, 0 facing +z. */
  heading: number
}

/** Replaces every corner by a curve that leaves and joins the legs at `radius`. */
export function roundedPath(
  points: readonly GroundPoint[],
  radius: number,
  steps = 8,
): GroundPoint[] {
  if (points.length < 3) return [...points]
  const path: GroundPoint[] = [points[0]]

  for (let i = 1; i < points.length - 1; i++) {
    const [ax, az] = points[i - 1]
    const [bx, bz] = points[i]
    const [cx, cz] = points[i + 1]
    const inLength = Math.hypot(bx - ax, bz - az)
    const outLength = Math.hypot(cx - bx, cz - bz)
    const cut = Math.min(radius, inLength / 2, outLength / 2)
    const startX = bx + ((ax - bx) / inLength) * cut
    const startZ = bz + ((az - bz) / inLength) * cut
    const endX = bx + ((cx - bx) / outLength) * cut
    const endZ = bz + ((cz - bz) / outLength) * cut

    for (let step = 0; step <= steps; step++) {
      const t = step / steps
      const u = 1 - t
      path.push([
        u * u * startX + 2 * u * t * bx + t * t * endX,
        u * u * startZ + 2 * u * t * bz + t * t * endZ,
      ])
    }
  }

  path.push(points[points.length - 1])
  return path
}

function legLengths(points: readonly GroundPoint[]): number[] {
  return points
    .slice(1)
    .map(([x, z], index) => Math.hypot(x - points[index][0], z - points[index][1]))
}

export function pathLength(points: readonly GroundPoint[]): number {
  return legLengths(points).reduce((sum, length) => sum + length, 0)
}

export function pointAlong(points: readonly GroundPoint[], t: number): PathPoint {
  const lengths = legLengths(points)
  const total = lengths.reduce((sum, length) => sum + length, 0)
  let left = Math.min(1, Math.max(0, t)) * total
  let leg = 0
  while (leg < lengths.length - 1 && left > lengths[leg]) {
    left -= lengths[leg]
    leg++
  }

  const [ax, az] = points[leg]
  const [bx, bz] = points[leg + 1]
  const share = lengths[leg] === 0 ? 0 : left / lengths[leg]
  return {
    at: [ax + (bx - ax) * share, az + (bz - az) * share],
    heading: Math.atan2(bx - ax, bz - az),
  }
}

export function fractionNear(points: readonly GroundPoint[], target: GroundPoint): number {
  const lengths = legLengths(points)
  const total = lengths.reduce((sum, length) => sum + length, 0)
  let best = 0
  let bestDistance = Infinity
  let before = 0

  lengths.forEach((length, leg) => {
    const [ax, az] = points[leg]
    const [bx, bz] = points[leg + 1]
    const share =
      length === 0
        ? 0
        : Math.min(
            1,
            Math.max(
              0,
              ((target[0] - ax) * (bx - ax) + (target[1] - az) * (bz - az)) / (length * length),
            ),
          )
    const distance = Math.hypot(
      ax + (bx - ax) * share - target[0],
      az + (bz - az) * share - target[1],
    )
    if (distance < bestDistance) {
      bestDistance = distance
      best = (before + share * length) / total
    }
    before += length
  })

  return best
}
