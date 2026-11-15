import type { BufferGeometry } from 'three'
import type { Road } from '../../../data/storyTown'
import { centerLine, kerb, roadHeight, roadWidth, tourColors } from '../../../data/streamletTour'
import { painted, placed } from '../../../lib/paintedGeometry'
import { unitBox } from './primitives'

/** Kerb, carriageway and centre line of a road that runs along x or along z. */
export function roadGeometry(road: Road): BufferGeometry[] {
  const [fromX, fromZ] = road.from
  const [toX, toZ] = road.to
  const alongX = fromZ === toZ
  const length = alongX ? Math.abs(toX - fromX) : Math.abs(toZ - fromZ)
  const x = (fromX + toX) / 2
  const z = (fromZ + toZ) / 2
  const box = (width: number, height: number): [number, number, number] =>
    alongX ? [length, height, width] : [width, height, length]
  const kerbTop = roadHeight - kerb.drop

  const pattern = centerLine.dash + centerLine.gap
  const dashes = Array.from({ length: Math.floor(length / pattern) }, (_, index) => {
    const along = -length / 2 + centerLine.gap / 2 + index * pattern + centerLine.dash / 2
    return painted(
      unitBox,
      placed(
        alongX
          ? [x + along, roadHeight + centerLine.lift, z]
          : [x, roadHeight + centerLine.lift, z + along],
        alongX
          ? [centerLine.dash, 0.02, centerLine.width]
          : [centerLine.width, 0.02, centerLine.dash],
      ),
      tourColors.roadLine,
    )
  })

  return [
    painted(
      unitBox,
      placed([x, kerbTop / 2, z], box(roadWidth + kerb.width * 2, kerbTop)),
      tourColors.kerb,
    ),
    painted(unitBox, placed([x, roadHeight / 2, z], box(roadWidth, roadHeight)), tourColors.road),
    ...dashes,
  ]
}
