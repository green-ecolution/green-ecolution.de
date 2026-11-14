import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
} from 'three'
import { binHeight, exampleSpots, icePatch, puddle } from '../../../data/storyTown'
import { roadHeight } from '../../../data/streamletTour'
import { vehiclePose } from '../../../lib/storyPath'
import type { ExampleState } from '../../../lib/storyTimeline'
import { WHEELBASE } from '../scene3d/Vehicle'
import { fleetColors } from './fleetColors'
import {
  GRIT_THROW,
  grittedLength,
  gritterPath,
  hoseLowered,
  iceStartZ,
  puddlePose,
  pumped,
  suctionAt,
} from './jobSites'
import { damp, type ActorProps } from './shared'
import { NOZZLE_HEIGHT, SPINNER_BEHIND, SPINNER_HEIGHT } from './vehicles'

// Same order as EXAMPLES in storyTimeline.ts.
const BIN = 0
const WINTER = 1
const RAIN = 2

// What is wrong at a spot shows from the first signal until the vehicle has been.
function trouble(example: ExampleState): number {
  if (example.resolved) return 0
  return Math.max(example.signal, example.alert ? 1 : 0)
}

function useTrouble(index: number, { story, isStatic }: ActorProps) {
  const level = useRef(0)

  useFrame((_, delta) => {
    const goal = trouble(story.current.examples[index])
    level.current = isStatic ? goal : damp(level.current, goal, 5, delta)
  })

  return level
}

// The same scatter on every visit.
function scatter(index: number, salt: number): number {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453
  return value - Math.floor(value)
}

const bin = exampleSpots[BIN]

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

function Heap(props: ActorProps) {
  const heap = useRef<Group>(null)
  const level = useTrouble(BIN, props)

  useFrame(() => {
    if (!heap.current) return
    const full = level.current * (1 - props.story.current.examples[BIN].work)
    heap.current.visible = full > 0.02
    heap.current.children.forEach((piece, index) =>
      piece.scale.setScalar(Math.max(0.001, full) * rubbish[index].radius),
    )
  })

  return (
    <group ref={heap} position={[bin.at[0], 0, bin.at[1]]} visible={false}>
      {rubbish.map((piece) => (
        <mesh key={piece.at.join()} position={piece.at}>
          <icosahedronGeometry args={[1, 0]} />
          <meshLambertMaterial color={piece.color} flatShading />
        </mesh>
      ))}
    </group>
  )
}

// Above the painted route of act three, which runs along the same side road.
const ICE_LIFT = 0.1
const SPECKLE_LIFT = ICE_LIFT + 0.02
const SPECKLES = 220
const VERTICES_PER_SPECKLE = 6

// In the order the gritter lays them, so a draw range shows what it has passed.
const speckleGeometry = (() => {
  const position: number[] = []

  for (let index = 0; index < SPECKLES; index++) {
    const x = icePatch.at[0] + (scatter(index, 2) - 0.5) * (icePatch.width - 0.7)
    const z = iceStartZ - ((index + scatter(index, 1)) / SPECKLES) * icePatch.length
    const reach = 0.08 + scatter(index, 3) * 0.09
    const turn = scatter(index, 4) * Math.PI
    const corner = (quarter: number) => [
      x + Math.cos(turn + (quarter * Math.PI) / 2) * reach,
      roadHeight + SPECKLE_LIFT,
      z + Math.sin(turn + (quarter * Math.PI) / 2) * reach,
    ]
    for (const quarter of [0, 1, 2, 0, 2, 3]) position.push(...corner(quarter))
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(position, 3))
  return geometry
})()

interface Grain {
  across: number
  back: number
  offset: number
  size: number
}

// Thrown from the spinner in a fan as wide as the road.
const grains: Grain[] = Array.from({ length: 18 }, (_, index) => ({
  across: (scatter(index, 5) - 0.5) * (icePatch.width - 0.6),
  back: GRIT_THROW * (0.6 + scatter(index, 6) * 0.8),
  offset: scatter(index, 7),
  size: 0.11 + scatter(index, 8) * 0.08,
}))

