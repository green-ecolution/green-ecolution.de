import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, type RefObject } from 'react'
import {
  BufferGeometry,
  CatmullRomCurve3,
  DoubleSide,
  Vector3,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
} from 'three'
import { HYDRANT_SITE, gateway, hydrant, type TownTree } from '../../../data/productTown'
import type { GroundPoint } from '../../../lib/storyPath'
import { roadHeight, tourColors } from '../../../data/streamletTour'
import { WATER_SECONDS, relayAt, type TourFrame, type TourScript } from '../../../lib/wateringDay'
import { damp } from '../scene3d/damp'
import { appendRibbon, ribbonGeometry, type RibbonArrays } from '../scene3d/ribbon'
import { treePit } from '../scene3d/trees'
import { Vehicle, WHEEL_RADIUS } from '../scene3d/Vehicle'
import { WATER, jetGeometry, jetSpan, shapeJet, type JetArc } from '../scene3d/waterJet'
import { showpieceStop } from './closeView'
import { hoseGeometry, shapeHose } from './hose'
import { PROBE_TOP, probeAt } from './probe'
import { RadioRings, type RingSource } from './RadioRings'
import { GATEWAY_TIP, relayDot, type RelayHop } from './relay'
import type { DayLive } from './shared'
import { showpieceWeight, turned, wateredTree, type Stage, type TruckPose } from './stage'
import { HYDRANT_ARM } from './town'

interface TourProps {
  live: RefObject<DayLive>
  stage: RefObject<Stage>
  isStatic: boolean
}

const RIBBON_WIDTH = 1.1
const RIBBON_LIFT = 0.07

// One ribbon per leg: where the truck leaves a stop the way it came, a single
// curve through all legs would fold back on itself.
function ribbonFor(script: TourScript) {
  const arrays: RibbonArrays = { position: [], normal: [], index: [] }
  let segments = 0

  for (const leg of script.legs) {
    const curve = new CatmullRomCurve3(
      leg.path.map(([x, z]) => new Vector3(x, roadHeight, z)),
      false,
      'centripetal',
    )
    const count = Math.max(8, Math.round(leg.length / 1.2))
    appendRibbon(arrays, curve, RIBBON_WIDTH, RIBBON_LIFT, 0, 1, count)
    segments += count
  }

  return { geometry: ribbonGeometry(arrays), segments }
}

export function RouteRibbon({ live, stage, isStatic }: TourProps) {
  const mesh = useRef<Mesh>(null)
  const built = useRef<TourScript | null>(null)
  const segments = useRef(0)

  useEffect(() => {
    const node = mesh.current
    return () => node?.geometry.dispose()
  }, [])

  useFrame(() => {
    const node = mesh.current
    if (!node) return
    const { script } = live.current

    if (script !== built.current) {
      built.current = script
      node.geometry.dispose()
      const ribbon = script ? ribbonFor(script) : null
      node.geometry = ribbon?.geometry ?? new BufferGeometry()
      segments.current = ribbon?.segments ?? 0
    }

    node.visible = script !== null
    const reveal = isStatic ? 1 : (stage.current.frame?.reveal ?? 0)
    // Two triangles per segment, so the ribbon grows a segment at a time.
    node.geometry.setDrawRange(0, Math.floor(reveal * segments.current) * 6)
  })

  return (
    <mesh ref={mesh} visible={false}>
      <meshBasicMaterial color={tourColors.refill} side={DoubleSide} />
    </mesh>
  )
}

// The monitor sits on the crown of the tank and turns towards the tree.
const MONITOR_AT = { x: 0, y: 4.45, z: 0.3 } as const
const BARREL_LENGTH = 1
const BARREL_PITCH = 0.6
const PIT_TOP = treePit.kerbHeight + treePit.soilHeight
/** The water lands this far on the truck's side of the trunk. */
const SHORT_OF_TRUNK = 0.9

function monitorPivot(truck: TruckPose): readonly [number, number] {
  const sin = Math.sin(truck.heading)
  const cos = Math.cos(truck.heading)
  return [
    truck.at[0] + MONITOR_AT.x * cos + MONITOR_AT.z * sin,
    truck.at[1] - MONITOR_AT.x * sin + MONITOR_AT.z * cos,
  ]
}

/** Direction from the monitor to the tree, as an angle about the vertical axis. */
function aimAt(truck: TruckPose, tree: TownTree): number {
  const [x, z] = monitorPivot(truck)
  return Math.atan2(tree.at[0] - x, tree.at[1] - z)
}

