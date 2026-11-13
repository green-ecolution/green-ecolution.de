import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import {
  CatmullRomCurve3,
  DoubleSide,
  Matrix4,
  Vector3,
  type BufferGeometry,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
} from 'three'
import { merged, painted, placed } from '../../../lib/paintedGeometry'
import {
  centerLine,
  cityBlocks,
  depotPosition,
  dwellAnchors,
  groundPlate,
  kerb,
  lawnHeight,
  lawns,
  refillMarker,
  roadHeight,
  roadWidth,
  roofUnits,
  staticTourPosition,
  stopMarker,
  stopPlacements,
  stopTrees,
  tourColors,
  tourFrame,
  tourLegs,
  tourLength,
  tourProjectedSize,
  tourWorldOffset,
  trees,
  type GroundPoint,
  type StopPlacement,
} from '../../../data/streamletTour'
import { blockGeometry, depotGeometry } from '../scene3d/buildings'
import { roundedSlab, unitBox, unitCylinder, unitDisc } from '../scene3d/primitives'
import ReleaseContextOnNavigate from '../scene3d/ReleaseContextOnNavigate'
import { appendRibbon, ribbonGeometry, type RibbonArrays } from '../scene3d/ribbon'
import { treeGeometry, treePit, treePitGeometry } from '../scene3d/trees'
import { Vehicle, WHEEL_RADIUS } from '../scene3d/Vehicle'

// A camera at [d, d, d] foreshortens by sqrt(2/3) against the 2:1 projection
// projectIso() uses, so the scene has to be scaled back up by that much to fill
// the frame the shared bounds describe.
const ISO_FORESHORTENING = Math.sqrt(2 / 3)

const [offsetX, offsetZ] = tourWorldOffset

function toWorld([x, z]: GroundPoint, y: number) {
  return new Vector3(x + offsetX, y, z + offsetZ)
}

function facing([x, z]: GroundPoint) {
  return Math.atan2(x, z)
}

// Open on purpose: the tour starts and ends on the same straight run in front
// of the depot, so the two ends of the road meet flush and the vehicle can
// stop dead there without the curve rounding the stop away.
const tourCurve = new CatmullRomCurve3(
  tourLegs
    .flatMap((leg, index) => (index === 0 ? leg.points : leg.points.slice(1)))
    .map((point) => toWorld(point, roadHeight)),
  false,
  'centripetal',
)

// A flat ribbon along the curve rather than a tube: the route is a road the
// vehicle drives on.
const road = (() => {
  const arrays: RibbonArrays = { position: [], normal: [], index: [] }
  appendRibbon(arrays, tourCurve, roadWidth, 0, 0, 1, 420)
  return ribbonGeometry(arrays)
})()

// The pavement is one wider ribbon a step below the carriageway; the road
// covers its middle, so only the two kerbs show.
const pavement = (() => {
  const arrays: RibbonArrays = { position: [], normal: [], index: [] }
  appendRibbon(arrays, tourCurve, roadWidth + kerb.width * 2, -kerb.drop, 0, 1, 420)
  return ribbonGeometry(arrays)
})()

const roadCenterLine = (() => {
  const arrays: RibbonArrays = { position: [], normal: [], index: [] }
  const length = tourCurve.getLength()
  const pattern = centerLine.dash + centerLine.gap
  const dashes = Math.floor(length / pattern)

  for (let i = 0; i < dashes; i++) {
    const from = (i * pattern) / length
    const to = Math.min(1, (i * pattern + centerLine.dash) / length)
    appendRibbon(arrays, tourCurve, centerLine.width, centerLine.lift, from, to, 6)
  }

  return ribbonGeometry(arrays)
})()

const ground = (() => {
  const { minX, minZ, width, depth, radius, thickness } = groundPlate
  const geometry = roundedSlab(width, depth, radius, thickness)
  geometry.translate(minX + width / 2 + offsetX, -thickness, minZ + depth / 2 + offsetZ)
  return geometry
})()

function roofUnitGeometry(): BufferGeometry[] {
  return roofUnits.map((unit) =>
    painted(
      unitBox,
      placed(
        [unit.at[0], unit.base + unit.height / 2, unit.at[1]],
        [unit.width, unit.height, unit.depth],
      ),
      tourColors.unitLit,
    ),
  )
}

function lawnGeometry(): BufferGeometry[] {
  return lawns.map((lawn) =>
    painted(
      roundedSlab(lawn.width, lawn.depth, 1.2, lawnHeight),
      new Matrix4().makeTranslation(lawn.x, 0, lawn.z),
      tourColors.lawn,
    ),
  )
}

