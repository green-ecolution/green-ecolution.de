import type { GroundPoint } from './storyPath'

export interface Street {
  from: GroundPoint
  to: GroundPoint
}

export interface RoadGraph {
  /** Length of the shortest way along the streets between two sites. */
  distance: (from: number, to: number) => number
  /** The corners of that way, both sites included. */
  path: (from: number, to: number) => GroundPoint[]
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

  const count = points.length
  const length = Array.from({ length: count }, (_, row) =>
    Array.from({ length: count }, (_, column) => (row === column ? 0 : Infinity)),
  )
  const next = Array.from({ length: count }, (_, row) =>
    Array.from({ length: count }, (_, column) => (row === column ? row : -1)),
  )

  for (const street of streets) {
    const onStreet = points
      .map((point, index) => ({ index, share: shareAlong(street, point) }))
      .filter((entry): entry is { index: number; share: number } => entry.share !== null)
      .sort((a, b) => a.share - b.share)

    for (let i = 1; i < onStreet.length; i++) {
      const a = onStreet[i - 1].index
      const b = onStreet[i].index
      const span = Math.hypot(points[a][0] - points[b][0], points[a][1] - points[b][1])
      if (span < length[a][b]) {
        length[a][b] = length[b][a] = span
        next[a][b] = b
        next[b][a] = a
      }
    }
  }

  sites.forEach((site, index) => {
    if (next[index].every((step, other) => other === index || step < 0)) {
      if (streets.every((street) => shareAlong(street, site) === null)) {
        throw new Error(`site ${index} at ${site.join()} is not on a street`)
      }
    }
  })

  for (let via = 0; via < count; via++) {
    for (let from = 0; from < count; from++) {
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
    distance: (from, to) => length[from][to],
    path: (from, to) => {
      if (next[from][to] < 0) throw new Error(`no way from site ${from} to site ${to}`)
      const way: GroundPoint[] = [points[from]]
      let at = from
      while (at !== to) {
        at = next[at][to]
        way.push(points[at])
      }
      // A site or a junction in the middle of a straight stretch is no corner.
      return way.filter((point, index) => {
        if (index === 0 || index === way.length - 1) return true
        const [ax, az] = way[index - 1]
        const [cx, cz] = way[index + 1]
        const cross = (point[0] - ax) * (cz - az) - (point[1] - az) * (cx - ax)
        return Math.abs(cross) > EPSILON
      })
    },
  }
}