export function Truck({ live, stage, isStatic }: TourProps) {
  const body = useRef<Group>(null)
  const turret = useRef<Group>(null)
  const wheels = useRef<Group[]>([])
  const aim = useRef(0)

  useFrame((_, delta) => {
    const { truck, frame } = stage.current
    if (!body.current) return
    body.current.position.set(truck.at[0], roadHeight, truck.at[1])
    body.current.rotation.y = truck.heading
    const spin = truck.travelled / WHEEL_RADIUS
    for (const wheel of wheels.current) wheel.rotation.x = spin

    const tree = wateredTree(live.current.script, frame)
    const goal = tree ? aimAt(truck, tree) - truck.heading : 0
    aim.current = isStatic ? goal : turned(aim.current, goal, damp(0, 1, 10, delta))
    if (turret.current) turret.current.rotation.y = aim.current
  })

  return (
    <group ref={body}>
      <Vehicle wheels={wheels} />
      <group ref={turret} position={[MONITOR_AT.x, MONITOR_AT.y, MONITOR_AT.z]}>
        <mesh position={[0, -0.25, 0]}>
          <cylinderGeometry args={[0.3, 0.36, 0.6, 12]} />
          <meshLambertMaterial color={tourColors.vehicleBody} />
        </mesh>
        <mesh
          position={[
            0,
            (Math.sin(BARREL_PITCH) * BARREL_LENGTH) / 2,
            (Math.cos(BARREL_PITCH) * BARREL_LENGTH) / 2,
          ]}
          rotation={[Math.PI / 2 - BARREL_PITCH, 0, 0]}
        >
          <cylinderGeometry args={[0.17, 0.22, BARREL_LENGTH, 10]} />
          <meshLambertMaterial color={tourColors.vehicleTrim} />
        </mesh>
      </group>
    </group>
  )
}

// From the barrel's mouth into the pit; the water leaves along the barrel,
// which fixes how high it climbs.
function aimJet(truck: TruckPose, tree: TownTree) {
  const [x, z] = monitorPivot(truck)
  const yaw = aimAt(truck, tree)
  const out = Math.cos(BARREL_PITCH) * BARREL_LENGTH
  arc.from.set(
    x + Math.sin(yaw) * out,
    roadHeight + MONITOR_AT.y + Math.sin(BARREL_PITCH) * BARREL_LENGTH,
    z + Math.cos(yaw) * out,
  )
  arc.to.set(
    tree.at[0] - Math.sin(yaw) * SHORT_OF_TRUNK,
    PIT_TOP,
    tree.at[1] - Math.cos(yaw) * SHORT_OF_TRUNK,
  )
  const reach = Math.hypot(arc.to.x - arc.from.x, arc.to.z - arc.from.z)
  const climb = Math.tan(BARREL_PITCH) * reach
  const drop = arc.from.y - arc.to.y
  arc.rise = (climb * climb) / (4 * (climb + drop))
}

// The jet starts and stops as at a plain stop; a longer one, held for its
// card, keeps it running in between.
function jetShare(script: TourScript, frame: TourFrame): number {
  const { start, end } = script.dwells[frame.dwell]
  const standing = end - start
  const since = frame.dwellShare * standing
  const plain = Math.min(standing, WATER_SECONDS)
  if (since < plain / 2) return since / plain
  if (standing - since < plain / 2) return 1 - (standing - since) / plain
  return 0.5
}

const WET_RADIUS = treePit.radius - treePit.kerbWidth
// One jet for the one truck; the frame loop reshapes it and aims the arc.
const jet = jetGeometry()
const arc: JetArc = { from: new Vector3(), to: new Vector3(), rise: 1 }

export function WaterJet({ live, stage, isStatic }: TourProps) {
  const stream = useRef<Mesh>(null)
  const wet = useRef<Mesh>(null)
  const ripple = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    const { frame, truck } = stage.current
    const { script } = live.current
    const tree = isStatic ? null : wateredTree(script, frame)
    const watering = tree && frame ? frame.dwellShare : 0
    const { tail, head } = jetSpan(tree && frame && script ? jetShare(script, frame) : 0)
    const time = clock.getElapsedTime()

    if (tree) aimJet(truck, tree)
    if (stream.current) {
      stream.current.visible = tree !== null && head > tail
      if (stream.current.visible) shapeJet(jet, arc, tail, head, time)
    }
    if (wet.current) {
      wet.current.visible = tree !== null
      if (tree) {
        wet.current.position.set(tree.at[0], PIT_TOP + 0.02, tree.at[1])
        ;(wet.current.material as MeshBasicMaterial).opacity = watering * 0.45
      }
    }
    if (ripple.current) {
      const isLanding = tree !== null && head >= 1 && tail < 1
      ripple.current.visible = isLanding
      if (isLanding) {
        const wave = (time * 0.9) % 1
        ripple.current.position.set(arc.to.x, PIT_TOP + 0.04, arc.to.z)
        ripple.current.scale.setScalar(0.4 + wave * 0.9)
        ;(ripple.current.material as MeshBasicMaterial).opacity = 0.6 * (1 - wave)
      }
    }
  })

  return (
    <>
      {/* Reshaped every frame, so the bounds it was created with say nothing. */}
      <mesh ref={stream} geometry={jet} visible={false} frustumCulled={false}>
        <meshBasicMaterial vertexColors transparent depthWrite={false} />
      </mesh>
      <mesh ref={wet} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <circleGeometry args={[WET_RADIUS, 32]} />
        <meshBasicMaterial color={WATER} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh ref={ripple} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.85, 1.12, 32]} />
        <meshBasicMaterial color={WATER} transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  )
}