function Gritting(props: ActorProps) {
  const { story, isStatic } = props
  const ice = useRef<Mesh>(null)
  const speckles = useRef<Mesh>(null)
  const spray = useRef<Group>(null)
  const level = useTrouble(WINTER, props)

  useFrame(({ clock }) => {
    const { work } = story.current.examples[WINTER]
    const gritted = grittedLength(work)
    const left = icePatch.length - gritted

    if (ice.current) {
      ice.current.visible = level.current > 0.02 && left > 0.01
      ice.current.scale.y = Math.max(0.001, left / icePatch.length)
      ice.current.position.z = iceStartZ - gritted - left / 2
      ;(ice.current.material as MeshBasicMaterial).opacity = level.current * 0.8
    }

    speckles.current?.geometry.setDrawRange(
      0,
      Math.floor((gritted / icePatch.length) * SPECKLES) * VERTICES_PER_SPECKLE,
    )

    if (!spray.current) return
    spray.current.visible = !isStatic && gritted > 0 && left > 0
    if (!spray.current.visible) return
    const pose = vehiclePose(gritterPath, work, WHEELBASE)
    spray.current.position.set(pose.at[0], roadHeight, pose.at[1])
    spray.current.rotation.y = pose.heading
    const time = clock.getElapsedTime() * 1.7
    spray.current.children.forEach((grain, index) => {
      const { across, back, offset } = grains[index]
      const flight = (time + offset) % 1
      grain.position.set(
        across * flight,
        SPINNER_HEIGHT * (1 - flight) + 0.05 + 0.6 * flight * (1 - flight),
        -SPINNER_BEHIND - back * flight,
      )
    })
  })

  return (
    <>
      <mesh
        ref={ice}
        position={[icePatch.at[0], roadHeight + ICE_LIFT, icePatch.at[1]]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <planeGeometry args={[icePatch.width, icePatch.length]} />
        <meshBasicMaterial color="#E4F1F7" transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh ref={speckles} geometry={speckleGeometry}>
        <meshBasicMaterial color={fleetColors.grit} side={DoubleSide} />
      </mesh>
      <group ref={spray} visible={false}>
        {grains.map((grain) => (
          <mesh key={grain.offset} scale={grain.size}>
            <icosahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color={fleetColors.grit} />
          </mesh>
        ))}
      </group>
    </>
  )
}

const WATER_LIFT = 0.04
// From inside the nozzle on the boom down to the road.
const HOSE_TOP = roadHeight + NOZZLE_HEIGHT - 0.1
const HOSE_DROP = HOSE_TOP - roadHeight - WATER_LIFT
const SUCTION_RINGS = 2

function Pumping(props: ActorProps) {
  const { story, isStatic } = props
  const water = useRef<Mesh>(null)
  const hose = useRef<Mesh>(null)
  const rings = useRef<(Mesh | null)[]>([])
  const level = useTrouble(RAIN, props)

  useFrame(({ clock }) => {
    const { work } = story.current.examples[RAIN]
    const drained = pumped(work)
    const { at, scale } = puddlePose(drained)
    const size = (0.4 + level.current * 0.6) * scale

    if (water.current) {
      water.current.visible = level.current > 0.02 && scale > 0.01
      water.current.position.set(at[0], roadHeight + WATER_LIFT, at[1])
      water.current.scale.setScalar(Math.max(0.001, size))
      ;(water.current.material as MeshBasicMaterial).opacity = level.current * 0.55
    }

    if (hose.current) {
      const lowered = hoseLowered(work)
      hose.current.visible = lowered > 0.01
      hose.current.scale.y = Math.max(0.001, lowered * HOSE_DROP)
      hose.current.position.y = HOSE_TOP - (lowered * HOSE_DROP) / 2
    }

    const pumping = !isStatic && drained > 0 && drained < 1
    const time = clock.getElapsedTime() * 0.8
    rings.current.forEach((ring, index) => {
      if (!ring) return
      ring.visible = pumping
      // Each ring closes in on the hose from the puddle's rim.
      const pull = (time + index / SUCTION_RINGS) % 1
      ring.position.x = at[0] + (suctionAt[0] - at[0]) * pull
      ring.position.z = at[1] + (suctionAt[1] - at[1]) * pull
      ring.scale.setScalar(Math.max(0.001, puddle.radius * size * (1 - pull)))
      ;(ring.material as MeshBasicMaterial).opacity = 0.7 * Math.sin(Math.PI * pull)
    })
  })

  return (
    <>
      <mesh
        ref={water}
        position={[puddle.at[0], roadHeight + WATER_LIFT, puddle.at[1]]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <circleGeometry args={[puddle.radius, 32]} />
        <meshBasicMaterial color="#2B7FBF" transparent opacity={0} depthWrite={false} />
      </mesh>
      {Array.from({ length: SUCTION_RINGS }, (_, index) => (
        <mesh
          key={index}
          ref={(node) => {
            rings.current[index] = node
          }}
          position={[puddle.at[0], roadHeight + WATER_LIFT + 0.02, puddle.at[1]]}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
          renderOrder={1}
        >
          <ringGeometry args={[0.84, 1, 32]} />
          <meshBasicMaterial color="#D6EAF6" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
      <mesh ref={hose} position={[suctionAt[0], HOSE_TOP, suctionAt[1]]} visible={false}>
        <cylinderGeometry args={[0.3, 0.3, 1, 12]} />
        <meshLambertMaterial color={fleetColors.hose} />
      </mesh>
    </>
  )
}

export function Troubles(props: ActorProps) {
  return (
    <>
      <Heap {...props} />
      <Gritting {...props} />
      <Pumping {...props} />
    </>
  )
}
