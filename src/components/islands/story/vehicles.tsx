import type { RefObject } from 'react'
import {
  CatmullRomCurve3,
  ExtrudeGeometry,
  Shape,
  TubeGeometry,
  Vector2,
  Vector3,
  type Group,
} from 'three'
import { tourColors } from '../../../data/streamletTour'
import { VehicleBase } from '../scene3d/Vehicle'
import { fleetColors } from './fleetColors'

type Outline = readonly (readonly [number, number])[]

// A side view (z towards the front, y up) drawn across the truck's width.
function sideProfile(outline: Outline, width: number) {
  const shape = new Shape(outline.map(([z, y]) => new Vector2(z, y)))
  const geometry = new ExtrudeGeometry(shape, { depth: width, bevelEnabled: false })
  geometry.rotateY(-Math.PI / 2)
  geometry.translate(width / 2, 0, 0)
  return geometry
}

// A cross section (x across, y up) drawn from `rear` to `front`.
function crossProfile(outline: Outline, rear: number, front: number) {
  const shape = new Shape(outline.map(([x, y]) => new Vector2(x, y)))
  const geometry = new ExtrudeGeometry(shape, { depth: front - rear, bevelEnabled: false })
  geometry.translate(0, 0, rear)
  return geometry
}

interface Props {
  wheels: RefObject<Group[]>
}

const refuseTail = sideProfile(
  [
    [-2.7, 1.3],
    [-2.7, 5.05],
    [-3.5, 5.05],
    [-4.85, 3.85],
    [-5.1, 2.55],
    [-5.75, 2.25],
    [-5.75, 1.45],
    [-4.9, 1.3],
  ],
  3.45,
)

export function RefuseTruck({ wheels }: Props) {
  return (
    <VehicleBase wheels={wheels}>
      <mesh position={[0, 3.15, -0.3]}>
        <boxGeometry args={[3.3, 3.2, 4.8]} />
        <meshLambertMaterial color={fleetColors.refuseBody} />
      </mesh>
      <mesh geometry={refuseTail}>
        <meshLambertMaterial color={fleetColors.refuseTail} />
      </mesh>
      <mesh position={[0, 1.85, -5.7]}>
        <boxGeometry args={[2.7, 0.55, 0.2]} />
        <meshLambertMaterial color={fleetColors.frame} />
      </mesh>
    </VehicleBase>
  )
}

const HOPPER_REAR = -4.3
const HOPPER_FRONT = 1.9
const HOPPER_TOP = 4
const hopperOutline: Outline = [
  [-1.8, HOPPER_TOP],
  [-1.05, 1.6],
  [1.05, 1.6],
  [1.8, HOPPER_TOP],
]
const hopperWalls = crossProfile(
  [...hopperOutline, [1.55, HOPPER_TOP], [0.85, 1.85], [-0.85, 1.85], [-1.55, HOPPER_TOP]],
  HOPPER_REAR,
  HOPPER_FRONT,
)
const hopperBack = crossProfile(hopperOutline, HOPPER_REAR - 0.05, HOPPER_REAR + 0.2)
const hopperFront = crossProfile(hopperOutline, HOPPER_FRONT - 0.2, HOPPER_FRONT + 0.05)
// Heaped above the rim, so the load shows from every side.
const grit = crossProfile(
  [
    [-1.5, HOPPER_TOP - 0.1],
    [-0.9, 1.9],
    [0.9, 1.9],
    [1.5, HOPPER_TOP - 0.1],
    [0.5, HOPPER_TOP + 0.55],
    [-0.5, HOPPER_TOP + 0.55],
  ],
  HOPPER_REAR + 0.2,
  HOPPER_FRONT - 0.2,
)
const PLOUGH_STRIPES = [-1.8, -0.6, 0.6, 1.8]

