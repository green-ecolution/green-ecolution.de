import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, Mesh, MeshBasicMaterial } from 'three'
import { binHeight, exampleSpots, icePatch, puddle } from '../../../data/storyTown'
import { roadHeight } from '../../../data/streamletTour'
import type { ExampleState } from '../../../lib/storyTimeline'
import { Pin, SignalRings } from './actors'
import { damp, type ActorProps } from './shared'

export function ExampleSpots({ story, isStatic }: ActorProps) {
  return (
    <>
      {exampleSpots.map((spot, index) => (
        <group key={spot.id}>
          <SignalRings
            at={[spot.at[0], roadHeight, spot.at[1]]}
            story={story}
            isStatic={isStatic}
            strength={(state) => state.examples[index].signal}
          />
          <Pin
            at={spot.at}
            height={spot.pinHeight}
            story={story}
            isStatic={isStatic}
            look={(state) => {
              const example = state.examples[index]
              return {
                shown: example.alert || example.resolved,
                tone: example.resolved ? 'ok' : spot.tone,
              }
            }}
          />
        </group>
      ))}
    </>
  )
}

// What is wrong at a spot shows from the first signal until the vehicle has been.
function trouble(example: ExampleState): number {
  if (example.resolved) return 0
  return Math.max(example.signal, example.alert ? 1 : 0)
}

const [bin] = exampleSpots

interface Rubbish {
  at: readonly [number, number, number]
  radius: number
  color: string
}

// Relative to the foot of the bin: a heap on the lid and a little on the pavement.
const rubbish: Rubbish[] = [
  { at: [0, binHeight + 0.5, 0], radius: 0.85, color: '#C8BE9E' },
  { at: [0.45, binHeight + 1, -0.25], radius: 0.6, color: '#8E8B7E' },
  { at: [-0.4, binHeight + 0.9, 0.35], radius: 0.55, color: '#C08A50' },
  { at: [0.15, binHeight + 1.35, 0.1], radius: 0.45, color: '#E8E3D2' },
  { at: [1.1, 0.3, 0.55], radius: 0.36, color: '#C08A50' },
  { at: [-0.4, 0.25, 1.2], radius: 0.3, color: '#8E8B7E' },
  { at: [0.7, 0.22, 1.1], radius: 0.25, color: '#C8BE9E' },
]

// Above the painted route of act three, which runs along the same side road.
const ICE_LIFT = 0.1

export function Troubles({ story, isStatic }: ActorProps) {
  const heap = useRef<Group>(null)
  const ice = useRef<Mesh>(null)
  const water = useRef<Mesh>(null)
  const levels = useRef([0, 0, 0])

  useFrame((_, delta) => {
    story.current.examples.forEach((example, index) => {
      const goal = trouble(example)
      levels.current[index] = isStatic ? goal : damp(levels.current[index], goal, 5, delta)
    })
    const [full, frozen, flooded] = levels.current

    if (heap.current) {
      heap.current.visible = full > 0.02
      heap.current.children.forEach((piece, index) =>
        piece.scale.setScalar(Math.max(0.001, full) * rubbish[index].radius),
      )
    }
    if (ice.current) {
      ice.current.visible = frozen > 0.02
      ;(ice.current.material as MeshBasicMaterial).opacity = frozen * 0.8
    }
    if (water.current) {
      water.current.visible = flooded > 0.02
      water.current.scale.setScalar(0.4 + flooded * 0.6)
      ;(water.current.material as MeshBasicMaterial).opacity = flooded * 0.55
    }
  })

  return (
    <>
      <group ref={heap} position={[bin.at[0], 0, bin.at[1]]} visible={false}>
        {rubbish.map((piece) => (
          <mesh key={piece.at.join()} position={piece.at}>
            <icosahedronGeometry args={[1, 0]} />
            <meshLambertMaterial color={piece.color} flatShading />
          </mesh>
        ))}
      </group>
      <mesh
        ref={ice}
        position={[icePatch.at[0], roadHeight + ICE_LIFT, icePatch.at[1]]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <planeGeometry args={[icePatch.width, icePatch.length]} />
        <meshBasicMaterial color="#E4F1F7" transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh
        ref={water}
        position={[puddle.at[0], roadHeight + 0.04, puddle.at[1]]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <circleGeometry args={[puddle.radius, 32]} />
        <meshBasicMaterial color="#2B7FBF" transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  )
}
