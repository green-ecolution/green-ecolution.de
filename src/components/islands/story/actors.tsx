import { useFrame } from '@react-three/fiber'
import { useRef, type ComponentType, type RefObject } from 'react'
import {
  CatmullRomCurve3,
  Color,
  DoubleSide,
  MeshLambertMaterial,
  Quaternion,
  Vector3,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
} from 'three'
import { exampleSpots, heroTree, storyTrees, tourPath } from '../../../data/storyTown'
import { canopyCenterHeight, roadHeight, tourColors } from '../../../data/streamletTour'
import { pathLength, vehiclePose } from '../../../lib/storyPath'
import { pinsShown, type StoryState, type VehicleState } from '../../../lib/storyTimeline'
import { Pin } from '../scene3d/Pin'
import {
  WATER,
  WATER_GLINT,
  jetGeometry,
  jetSpan,
  shapeJet,
  type JetArc,
} from '../scene3d/waterJet'
import { appendRibbon, ribbonGeometry, type RibbonArrays } from '../scene3d/ribbon'
import { lobes, treePit } from '../scene3d/trees'
import { Vehicle, WHEEL_RADIUS, WHEELBASE } from '../scene3d/Vehicle'
import {
  PIN_HULL,
  PIN_RADIUS,
  PIN_TOTAL,
  SENSOR_X,
  SENSOR_Z,
  heroPinRed,
  heroPinUp,
  pinHeadScale,
  pinHeight,
  type Anchor,
} from './anchors'
import { PIT_TOP, type ActorProps, type Story } from './shared'
import { Gritter, RefuseTruck, SewerTruck } from './vehicles'

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
// The camera looks along -(1, 1, 1), so falling in along that axis as well leaves
// the drop on screen as it was but takes it past the crown instead of through it.
const SENSOR_LEAD = 20

