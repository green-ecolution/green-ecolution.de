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
import { HYDRANT_SITE, hydrant, type TownTree } from '../../../data/productTown'
import { roadHeight, tourColors } from '../../../data/streamletTour'
import { WATER_SECONDS, type TourFrame, type TourScript } from '../../../lib/wateringDay'
import { damp } from '../scene3d/damp'
import { appendRibbon, ribbonGeometry, type RibbonArrays } from '../scene3d/ribbon'
import { treePit } from '../scene3d/trees'
import { Vehicle, WHEEL_RADIUS } from '../scene3d/Vehicle'
import { WATER, jetGeometry, jetSpan, shapeJet, type JetArc } from '../scene3d/waterJet'
import { hoseGeometry, shapeHose } from './hose'
import type { DayLive } from './shared'
import { turned, wateredTree, type Stage, type TruckPose } from './stage'
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