export function Gritter({ wheels }: Props) {
  return (
    <VehicleBase wheels={wheels}>
      {[hopperWalls, hopperBack, hopperFront].map((geometry) => (
        <mesh key={geometry.uuid} geometry={geometry}>
          <meshLambertMaterial color={fleetColors.gritter} />
        </mesh>
      ))}
      <mesh geometry={grit}>
        <meshLambertMaterial color={fleetColors.grit} />
      </mesh>

      <mesh position={[0, 1.2, -4.85]}>
        <boxGeometry args={[0.6, 1.1, 0.7]} />
        <meshLambertMaterial color={fleetColors.frame} />
      </mesh>
      <mesh position={[0, 0.7, -5.65]}>
        <cylinderGeometry args={[0.95, 0.95, 0.16, 20]} />
        <meshLambertMaterial color={fleetColors.gritter} />
      </mesh>

      <mesh position={[0, 0.9, 5.8]}>
        <boxGeometry args={[1.8, 0.5, 1]} />
        <meshLambertMaterial color={fleetColors.frame} />
      </mesh>
      <group position={[0, 0.95, 6.6]} rotation={[0, -0.3, 0]}>
        <mesh>
          <boxGeometry args={[5.8, 1.5, 0.3]} />
          <meshLambertMaterial color={fleetColors.gritter} />
        </mesh>
        {PLOUGH_STRIPES.map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <boxGeometry args={[0.6, 1.54, 0.34]} />
            <meshLambertMaterial color={fleetColors.ploughStripe} />
          </mesh>
        ))}
      </group>
    </VehicleBase>
  )
}

const TANK_AXIS = 3.2
const TANK_RADIUS = 1.6
const TANK_REAR = -3.3
const TANK_FRONT = 2.1
const BOOM_HEIGHT = TANK_AXIS + TANK_RADIUS + 0.75
const BOOM_TIP = 5.6
const hose = new TubeGeometry(
  new CatmullRomCurve3([
    new Vector3(0, BOOM_HEIGHT + 0.5, -2),
    new Vector3(0, BOOM_HEIGHT + 0.55, 3),
    new Vector3(0, BOOM_HEIGHT + 0.4, BOOM_TIP + 0.2),
    new Vector3(0, BOOM_HEIGHT - 0.6, BOOM_TIP + 0.8),
    new Vector3(0, 1.5, BOOM_TIP + 0.8),
  ]),
  40,
  0.38,
  10,
)

export function SewerTruck({ wheels }: Props) {
  return (
    <VehicleBase wheels={wheels}>
      <mesh position={[0, TANK_AXIS, (TANK_REAR + TANK_FRONT) / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[TANK_RADIUS, TANK_RADIUS, TANK_FRONT - TANK_REAR, 24]} />
        <meshLambertMaterial color={fleetColors.sewerTank} />
      </mesh>
      <mesh position={[0, TANK_AXIS, TANK_REAR - 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[TANK_RADIUS + 0.12, TANK_RADIUS + 0.12, 0.3, 24]} />
        <meshLambertMaterial color={fleetColors.sewerTankEnd} />
      </mesh>

      <mesh position={[0, TANK_AXIS + TANK_RADIUS + 0.3, -2]}>
        <cylinderGeometry args={[0.5, 0.6, 0.8, 12]} />
        <meshLambertMaterial color={fleetColors.sewerAccent} />
      </mesh>
      <mesh position={[0, BOOM_HEIGHT, (BOOM_TIP - 2.4) / 2]}>
        <boxGeometry args={[0.6, 0.55, BOOM_TIP + 2.4]} />
        <meshLambertMaterial color={fleetColors.sewerAccent} />
      </mesh>
      <mesh geometry={hose}>
        <meshLambertMaterial color={fleetColors.hose} />
      </mesh>
      <mesh position={[0, 1.35, BOOM_TIP + 0.8]}>
        <cylinderGeometry args={[0.5, 0.5, 0.35, 14]} />
        <meshLambertMaterial color={fleetColors.sewerAccent} />
      </mesh>

      <group position={[0, 2.6, -4.75]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.75, 0.75, 2.4, 20]} />
          <meshLambertMaterial color={fleetColors.hose} />
        </mesh>
        {[1.25, -1.25].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[1.15, 1.15, 0.14, 24]} />
            <meshLambertMaterial color={fleetColors.sewerAccent} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 1.6, -4.75]}>
        <boxGeometry args={[2.6, 0.3, 0.8]} />
        <meshLambertMaterial color={tourColors.vehicleTrim} />
      </mesh>
    </VehicleBase>
  )
}