/** Rings of water spreading under the truck while it stands at a water point. */
export function RefillPulse({ live, stage, isStatic }: TourProps) {
  const ring = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    const node = ring.current
    if (!node) return
    const { frame, truck } = stage.current
    const { script } = live.current
    const isRefilling =
      !isStatic &&
      script !== null &&
      frame !== null &&
      !frame.done &&
      frame.dwell >= 0 &&
      script.dwells[frame.dwell].stop.kind === 'refill'
    node.visible = isRefilling
    if (!isRefilling) return

    const wave = (clock.getElapsedTime() * 1.1) % 1
    node.position.set(truck.at[0], roadHeight + 0.12, truck.at[1])
    node.scale.setScalar(2 + wave * 4)
    ;(node.material as MeshBasicMaterial).opacity = 0.7 * (1 - wave)
  })

  return (
    <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.85, 1, 40]} />
      <meshBasicMaterial
        color={WATER}
        transparent
        opacity={0}
        depthWrite={false}
        side={DoubleSide}
      />
    </mesh>
  )
}

// The filler dome on the crown of the tank in scene3d/Vehicle, its top.
const DOME = { y: 4.575, z: -1.2 } as const
/** Seconds the hose takes to reach the truck, and to come off it again. */
const HOSE_REACH = 0.45
const hose = hoseGeometry()
const outlet = new Vector3()
const dome = new Vector3()

/** From the hydrant up to the tank while the truck refills there, with water running through. */
export function RefillHose({ live, stage, isStatic }: TourProps) {
  const mesh = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    const node = mesh.current
    if (!node) return
    const { frame, truck } = stage.current
    const { script } = live.current
    const dwell =
      script && frame && !frame.done && frame.dwell >= 0 ? script.dwells[frame.dwell] : null
    const isFilling = !isStatic && dwell?.stop.kind === 'refill' && dwell.stop.site === HYDRANT_SITE
    node.visible = isFilling
    if (!isFilling || !dwell || !frame) return

    const standing = dwell.end - dwell.start
    const since = frame.dwellShare * standing
    const reach = Math.min(1, since / HOSE_REACH, (standing - since) / HOSE_REACH)
    const side = Math.sign(truck.at[0] - hydrant.at[0]) || -1
    outlet.set(hydrant.at[0] + side * HYDRANT_ARM.half, HYDRANT_ARM.height, hydrant.at[1])
    dome.set(
      truck.at[0] + Math.sin(truck.heading) * DOME.z,
      roadHeight + DOME.y,
      truck.at[1] + Math.cos(truck.heading) * DOME.z,
    )
    shapeHose(hose, outlet, dome, reach, clock.getElapsedTime())
  })

  return (
    <mesh ref={mesh} geometry={hose} visible={false} frustumCulled={false}>
      <meshLambertMaterial vertexColors />
    </mesh>
  )
}

/** Radio rings rising from the probe at the first tree while it reports. */
export function ProbeRings({ live, stage, isStatic }: TourProps) {
  const probe = useRef<{ script: TourScript | null; at: GroundPoint | null }>({
    script: null,
    at: null,
  })

  const source = (): RingSource | null => {
    const { script } = live.current
    if (probe.current.script !== script) {
      const tree = script && showpieceStop(script)?.tree
      probe.current = { script, at: tree ? probeAt(tree) : null }
    }
    const { at } = probe.current
    const { view, lens } = stage.current
    if (isStatic || !at || view.piece !== 'probe') return null
    return { at, base: PROBE_TOP + 0.4, power: showpieceWeight(view), lens }
  }

  return <RadioRings source={source} />
}

