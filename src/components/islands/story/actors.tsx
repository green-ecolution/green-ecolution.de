import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import {
  BackSide,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  MeshLambertMaterial,
  QuadraticBezierCurve3,
  TubeGeometry,
  Vector3,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
} from 'three'
import {
  exampleSpots,
  heroTree,
  pinColors,
  storyTrees,
  tourPath,
  type PinTone,
} from '../../../data/storyTown'
import { canopyCenterHeight, roadHeight, tourColors } from '../../../data/streamletTour'
import { pathLength, pointAlong, type GroundPoint } from '../../../lib/storyPath'
import { pinsShown, type StoryState } from '../../../lib/storyTimeline'
import { appendRibbon, ribbonGeometry, type RibbonArrays } from '../scene3d/ribbon'
import { lobes, treePit } from '../scene3d/trees'
import { Vehicle, WHEEL_RADIUS } from '../scene3d/Vehicle'
import { PIN_POST, PIN_RADIUS, SENSOR_X, SENSOR_Z, pinHeight, type Anchor } from './anchors'
import { PIT_TOP, damp, dampAngle, type ActorProps, type Story } from './shared'

const WATER = '#2B7FBF'

const dryBody = new Color('#C9B86A')
const dryLit = new Color('#D8C97F')
const freshBody = new Color(tourColors.treeCanopy)
const freshLit = new Color(tourColors.treeCanopyLit)
// One instance each: there is a single such tree, and the frame loop tints them.
const crownBody = new MeshLambertMaterial({ flatShading: true })
const crownLit = new MeshLambertMaterial({ flatShading: true })