function stopPinGeometry(stop: StopPlacement): BufferGeometry[] {
  const [x, z] = stop.at
  const m = stopMarker
  return [
    painted(
      unitCylinder,
      placed([x, m.plateHeight / 2, z], [m.plateRadius, m.plateHeight, m.plateRadius]),
      tourColors.stop,
    ),
    painted(
      unitCylinder,
      placed([x, m.postHeight / 2, z], [m.postRadius, m.postHeight, m.postRadius]),
      tourColors.stop,
    ),
    painted(
      unitCylinder,
      placed([x, m.postHeight + m.capHeight / 2, z], [m.capRadius, m.capHeight, m.capRadius]),
      tourColors.stop,
    ),
  ]
}

// A standpipe with a cabinet at its foot and a swing arm over the kerb, the
// arm high enough to clear the tank on the vehicle passing underneath.
function refillStationGeometry(stop: StopPlacement): BufferGeometry[] {
  const [x, z] = stop.at
  const m = refillMarker
  const turn = new Matrix4().makeRotationY(facing(stop.towardsRoad))
  const base = new Matrix4().makeTranslation(x, 0, z).multiply(turn)

  return [
    painted(
      unitCylinder,
      placed([x, m.plateHeight / 2, z], [m.plateRadius, m.plateHeight, m.plateRadius]),
      tourColors.refill,
    ),
    painted(
      unitBox,
      base.clone().multiply(placed([0.9, 0.9, -0.6], [1.1, 1.8, 1.1])),
      tourColors.refillCabinet,
    ),
    painted(
      unitCylinder,
      placed([x, m.postHeight / 2, z], [m.postRadius, m.postHeight, m.postRadius]),
      tourColors.refill,
    ),
    painted(
      unitCylinder,
      base
        .clone()
        .multiply(new Matrix4().makeTranslation(0, m.armHeight, m.armLength / 2))
        .multiply(new Matrix4().makeRotationX(Math.PI / 2))
        .multiply(new Matrix4().makeScale(m.armRadius, m.armLength, m.armRadius)),
      tourColors.refill,
    ),
    painted(
      unitCylinder,
      base
        .clone()
        .multiply(
          placed(
            [0, m.armHeight - m.nozzleLength / 2, m.armLength],
            [m.armRadius * 0.8, m.nozzleLength, m.armRadius * 0.8],
          ),
        ),
      tourColors.refill,
    ),
  ]
}

// Nothing in the town ever moves, so the whole of it, blocks, greenery and
// street furniture, goes into one merged geometry with its tones in the vertex
// colours: a single draw call however much detail it carries, which is what
// keeps the loop cheap enough to run all day.
const townGeometry = merged([
  ...cityBlocks.flatMap(blockGeometry),
  ...roofUnitGeometry(),
  ...depotGeometry(depotPosition),
  ...lawnGeometry(),
  ...stopTrees.flatMap(treePitGeometry),
  ...trees.flatMap(treeGeometry),
  ...stopPlacements.flatMap((stop) =>
    stop.kind === 'refill' ? refillStationGeometry(stop) : stopPinGeometry(stop),
  ),
]).translate(offsetX, 0, offsetZ)

// Soft discs under the crowns; without them the trees stand on their trunks
// like pins rather than on the ground.
const treeShadows = merged(
  trees.map((tree) => {
    const radius = tree.canopyRadius * 0.95
    return unitDisc
      .clone()
      .applyMatrix4(
        placed(
          [tree.at[0] + offsetX + radius * 0.25, 0.015, tree.at[1] + offsetZ + radius * 0.2],
          [radius, 1, radius],
        ),
      )
  }),
)

function headingAt(at: number) {
  const tangent = tourCurve.getTangentAt(at)
  return Math.atan2(tangent.x, tangent.z)
}

interface TourProps {
  isStatic: boolean
  levelRef: RefObject<HTMLDivElement | null>
}

const rippleWaves = 2

