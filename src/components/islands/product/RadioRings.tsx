import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { DoubleSide, Vector3, type Mesh, type MeshBasicMaterial } from 'three'
import { tourColors } from '../../../data/streamletTour'
import type { GroundPoint } from '../../../lib/storyPath'

const RING_COUNT = 3
/** How far the rings tilt from lying flat towards the camera; flat, a low camera sees only their edge. */
const RING_TILT = 1
/** How far the rings rise before they have faded. */
const RISE = 3.2
const facing = new Vector3()

export interface RingSource {
  at: GroundPoint
  /** Height the rings start from. */
  base: number
  /** 0 to 1: how strongly they show. */
  power: number
  /** Where the close-up camera stands, or null under the slanted one. */
  lens: readonly [number, number, number] | null
}

interface Props {
  /** Asked every frame; null hides the rings. */
  source: () => RingSource | null
}

/** Radio rings rising from a sender, as on the home page. */
export function RadioRings({ source }: Props) {
  const rings = useRef<(Mesh | null)[]>([])

  useFrame(({ clock }) => {
    const sender = source()
    const time = clock.getElapsedTime() * 0.55

    rings.current.forEach((ring, index) => {
      if (!ring) return
      ring.visible = sender !== null && sender.power > 0
      if (!sender || sender.power <= 0) return
      const { at, base, power, lens } = sender
      const phase = (time + index / RING_COUNT) % 1
      ring.position.set(at[0], base + phase * RISE, at[1])
      const away = lens ? Math.hypot(lens[0] - at[0], lens[2] - at[1]) || 1 : 1
      facing.set(
        lens ? ((lens[0] - at[0]) / away) * RING_TILT : 0,
        1,
        lens ? ((lens[2] - at[1]) / away) * RING_TILT : 0,
      )
      ring.lookAt(facing.add(ring.position))
      ring.scale.setScalar(0.6 + phase * 1.4)
      ;(ring.material as MeshBasicMaterial).opacity = power * (1 - phase)
    })
  })

  return (
    <>
      {Array.from({ length: RING_COUNT }, (_, index) => (
        <mesh
          key={index}
          ref={(node) => {
            rings.current[index] = node
          }}
          visible={false}
          renderOrder={1}
        >
          <ringGeometry args={[0.8, 1.1, 32]} />
          {/* Drawn over a crown, which would otherwise hide most of each ring. */}
          <meshBasicMaterial
            color={tourColors.refillCabinet}
            transparent
            opacity={0}
            depthTest={false}
            depthWrite={false}
            side={DoubleSide}
          />
        </mesh>
      ))}
    </>
  )
}