export function HeroTree({ story, isStatic }: ActorProps) {
  const crown = useRef<Group>(null)
  const [x, z] = heroTree.at
  const radius = heroTree.canopyRadius
  const height = canopyCenterHeight(heroTree)

  useFrame(({ clock }) => {
    const { health } = story.current
    crownBody.color.lerpColors(dryBody, freshBody, health)
    crownLit.color.lerpColors(dryLit, freshLit, health)
    if (!crown.current) return
    // A thirsty crown is a little smaller and hangs lower.
    crown.current.scale.setScalar(0.88 + 0.12 * health)
    crown.current.position.y = height - (1 - health) * 0.35
    crown.current.rotation.z = isStatic ? 0 : Math.sin(clock.getElapsedTime() * 0.9) * 0.025
  })

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, heroTree.trunkHeight / 2, 0]}>
        <cylinderGeometry args={[0.24, 0.34, heroTree.trunkHeight, 8]} />
        <meshLambertMaterial color={tourColors.treeTrunk} flatShading />
      </mesh>
      <group ref={crown} position={[0, height, 0]}>
        {lobes.map((lobe, index) => (
          <mesh
            key={lobe.radius}
            position={[lobe.at[0] * radius, lobe.at[1] * radius, lobe.at[2] * radius]}
            scale={lobe.radius * radius}
            material={index === 0 ? crownBody : crownLit}
          >
            <icosahedronGeometry args={[1, 1]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

const SENSOR_REST = PIT_TOP + 0.12
const SENSOR_DROP = 4.5

export function Sensor({ story }: { story: Story }) {
  const body = useRef<Group>(null)

  useFrame(() => {
    if (!body.current) return
    const { sensorDrop } = story.current
    const settled = 1 - (1 - sensorDrop) ** 3
    body.current.visible = sensorDrop > 0
    body.current.position.y = SENSOR_REST + (1 - settled) * SENSOR_DROP
  })

  return (
    <group ref={body} position={[SENSOR_X, SENSOR_REST + SENSOR_DROP, SENSOR_Z]} visible={false}>
      <mesh>
        <boxGeometry args={[0.8, 0.5, 0.8]} />
        <meshLambertMaterial color="#2B2E2B" />
      </mesh>
      <mesh position={[0, 0.29, 0]}>
        <boxGeometry args={[0.24, 0.08, 0.24]} />
        <meshBasicMaterial color={tourColors.refill} />
      </mesh>
    </group>
  )
}

const RING_COUNT = 3

interface RingsProps extends ActorProps {
  at: readonly [number, number, number]
  strength: (state: StoryState) => number
}

export function SignalRings({ at, story, strength, isStatic }: RingsProps) {
  const rings = useRef<(Mesh | null)[]>([])

  useFrame(({ clock }) => {
    const power = strength(story.current)
    const time = isStatic ? 0.35 : clock.getElapsedTime() * 0.55

    rings.current.forEach((ring, index) => {
      if (!ring) return
      const phase = (time + index / RING_COUNT) % 1
      ring.visible = power > 0
      ring.position.y = at[1] + 0.6 + phase * 3.2
      ring.scale.setScalar(0.7 + phase * 1.5)
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
          position={[at[0], at[1], at[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
          renderOrder={1}
        >
          <ringGeometry args={[0.8, 1.1, 32]} />
          {/* Drawn over the crown, which would otherwise hide most of each ring. */}
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

const pinTints: Record<PinTone, Color> = {
  ok: new Color(pinColors.ok),
  warn: new Color(pinColors.warn),
  alert: new Color(pinColors.alert),
  info: new Color(pinColors.info),
}

interface PinProps extends ActorProps {
  at: GroundPoint
  /** Height of the middle of the pin's head. */
  height: number
  look: (state: StoryState) => { tone: PinTone; shown: boolean }
}

export function Pin({ at, height, story, look, isStatic }: PinProps) {
  const group = useRef<Group>(null)
  const head = useRef<MeshBasicMaterial>(null)
  const size = useRef(0)

  useFrame(({ clock }, delta) => {
    const { tone, shown } = look(story.current)
    const goal = shown ? 1 : 0
    const fresh = size.current < 0.05
    size.current = isStatic ? goal : damp(size.current, goal, 12, delta)

    if (head.current) {
      // A pin coming up starts in its colour; a standing one changes over.
      if (fresh || isStatic) head.current.color.copy(pinTints[tone])
      else head.current.color.lerp(pinTints[tone], 1 - Math.exp(-delta * 8))
    }
    if (!group.current) return
    const pulse = tone === 'ok' || isStatic ? 1 : 1 + Math.sin(clock.getElapsedTime() * 4) * 0.08
    group.current.visible = size.current > 0.01
    group.current.scale.setScalar(size.current * pulse)
  })

  return (
    <group ref={group} position={[at[0], height, at[1]]} visible={false}>
      <mesh position={[0, -PIN_POST / 2, 0]}>
        <cylinderGeometry args={[0.07, 0.07, PIN_POST, 6]} />
        <meshBasicMaterial color={tourColors.vehicleBody} />
      </mesh>
      <mesh scale={1.14}>
        <sphereGeometry args={[PIN_RADIUS, 20, 14]} />
        <meshBasicMaterial color="#FFFFFF" side={BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[PIN_RADIUS, 20, 14]} />
        <meshBasicMaterial ref={head} color={pinColors.ok} />
      </mesh>
    </group>
  )
}

const PIN_TOTAL = storyTrees.length + 1

export function TreePins({ story, isStatic }: ActorProps) {
  return (
    <>
      {storyTrees.map((tree, index) => (
        <Pin
          key={tree.at.join()}
          at={tree.at}
          height={pinHeight(tree)}
          story={story}
          isStatic={isStatic}
          look={(state) => ({
            shown: pinsShown(state.pins, PIN_TOTAL) > index,
            tone: tree.tone === 'warn' && state.drive < tree.servedAt ? 'warn' : 'ok',
          })}
        />
      ))}
      <Pin
        at={heroTree.at}
        height={pinHeight(heroTree)}
        story={story}
        isStatic={isStatic}
        look={(state) => ({
          shown: pinsShown(state.pins, PIN_TOTAL) >= PIN_TOTAL,
          tone: state.health > 0.5 ? 'ok' : 'alert',
        })}
      />
    </>
  )
}

const projected = new Vector3()

interface LabelsProps {
  story: Story
  nodes: RefObject<(HTMLElement | null)[]>
  anchors: Anchor[]
}

// The labels are html over the canvas; this keeps each above its pin.
export function Labels({ story, nodes, anchors }: LabelsProps) {
  useFrame(({ camera, size }) => {
    anchors.forEach((anchor, index) => {
      const node = nodes.current[index]
      if (!node) return
      projected.set(anchor.at[0], anchor.at[1], anchor.at[2]).project(camera)
      const left = ((projected.x + 1) / 2) * size.width
      const top = ((1 - projected.y) / 2) * size.height
      node.style.transform = `translate(${left.toFixed(1)}px, ${top.toFixed(1)}px) translate(-50%, -100%)`
      node.dataset.shown = String(anchor.shown(story.current))
    })
  })

  return null
}

const ROUTE_SEGMENTS = 240

const routeGeometry = (() => {
  const curve = new CatmullRomCurve3(
    tourPath.map(([x, z]) => new Vector3(x, roadHeight, z)),
    false,
    'centripetal',
  )
  const arrays: RibbonArrays = { position: [], normal: [], index: [] }
  appendRibbon(arrays, curve, 1.1, 0.07, 0, 1, ROUTE_SEGMENTS)
  return ribbonGeometry(arrays)
})()

export function Route({ story }: { story: Story }) {
  const mesh = useRef<Mesh>(null)

  useFrame(() => {
    // Two triangles per segment, so the ribbon grows a segment at a time.
    mesh.current?.geometry.setDrawRange(0, Math.floor(story.current.route * ROUTE_SEGMENTS) * 6)
  })

  return (
    <mesh ref={mesh} geometry={routeGeometry}>
      <meshBasicMaterial color={tourColors.refill} side={DoubleSide} />
    </mesh>
  )
}

const approaches = exampleSpots.map((spot) => spot.approach)
const tourLength = pathLength(tourPath)
const approachLengths = approaches.map(pathLength)

export function StoryVehicle({ story, isStatic }: ActorProps) {
  const group = useRef<Group>(null)
  const wheels = useRef<Group[]>([])
  const heading = useRef<number | null>(null)

  useFrame((_, delta) => {
    if (!group.current) return
    const { route, at, shown } = story.current.vehicle
    const path = route === 'tour' ? tourPath : approaches[route]
    const length = route === 'tour' ? tourLength : approachLengths[route]
    const pose = pointAlong(path, at)

    group.current.visible = shown > 0.01
    group.current.scale.setScalar(Math.max(0.001, shown))
    group.current.position.set(pose.at[0], roadHeight, pose.at[1])
    // Turning eases in, except where the vehicle has just been put on a road.
    heading.current =
      heading.current === null || isStatic || shown < 0.05
        ? pose.heading
        : dampAngle(heading.current, pose.heading, 10, delta)
    group.current.rotation.y = heading.current

    const spin = (at * length) / WHEEL_RADIUS
    for (const wheel of wheels.current) wheel.rotation.x = spin
  })

  return (
    <group ref={group} visible={false}>
      <Vehicle wheels={wheels} />
    </group>
  )
}

const tourEnd = tourPath[tourPath.length - 1]
// High on the tank's flank towards the tree, where the body does not hide it.
const streamFrom = new Vector3(tourEnd[0] - 1.45, roadHeight + 3.35, tourEnd[1] - 1.2)
const streamTo = new Vector3(heroTree.at[0] + 0.9, PIT_TOP, heroTree.at[1] - 0.7)
const streamGeometry = new TubeGeometry(
  new QuadraticBezierCurve3(
    streamFrom,
    streamFrom
      .clone()
      .lerp(streamTo, 0.4)
      .setY(streamFrom.y + 0.9),
    streamTo,
  ),
  24,
  0.15,
  8,
)
const WET_RADIUS = treePit.radius - treePit.kerbWidth

export function Watering({ story, isStatic }: ActorProps) {
  const stream = useRef<Mesh>(null)
  const wet = useRef<Mesh>(null)
  const ripple = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    const { watering } = story.current
    const flowing = watering > 0 && watering < 1

    if (stream.current) stream.current.visible = flowing
    if (wet.current) {
      wet.current.visible = watering > 0
      ;(wet.current.material as MeshBasicMaterial).opacity = watering * 0.45
    }
    if (ripple.current) {
      const wave = (clock.getElapsedTime() * 0.9) % 1
      ripple.current.visible = flowing && !isStatic
      ripple.current.scale.setScalar(0.5 + wave * 1.2)
      ;(ripple.current.material as MeshBasicMaterial).opacity = 0.6 * (1 - wave)
    }
  })

  return (
    <>
      <mesh ref={stream} geometry={streamGeometry} visible={false}>
        <meshBasicMaterial color={WATER} transparent opacity={0.85} depthWrite={false} />
      </mesh>
      <mesh
        ref={wet}
        position={[heroTree.at[0], PIT_TOP + 0.02, heroTree.at[1]]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <circleGeometry args={[WET_RADIUS, 32]} />
        <meshBasicMaterial color={WATER} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh
        ref={ripple}
        position={[heroTree.at[0], PIT_TOP + 0.04, heroTree.at[1]]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <ringGeometry args={[0.85, 1.12, 32]} />
        <meshBasicMaterial color={WATER} transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  )
}
