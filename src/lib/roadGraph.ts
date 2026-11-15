import type { GroundPoint } from './storyPath'

export interface Street {
  from: GroundPoint
  to: GroundPoint
}

/**
 * Ways along the streets that never turn round, except at a dead end. They run
 * between arcs, the directed stretches of street between neighbouring points:
 * standing at the end of an arc means standing there facing its direction.
 */
export interface RoadGraph {
  /** The arcs that end at a site: two in the middle of a street, one in a dead end. */
  arrivals: (site: number) => number[]
  /** Where an arc starts and ends. */
  arcEnds: (arc: number) => readonly [GroundPoint, GroundPoint]
  /** Road driven from standing at the end of one arc until standing at the end of the other. */
  distance: (fromArc: number, toArc: number) => number
  /** The corners of that way, both ends included. */
  path: (fromArc: number, toArc: number) => GroundPoint[]
}

interface Arc {
  from: number
  to: number
  length: number
}

const EPSILON = 1e-6

function shareAlong(street: Street, [x, z]: GroundPoint): number | null {
  const dx = street.to[0] - street.from[0]
  const dz = street.to[1] - street.from[1]
  const length = Math.hypot(dx, dz)
  const share = ((x - street.from[0]) * dx + (z - street.from[1]) * dz) / (length * length)
  if (share < -EPSILON || share > 1 + EPSILON) return null
  const off = Math.hypot(street.from[0] + dx * share - x, street.from[1] + dz * share - z)
  return off < EPSILON ? share : null
}

/**
 * Sites are the points a tour can stop at; each has to lie on a street. Streets
 * meet wherever one of them has an end point or a site on the other.
 */
export function roadGraph(streets: readonly Street[], sites: readonly GroundPoint[]): RoadGraph {
  const points: GroundPoint[] = [...sites]
  const remember = (point: GroundPoint) => {
    const known = points.some(
      ([x, z]) => Math.abs(x - point[0]) < EPSILON && Math.abs(z - point[1]) < EPSILON,
    )
    if (!known) points.push(point)
  }
  for (const street of streets) {
    remember(street.from)
    remember(street.to)
  }

  const arcs: Arc[] = []
  for (const street of streets) {
    const onStreet = points
      .map((point, index) => ({ index, share: shareAlong(street, point) }))
      .filter((entry): entry is { index: number; share: number } => entry.share !== null)
      .sort((a, b) => a.share - b.share)

    for (let i = 1; i < onStreet.length; i++) {
      const a = onStreet[i - 1].index
      const b = onStreet[i].index
      const span = Math.hypot(points[a][0] - points[b][0], points[a][1] - points[b][1])
      arcs.push({ from: a, to: b, length: span }, { from: b, to: a, length: span })
    }
  }

  sites.forEach((site, index) => {
    if (!arcs.some((arc) => arc.to === index)) {
      throw new Error(`site ${index} at ${site.join()} is not on a street`)
    }
  })

  const neighbours = points.map((_, point) => arcs.filter((arc) => arc.from === point).length)
  const count = arcs.length
  const length = Array.from({ length: count }, (_, row) =>
    Array.from({ length: count }, (_, column) => (row === column ? 0 : Infinity)),
  )
  const next = Array.from({ length: count }, (_, row) =>
    Array.from({ length: count }, (_, column) => (row === column ? row : -1)),
  )

  arcs.forEach((into, a) => {
    arcs.forEach((onward, b) => {
      if (a === b || onward.from !== into.to) return
      // Only a dead end lets the truck turn round.
      if (onward.to === into.from && neighbours[into.to] > 1) return
      length[a][b] = onward.length
      next[a][b] = b
    })
  })

  for (let via = 0; via < count; via++) {
    for (let from = 0; from < count; from++) {
      if (length[from][via] === Infinity) continue
      for (let to = 0; to < count; to++) {
        const detour = length[from][via] + length[via][to]
        if (detour < length[from][to] - EPSILON) {
          length[from][to] = detour
          next[from][to] = next[from][via]
        }
      }
    }
  }

  return {
    arrivals: (site) => arcs.flatMap((arc, index) => (arc.to === site ? [index] : [])),
    arcEnds: (arc) => [points[arcs[arc].from], points[arcs[arc].to]],
    distance: (from, to) => length[from][to],
    path: (from, to) => {
      if (next[from][to] < 0) throw new Error(`no way from arc ${from} to arc ${to}`)
      const way: GroundPoint[] = [points[arcs[from].to]]
      let at = from
      while (at !== to) {
        at = next[at][to]
        way.push(points[arcs[at].to])
      }
      // A site or a junction in the middle of a straight stretch is no corner;
      // a dead end the way turns round in is.
      return way.filter((point, index) => {
        if (index === 0 || index === way.length - 1) return true
        const [ax, az] = way[index - 1]
        const [cx, cz] = way[index + 1]
        const cross = (point[0] - ax) * (cz - point[1]) - (point[1] - az) * (cx - point[0])
        const ahead = (point[0] - ax) * (cx - point[0]) + (point[1] - az) * (cz - point[1])
        return Math.abs(cross) > EPSILON || ahead < 0
      })
    },
  }
}