function TourAnimation({ isStatic, levelRef }: TourProps) {
  const vehicle = useRef<Group>(null)
  const wheels = useRef<Group[]>([])
  const ripple = useRef<Mesh>(null)
  const stream = useRef<Mesh>(null)
  const start = isStatic ? staticTourPosition : 0

  useFrame(({ clock }) => {
    if (isStatic) return

    const frame = tourFrame(clock.getElapsedTime())

    if (vehicle.current) {
      const point = tourCurve.getPointAt(frame.at)
      vehicle.current.position.copy(point)
      vehicle.current.rotation.y = headingAt(frame.at)
    }

    const spin = (frame.at * tourLength) / WHEEL_RADIUS
    for (const wheel of wheels.current) {
      wheel.rotation.x = spin
    }

    if (levelRef.current) {
      levelRef.current.style.transform = `scaleY(${frame.level})`
    }

    const anchor = frame.dwellMark ? dwellAnchors.get(frame.dwellMark) : undefined
    const fade = Math.min(1, frame.dwellProgress * 4, (1 - frame.dwellProgress) * 4)

    if (ripple.current) {
      const watering = frame.dwellMark?.kind === 'stop' && anchor !== undefined
      ripple.current.visible = watering

      if (watering && anchor) {
        const wave = (frame.dwellProgress * rippleWaves) % 1
        const spread = 0.7 + wave * 1.1
        ripple.current.position.set(
          anchor[0] + offsetX,
          treePit.kerbHeight + treePit.soilHeight + 0.04,
          anchor[1] + offsetZ,
        )
        ripple.current.scale.set(spread, spread, 1)
        ;(ripple.current.material as MeshBasicMaterial).opacity = 0.55 * (1 - wave) * fade
      }
    }

    if (stream.current) {
      const filling = frame.dwellMark?.kind === 'refill' && anchor !== undefined
      stream.current.visible = filling

      if (filling && anchor) {
        stream.current.position.set(
          anchor[0] + offsetX,
          refillMarker.armHeight - refillMarker.nozzleLength - 0.3,
          anchor[1] + offsetZ,
        )
        ;(stream.current.material as MeshBasicMaterial).opacity = 0.8 * fade
      }
    }
  })

  return (
    <>
      <group
        ref={vehicle}
        position={tourCurve.getPointAt(start)}
        rotation={[0, headingAt(start), 0]}
      >
        <Vehicle wheels={wheels} />
      </group>

      {!isStatic && (
        <>
          <mesh ref={ripple} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.85, 1.12, 32]} />
            <meshBasicMaterial
              color={tourColors.water}
              transparent
              opacity={0}
              depthWrite={false}
            />
          </mesh>

          <mesh ref={stream} visible={false}>
            <cylinderGeometry args={[0.16, 0.11, 0.6, 10]} />
            <meshBasicMaterial
              color={tourColors.water}
              transparent
              opacity={0}
              depthWrite={false}
            />
          </mesh>
        </>
      )}
    </>
  )
}

function TourModel({ isStatic, levelRef }: TourProps) {
  const size = useThree((state) => state.size)
  const fit =
    Math.min(size.width / tourProjectedSize.width, size.height / tourProjectedSize.height) /
    ISO_FORESHORTENING

  // Lambert divides the light by pi, so ambient and key together come to a
  // little over pi on the lit faces: the pale walls stay pale without clipping
  // to white. The key comes in over the +z side so the two visible faces of
  // every box read as two faces.
  return (
    <>
      <ambientLight intensity={2.2} />
      <directionalLight position={[-30, 60, 80]} intensity={1.35} />

      <group scale={fit}>
        <mesh geometry={ground}>
          <meshLambertMaterial color={tourColors.ground} />
        </mesh>

        <mesh geometry={treeShadows}>
          <meshBasicMaterial
            color={tourColors.shadow}
            transparent
            opacity={0.1}
            depthWrite={false}
          />
        </mesh>

        <mesh geometry={pavement}>
          <meshLambertMaterial color={tourColors.kerb} side={DoubleSide} />
        </mesh>

        <mesh geometry={road}>
          <meshLambertMaterial color={tourColors.road} side={DoubleSide} />
        </mesh>

        <mesh geometry={roadCenterLine}>
          <meshLambertMaterial color={tourColors.roadLine} side={DoubleSide} />
        </mesh>

        <mesh geometry={townGeometry}>
          <meshLambertMaterial vertexColors flatShading />
        </mesh>

        <TourAnimation isStatic={isStatic} levelRef={levelRef} />
      </group>
    </>
  )
}

function StreamletTour3D({ isStatic, levelRef }: TourProps) {
  return (
    <Canvas
      flat
      orthographic
      dpr={[1, 2]}
      frameloop={isStatic ? 'demand' : 'always'}
      camera={{ position: [1200, 1200, 1200], near: 1, far: 6000, zoom: 1 }}
      onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
      gl={{ antialias: true, alpha: true }}
      className="h-full w-full"
    >
      <ReleaseContextOnNavigate />
      <TourModel isStatic={isStatic} levelRef={levelRef} />
    </Canvas>
  )
}

export default StreamletTour3D