export function Sensor({ story }: { story: Story }) {
  const body = useRef<Group>(null)

  useFrame(() => {
    if (!body.current) return
    const { sensorDrop } = story.current
    const lift = (1 - sensorDrop) ** 3
    body.current.visible = sensorDrop > 0
    body.current.position.set(
      SENSOR_X + lift * SENSOR_LEAD,
      SENSOR_REST + lift * (SENSOR_DROP + SENSOR_LEAD),
      SENSOR_Z + lift * SENSOR_LEAD,
    )
  })

  return (
    <group ref={body} position={[SENSOR_X, SENSOR_REST, SENSOR_Z]} visible={false}>
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

export function TreePins({ story, isStatic }: ActorProps) {
  return (
    <>
      {storyTrees.map((tree, index) => (
        <Pin
          key={tree.at.join()}
          at={tree.at}
          height={pinHeight(tree)}
          isStatic={isStatic}
          look={() => {
            const state = story.current
            return {
              shown: pinsShown(state.pins, PIN_TOTAL) > index,
              tone: tree.tone === 'warn' && state.drive < tree.servedAt ? 'warn' : 'ok',
              alarm: false,
            }
          }}
        />
      ))}
      <Pin
        at={heroTree.at}
        height={pinHeight(heroTree)}
        isStatic={isStatic}
        look={() => {
          const state = story.current
          return {
            shown: heroPinUp(state),
            tone: state.health > 0.5 ? 'ok' : 'alert',
            alarm: heroPinRed(state),
          }
        }}
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
    // Every label stands over a pin, so it clears the enlarged head by as much as the head grew.
    const lift = (pinHeadScale(camera.zoom) - 1) * PIN_RADIUS * PIN_HULL * camera.zoom

    anchors.forEach((anchor, index) => {
      const node = nodes.current[index]
      if (!node) return
      projected.set(anchor.at[0], anchor.at[1], anchor.at[2]).project(camera)
      const left = ((projected.x + 1) / 2) * size.width
      const top = ((1 - projected.y) / 2) * size.height - lift
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

interface FleetMember {
  route: VehicleState['route']
  Truck: ComponentType<{ wheels: RefObject<Group[]> }>
}

const UP = new Vector3(0, 1, 0)
const parked = vehiclePose(tourPath, 1, WHEELBASE)
const jetTarget = new Vector3(heroTree.at[0] + 0.9, PIT_TOP, heroTree.at[1] - 0.7)
// On the tank's crown: its flank towards the tree faces away from the camera.
const MONITOR_AT = new Vector3(-0.7, 4.45, 0.3)
const BARREL_LENGTH = 1
const BARREL_PITCH = 0.6
const monitorPivot = MONITOR_AT.clone()
  .applyAxisAngle(UP, parked.heading)
  .add(new Vector3(parked.at[0], roadHeight, parked.at[1]))
const aim = jetTarget.clone().sub(monitorPivot).setY(0).normalize()
const barrelAxis = aim.clone().multiplyScalar(Math.cos(BARREL_PITCH)).setY(Math.sin(BARREL_PITCH))
const barrelMouth = monitorPivot.clone().addScaledVector(barrelAxis, BARREL_LENGTH)
const barrelAxisOnTruck = barrelAxis.clone().applyAxisAngle(UP, -parked.heading)
const barrelTurn = new Quaternion().setFromUnitVectors(UP, barrelAxisOnTruck)
const barrelCentre = MONITOR_AT.clone().addScaledVector(barrelAxisOnTruck, BARREL_LENGTH / 2)

// The water leaves along the barrel, which fixes how high it climbs.
const jetArc: JetArc = (() => {
  const reach = Math.hypot(jetTarget.x - barrelMouth.x, jetTarget.z - barrelMouth.z)
  const climb = Math.tan(BARREL_PITCH) * reach
  const drop = barrelMouth.y - jetTarget.y
  return { from: barrelMouth, to: jetTarget, rise: (climb * climb) / (4 * (climb + drop)) }
})()

function WateringTruck({ wheels }: { wheels: RefObject<Group[]> }) {
  return (
    <>
      <Vehicle wheels={wheels} />
      <mesh position={[MONITOR_AT.x, MONITOR_AT.y - 0.25, MONITOR_AT.z]}>
        <cylinderGeometry args={[0.3, 0.36, 0.6, 12]} />
        <meshLambertMaterial color={tourColors.vehicleBody} />
      </mesh>
      <mesh position={barrelCentre} quaternion={barrelTurn}>
        <cylinderGeometry args={[0.17, 0.22, BARREL_LENGTH, 10]} />
        <meshLambertMaterial color={tourColors.vehicleTrim} />
      </mesh>
    </>
  )
}

// The watering truck drives the tour, each example gets the truck for its job.
const fleet: FleetMember[] = [
  { route: 'tour', Truck: WateringTruck },
  { route: 0, Truck: RefuseTruck },
  { route: 1, Truck: Gritter },
  { route: 2, Truck: SewerTruck },
]

function FleetTruck({ story, route, Truck }: FleetMember & { story: Story }) {
  const body = useRef<Group>(null)
  const wheels = useRef<Group[]>([])

  useFrame(() => {
    const { vehicle } = story.current
    const inUse = vehicle.route === route
    if (body.current) body.current.visible = inUse
    if (!inUse) return
    const length = route === 'tour' ? tourLength : approachLengths[route]
    const spin = (vehicle.at * length) / WHEEL_RADIUS
    for (const wheel of wheels.current) wheel.rotation.x = spin
  })

  return (
    <group ref={body} visible={false}>
      <Truck wheels={wheels} />
    </group>
  )
}

export function StoryVehicle({ story }: { story: Story }) {
  const group = useRef<Group>(null)

  useFrame(() => {
    if (!group.current) return
    const { route, at, shown } = story.current.vehicle
    const path = route === 'tour' ? tourPath : approaches[route]
    const pose = vehiclePose(path, at, WHEELBASE)

    group.current.visible = shown > 0.01
    group.current.scale.setScalar(Math.max(0.001, shown))
    group.current.position.set(pose.at[0], roadHeight, pose.at[1])
    group.current.rotation.y = pose.heading
  })

  return (
    <group ref={group} visible={false}>
      {fleet.map((member) => (
        <FleetTruck key={member.route} story={story} {...member} />
      ))}
    </group>
  )
}

const jet = jetGeometry()
const WET_RADIUS = treePit.radius - treePit.kerbWidth

interface Drop {
  turn: number
  reach: number
  height: number
  offset: number
}

// Spread round the impact by the golden angle, so no two fly the same way.
const drops: Drop[] = Array.from({ length: 7 }, (_, index) => ({
  turn: index * 2.4,
  reach: 0.45 + ((index * 0.618) % 1) * 0.5,
  height: 0.3 + ((index * 0.382) % 1) * 0.4,
  offset: (index * 0.447) % 1,
}))

export function Watering({ story, isStatic }: ActorProps) {
  const stream = useRef<Mesh>(null)
  const splash = useRef<Group>(null)
  const wet = useRef<Mesh>(null)
  const ripple = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    const { watering } = story.current
    const { tail, head } = jetSpan(watering)
    const time = isStatic ? 0 : clock.getElapsedTime()
    const isLanding = !isStatic && head >= 1 && tail < 1

    if (stream.current) {
      stream.current.visible = head > tail
      if (stream.current.visible) shapeJet(jet, jetArc, tail, head, time)
    }
    if (splash.current) {
      splash.current.visible = isLanding
      if (isLanding) {
        splash.current.children.forEach((drop, index) => {
          const { turn, reach, height, offset } = drops[index]
          const flight = (time * 1.6 + offset) % 1
          drop.position.set(
            Math.cos(turn) * reach * flight,
            0.08 + height * 4 * flight * (1 - flight),
            Math.sin(turn) * reach * flight,
          )
          drop.scale.setScalar(1 - 0.6 * flight)
        })
      }
    }
    if (wet.current) {
      wet.current.visible = watering > 0
      ;(wet.current.material as MeshBasicMaterial).opacity = watering * 0.45
    }
    if (ripple.current) {
      const wave = (time * 0.9) % 1
      ripple.current.visible = isLanding
      ripple.current.scale.setScalar(0.5 + wave * 1.2)
      ;(ripple.current.material as MeshBasicMaterial).opacity = 0.6 * (1 - wave)
    }
  })

  return (
    <>
      {/* Reshaped every frame, so the bounds it was created with say nothing. */}
      <mesh ref={stream} geometry={jet} visible={false} frustumCulled={false}>
        <meshBasicMaterial vertexColors transparent depthWrite={false} />
      </mesh>
      <group ref={splash} position={jetTarget} visible={false}>
        {drops.map((drop) => (
          <mesh key={drop.turn}>
            <icosahedronGeometry args={[0.16, 0]} />
            <meshBasicMaterial color={WATER_GLINT} transparent opacity={0.9} depthWrite={false} />
          </mesh>
        ))}
      </group>
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