const DOT_RADIUS = 0.42
// Smallest radius in css pixels: in the picture of the whole town the dot
// would otherwise be two pixels wide.
const MIN_DOT_PX = 6
/** The dots of the trail the message leaves behind, per hop, and their size next to the message. */
const TRAIL = { up: 9, over: 16 } as const
const TRAIL_SIZE = 0.45
const HALO_SIZE = 2.1
// The camera follows the message closely: right at the lens it would fill the picture.
const NEAR_LENS = { hidden: 3, shown: 9 } as const

interface TrailDot {
  hop: RelayHop
  /** Where on its hop the dot lies, 0 to 1. */
  share: number
}

const trail: TrailDot[] = (['up', 'over'] as const).flatMap((hop) =>
  Array.from({ length: TRAIL[hop] }, (_, index) => ({ hop, share: (index + 0.5) / TRAIL[hop] })),
)

/**
 * The probe's message: a dot of light that travels from the probe up to the
 * gateway and over to the depot, and the dotted trail it leaves on its way.
 */
export function RelayMessage({ live, stage, isStatic }: TourProps) {
  const dot = useRef<Mesh>(null)
  const halo = useRef<Mesh>(null)
  const marks = useRef<(Mesh | null)[]>([])
  const sender = useRef<{ script: TourScript | null; tree: TownTree | null }>({
    script: null,
    tree: null,
  })

  useFrame(({ camera }) => {
    const { script, elapsed } = live.current
    if (sender.current.script !== script) {
      sender.current = { script, tree: (script && showpieceStop(script)?.tree) ?? null }
      // The trail lies where this tour's first tree stands.
      const { tree } = sender.current
      marks.current.forEach((mark, index) => {
        if (!mark || !tree) return
        const { at } = relayDot(tree, trail[index].hop, trail[index].share)
        mark.position.set(at[0], at[1], at[2])
      })
    }
    const { tree } = sender.current
    const relay = script && tree && !isStatic ? relayAt(script, elapsed) : null
    // An orthographic zoom is css pixels per world unit.
    const radius = Math.max(DOT_RADIUS, MIN_DOT_PX / camera.zoom)

    marks.current.forEach((mark, index) => {
      if (!mark) return
      const { hop, share } = trail[index]
      mark.visible = relay !== null && relay[hop] >= share
      mark.scale.setScalar(radius * TRAIL_SIZE)
    })

    if (!dot.current || !halo.current) return
    if (!relay || !tree) {
      dot.current.visible = false
      halo.current.visible = false
      return
    }
    const { at, size } =
      relay.over > 0 ? relayDot(tree, 'over', relay.over) : relayDot(tree, 'up', relay.up)
    const { lens } = stage.current
    const away = lens ? Math.hypot(at[0] - lens[0], at[1] - lens[1], at[2] - lens[2]) : Infinity
    const near = Math.min(
      1,
      Math.max(0, (away - NEAR_LENS.hidden) / (NEAR_LENS.shown - NEAR_LENS.hidden)),
    )
    const shown = size * near
    dot.current.visible = halo.current.visible = shown > 0.01
    dot.current.position.set(at[0], at[1], at[2])
    halo.current.position.copy(dot.current.position)
    dot.current.scale.setScalar(shown * radius)
    halo.current.scale.setScalar(shown * radius * HALO_SIZE)
  })

  // Drawn over crowns and roofs: the message and its way are never out of sight.
  return (
    <>
      {trail.map((mark, index) => (
        <mesh
          key={`${mark.hop}-${mark.share}`}
          ref={(node) => {
            marks.current[index] = node
          }}
          visible={false}
          renderOrder={2}
        >
          <sphereGeometry args={[1, 8, 6]} />
          <meshBasicMaterial color={tourColors.refill} depthTest={false} depthWrite={false} />
        </mesh>
      ))}
      <mesh ref={halo} visible={false} renderOrder={2}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial
          color={tourColors.refill}
          transparent
          opacity={0.28}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={dot} visible={false} renderOrder={3}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial color={tourColors.refill} depthTest={false} depthWrite={false} />
      </mesh>
    </>
  )
}

/** Radio rings at the gateway while the message rests there and as it leaves for the depot. */
export function GatewayRings({ live, stage, isStatic }: TourProps) {
  const source = (): RingSource | null => {
    const { script, elapsed } = live.current
    const relay = script && !isStatic ? relayAt(script, elapsed) : null
    if (!relay || relay.up < 1) return null
    // They fade as the message gets under way again.
    const power = Math.max(0, 1 - relay.over * 2.5)
    return { at: gateway.at, base: GATEWAY_TIP[1] - 0.3, power, lens: stage.current.lens }
  }

  return <RadioRings source={source} />
}
