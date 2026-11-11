import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, type RefObject } from 'react'
import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
  Matrix4,
  TubeGeometry,
  Vector3,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type OrthographicCamera,
} from 'three'
import { merged, painted, placed } from '../../../lib/paintedGeometry'
import { SOAK_POINTS, reachedPoints } from '../../../lib/soakLevel'

export interface SoakSource {
  target: number
  scrollDriven: boolean
  onChange: (() => void) | null
}

interface Props {
  isStatic: boolean
  isActive: boolean
  source: RefObject<SoakSource>
  labels: RefObject<(HTMLElement | null)[]>
  onReady: () => void
}

const HALF_WIDTH = 5
const HALF_DEPTH = 3
const SOIL_DEPTH = 8.6
const LAWN_HEIGHT = 0.22
const LAWN_OVERHANG = 0.04
// The soil is cut open along this plane; whatever sits in it sticks out.
const CUT = HALF_DEPTH

const TREE_X = -2.6
const TREE_Z = 2.2
const TRUNK_HEIGHT = 1.7
const CROWN_RADIUS = 1.75
const CROWN_HEIGHT = TRUNK_HEIGHT + CROWN_RADIUS * 0.75

const PROBE_X = 0.8
const CABLE_X = 1.12
const HEAD_X = 0.75
const RADIO_Y = -0.74
const RADIO_WIDTH = 0.6
const RADIO_HEIGHT = 0.7
const headDepths = SOAK_POINTS.map((point) => -point * SOIL_DEPTH)

const colors = {
  lawn: '#C9DBB0',
  tuft: '#A9C98A',
  tuftLit: '#B9D39C',
  topsoil: '#8E7558',
  subsoil: '#AD9474',
  deepSoil: '#C7B291',
  backfill: '#A38D70',
  grain: '#7C6549',
  pebble: '#D9D2C2',
  pebbleShaded: '#C2BBAA',
  root: '#EFE6D2',
  trunk: '#8A6E52',
  canopy: '#82AD66',
  canopyLit: '#95BC75',
  shaft: '#3A3F3A',
  shaftAir: '#DAD6C8',
  device: '#2B2E2B',
  deviceLabel: '#F1F3EA',
  prong: '#C9CFC4',
  worm: '#D9A5A0',
  water: '#2B7FBF',
  drop: '#7FAFC9',
  signal: '#ACB63B',
  ledIdle: '#6E7B3A',
  ledLit: '#DDEB6E',
} as const

const unitBox = new BoxGeometry(1, 1, 1)
const unitCylinder = new CylinderGeometry(1, 1, 1, 16)
const unitLobe = new IcosahedronGeometry(1, 1)
const unitPebble = new IcosahedronGeometry(1, 0)
const identity = new Matrix4()

// Deterministic, so the scattered details sit in the same place on every visit.
function seeded(seed: number) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Profile = (along: number) => number

/**
 * A band on the two faces the camera sees, between two height profiles. It
 * runs along the cut face and on around the corner, so a soil horizon or the
 * water front reads as one line across both.
 */
function faceBand(top: Profile, bottom: Profile, lift: number) {
  const positions: number[] = []
  const runs = [
    {
      start: 0,
      length: 2 * HALF_WIDTH + lift,
      at: (along: number) => [-HALF_WIDTH + along, CUT + lift] as const,
    },
    {
      start: 2 * HALF_WIDTH,
      length: 2 * HALF_DEPTH + lift,
      at: (along: number) => [HALF_WIDTH + lift, CUT + lift - along] as const,
    },
  ]

  for (const run of runs) {
    const steps = Math.ceil(run.length / 0.4)

    for (let step = 0; step < steps; step++) {
      const from = (run.length * step) / steps
      const to = (run.length * (step + 1)) / steps
      const [x0, z0] = run.at(from)
      const [x1, z1] = run.at(to)
      const top0 = top(run.start + from)
      const top1 = top(run.start + to)
      const bottom0 = bottom(run.start + from)
      const bottom1 = bottom(run.start + to)

      positions.push(x0, top0, z0, x0, bottom0, z0, x1, bottom1, z1)
      positions.push(x0, top0, z0, x1, bottom1, z1, x1, top1, z1)
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  // mergeGeometries wants the same attributes on every part.
  geometry.setAttribute(
    'uv',
    new Float32BufferAttribute(new Float32Array(positions.length / 1.5), 2),
  )
  geometry.computeVertexNormals()
  return geometry
}

const topsoilEdge: Profile = (along) =>
  -2.75 + 0.2 * Math.sin(along * 0.9) + 0.1 * Math.sin(along * 2.3 + 1)
const subsoilEdge: Profile = (along) =>
  -5.7 + 0.24 * Math.sin(along * 0.7 + 2) + 0.1 * Math.sin(along * 1.9)

function soilGeometry(): BufferGeometry[] {
  const random = seeded(7)
  const grains = Array.from({ length: 40 }, () => {
    const x = -HALF_WIDTH + 0.3 + random() * (2 * HALF_WIDTH - 0.6)
    const y = -0.4 - random() * (SOIL_DEPTH - 0.8)
    const size = 0.04 + random() * 0.05
    return painted(unitBox, placed([x, y, CUT], [size, size, 0.04]), colors.grain)
  })

  const pebbles: [number, number, number, number][] = [
    [3.2, -2.9, CUT, 0.24],
    [4.1, -5.9, CUT, 0.3],
    [2.6, -6.9, CUT, 0.2],
    [-4.3, -5.0, CUT, 0.26],
    [-0.9, -5.6, CUT, 0.18],
    [3.9, -1.0, CUT, 0.2],
    [-3.7, -7.3, CUT, 0.28],
    [HALF_WIDTH, -2.1, 1.4, 0.24],
    [HALF_WIDTH, -4.6, -0.9, 0.3],
    [HALF_WIDTH, -6.8, 0.7, 0.22],
  ]

  return [
    painted(
      unitBox,
      placed([0, -SOIL_DEPTH / 2, 0], [2 * HALF_WIDTH, SOIL_DEPTH, 2 * HALF_DEPTH]),
      colors.deepSoil,
    ),
    painted(
      faceBand(() => 0, topsoilEdge, 0.01),
      identity,
      colors.topsoil,
    ),
    painted(faceBand(topsoilEdge, subsoilEdge, 0.01), identity, colors.subsoil),
    ...grains,
    ...pebbles.map(([x, y, z, size], index) =>
      painted(
        unitPebble,
        placed([x, y, z], [size, size * 0.7, size * 0.85]),
        index % 2 === 0 ? colors.pebble : colors.pebbleShaded,
      ),
    ),
  ]
}

function lawnGeometry(): BufferGeometry[] {
  const random = seeded(23)
  const tuft = new CylinderGeometry(0, 0.09, 0.2, 4)
  const tufts: BufferGeometry[] = []

  while (tufts.length < 30) {
    const x = (random() * 2 - 1) * (HALF_WIDTH - 0.3)
    const z = (random() * 2 - 1) * (HALF_DEPTH - 0.3)
    const size = 0.7 + random() * 0.7
    const nearTrunk = Math.hypot(x - TREE_X, z - TREE_Z) < 0.8
    const onLid = Math.hypot(x - PROBE_X, z - CUT) < 1.3
    if (nearTrunk || onLid) continue

    tufts.push(
      painted(
        tuft,
        placed([x, LAWN_HEIGHT + 0.1 * size, z], [size, size, size]),
        tufts.length % 3 === 0 ? colors.tuftLit : colors.tuft,
      ),
    )
  }

  return [
    painted(
      unitBox,
      placed(
        [0, LAWN_HEIGHT / 2, 0],
        [2 * (HALF_WIDTH + LAWN_OVERHANG), LAWN_HEIGHT, 2 * (HALF_DEPTH + LAWN_OVERHANG)],
      ),
      colors.lawn,
    ),
    ...tufts,
  ]
}

/** A root along the cut face that thins out towards its tip. */
function rootGeometry(points: [number, number][], thick: number, thin: number, color: string) {
  const curve = new CatmullRomCurve3(points.map(([x, y]) => new Vector3(x, y, CUT + 0.05)))
  const segments = points.length * 6
  const sides = 6
  const geometry = new TubeGeometry(curve, segments, 1, sides, false)
  const position = geometry.attributes.position
  const center = new Vector3()
  const vertex = new Vector3()

  for (let ring = 0; ring <= segments; ring++) {
    const along = ring / segments
    const radius = thick + (thin - thick) * along
    curve.getPointAt(along, center)

    for (let side = 0; side <= sides; side++) {
      const index = ring * (sides + 1) + side
      vertex.fromBufferAttribute(position, index).sub(center).multiplyScalar(radius).add(center)
      position.setXYZ(index, vertex.x, vertex.y, vertex.z)
    }
  }

  return painted(geometry, identity, color)
}

function rootsGeometry(): BufferGeometry[] {
  const fine: [number, number][][] = [
    [
      [TREE_X, -0.5],
      [-1.6, -1.0],
      [-0.4, -1.5],
      [0.15, headDepths[0] + 0.02],
    ],
    [
      [TREE_X, -0.4],
      [-3.5, -0.9],
      [-4.4, -1.2],
      [-4.9, -1.1],
    ],
    [
      [-1.6, -1.0],
      [-1.1, -0.7],
      [-0.5, -0.75],
    ],
    [
      [-3.5, -0.9],
      [-3.9, -1.6],
      [-4.5, -1.9],
    ],
    [
      [-0.4, -1.5],
      [-0.6, -2.1],
      [-0.2, -2.5],
    ],
  ]
  const main: [number, number][][] = [
    [
      [-2.5, -0.8],
      [-1.9, -2.4],
      [-1.0, -3.6],
      [-0.3, -4.45],
      [0.15, headDepths[1] + 0.02],
    ],
    [
      [-2.7, -0.8],
      [-3.3, -2.3],
      [-4.0, -3.4],
      [-4.7, -3.8],
    ],
    [
      [-1.9, -2.4],
      [-2.3, -3.3],
      [-2.1, -4.2],
    ],
    [
      [-4.0, -3.4],
      [-4.2, -4.2],
      [-4.7, -4.6],
    ],
  ]
  const deep: [number, number][][] = [
    [
      [TREE_X, -0.9],
      [-2.7, -3.0],
      [-2.4, -5.0],
      [-1.6, -6.5],
      [-0.5, -7.2],
      [0.15, headDepths[2] + 0.02],
    ],
    [
      [-2.4, -5.0],
      [-3.2, -6.0],
      [-3.9, -6.6],
    ],
    [
      [-1.6, -6.5],
      [-1.7, -7.3],
      [-1.4, -7.9],
    ],
  ]

  return [
    painted(
      new CylinderGeometry(0.5, 0.2, 1.2, 8),
      placed([TREE_X, -0.6, CUT - 0.05], [1, 1, 1]),
      colors.root,
    ),
    ...fine.map((points) => rootGeometry(points, 0.07, 0.02, colors.root)),
    ...main.map((points) => rootGeometry(points, 0.13, 0.035, colors.root)),
    ...deep.map((points) => rootGeometry(points, 0.16, 0.04, colors.root)),
    rootGeometry(
      [
        [3.0, -3.6],
        [3.3, -3.4],
        [3.6, -3.65],
        [3.9, -3.45],
      ],
      0.07,
      0.05,
      colors.worm,
    ),
  ]
}

function probeGeometry(): BufferGeometry[] {
  const shaftTop = LAWN_HEIGHT + 0.06
  const shaftBottom = -1.25
  const shaftHeight = shaftTop - shaftBottom
  const shaftMiddle = (shaftTop + shaftBottom) / 2
  const shaftRadius = 0.86
  const wall = 0.09
  const radioTop = RADIO_Y + RADIO_HEIGHT / 2
  const lowest = headDepths[headDepths.length - 1]

  const cable = new CatmullRomCurve3([
    new Vector3(PROBE_X, RADIO_Y - RADIO_HEIGHT / 2, CUT + 0.2),
    new Vector3(PROBE_X + 0.06, -1.3, CUT + 0.15),
    new Vector3(CABLE_X, -1.7, CUT + 0.1),
    new Vector3(CABLE_X, -3.4, CUT + 0.1),
    new Vector3(CABLE_X, -5.4, CUT + 0.1),
    new Vector3(CABLE_X, lowest, CUT + 0.1),
  ])

  const heads = headDepths.flatMap((y) => [
    painted(unitBox, placed([HEAD_X, y, CUT + 0.14], [0.6, 0.44, 0.26]), colors.device),
    painted(unitBox, placed([CABLE_X - 0.08, y, CUT + 0.1], [0.2, 0.07, 0.07]), colors.device),
    ...[-0.14, 0, 0.14].map((offset) =>
      painted(
        new CylinderGeometry(0.032, 0.032, 0.6, 6).rotateZ(Math.PI / 2),
        placed([HEAD_X - 0.6, y + offset, CUT + 0.14], [1, 1, 1]),
        colors.prong,
      ),
    ),
  ])

  return [
    painted(
      unitBox,
      placed(
        [PROBE_X + 0.05, (shaftBottom + lowest - 0.5) / 2, CUT],
        [1.1, shaftBottom - lowest + 0.5, 0.05],
      ),
      colors.backfill,
    ),
    painted(
      unitBox,
      placed([PROBE_X, shaftMiddle, CUT + 0.03], [2 * shaftRadius, shaftHeight, 0.06]),
      colors.shaftAir,
    ),
    ...[-1, 1].map((side) =>
      painted(
        unitBox,
        placed(
          [PROBE_X + side * (shaftRadius - wall / 2), shaftMiddle, CUT],
          [wall, shaftHeight, 0.26],
        ),
        colors.shaft,
      ),
    ),
    painted(
      unitBox,
      placed([PROBE_X, shaftBottom + wall / 2, CUT], [2 * shaftRadius, wall, 0.26]),
      colors.shaft,
    ),
    // The lid lies flush in the lawn; only its back half is still in the block.
    painted(
      new CylinderGeometry(
        shaftRadius + 0.08,
        shaftRadius + 0.08,
        0.1,
        20,
        1,
        false,
        Math.PI / 2,
        Math.PI,
      ),
      placed([PROBE_X, shaftTop, CUT], [1, 1, 1]),
      colors.shaft,
    ),
    painted(
      unitBox,
      placed([PROBE_X, shaftTop, CUT + 0.07], [2 * (shaftRadius + 0.08), 0.1, 0.14]),
      colors.shaft,
    ),
    painted(
      unitBox,
      placed([PROBE_X, RADIO_Y, CUT + 0.2], [RADIO_WIDTH, RADIO_HEIGHT, 0.24]),
      colors.device,
    ),
    painted(
      unitBox,
      placed([PROBE_X, RADIO_Y - 0.03, CUT + 0.325], [RADIO_WIDTH - 0.16, 0.46, 0.02]),
      colors.deviceLabel,
    ),
    painted(
      unitCylinder,
      placed([PROBE_X - 0.2, radioTop + 0.13, CUT + 0.2], [0.045, 0.26, 0.045]),
      colors.device,
    ),
    painted(new TubeGeometry(cable, 48, 0.04, 6, false), identity, colors.device),
    ...heads,
  ]
}

function trunkGeometry(): BufferGeometry[] {
  return [
    painted(
      new CylinderGeometry(0.3, 0.46, 1, 8),
      placed([TREE_X, LAWN_HEIGHT + TRUNK_HEIGHT / 2, TREE_Z], [1, TRUNK_HEIGHT, 1]),
      colors.trunk,
    ),
  ]
}

const lobes: { at: readonly [number, number, number]; radius: number }[] = [
  { at: [0, 0, 0], radius: 1 },
  { at: [0.55, -0.2, 0.35], radius: 0.7 },
  { at: [-0.5, -0.15, -0.4], radius: 0.65 },
  { at: [0.1, 0.55, -0.15], radius: 0.6 },
]

const diorama = merged([
  ...soilGeometry(),
  ...lawnGeometry(),
  ...rootsGeometry(),
  ...probeGeometry(),
  ...trunkGeometry(),
])

// Built around the top of the trunk, the point the crown sways about.
const crown = merged(
  lobes.map((lobe, index) =>
    painted(
      unitLobe,
      placed(
        [
          lobe.at[0] * CROWN_RADIUS,
          CROWN_HEIGHT - TRUNK_HEIGHT + lobe.at[1] * CROWN_RADIUS,
          lobe.at[2] * CROWN_RADIUS,
        ],
        [lobe.radius * CROWN_RADIUS, lobe.radius * CROWN_RADIUS, lobe.radius * CROWN_RADIUS],
      ),
      index === 0 ? colors.canopy : colors.canopyLit,
    ),
  ),
)

// The water front is redrawn every frame it moves, so its ragged edge keeps
// its size instead of stretching with the depth.
function waterBand(lift: number, phase: number) {
  const geometry = faceBand(
    () => 0,
    (along) => 0.16 * Math.sin(along * 1.3 + phase) + 0.08 * Math.sin(along * 2.9 + phase * 2),
    lift,
  )
  const position = geometry.attributes.position
  const ripple = new Float32Array(position.count).fill(Number.NaN)

  // faceBand lays every quad out as six vertices; these three are its lower edge.
  for (let index = 0; index < position.count; index++) {
    if ([1, 2, 4].includes(index % 6)) ripple[index] = position.getY(index)
  }

  return { geometry, ripple }
}

function sinkWater(band: ReturnType<typeof waterBand>, depth: number) {
  const position = band.geometry.attributes.position

  for (let index = 0; index < position.count; index++) {
    const ripple = band.ripple[index]
    if (Number.isNaN(ripple)) continue
    position.setY(index, Math.max(-SOIL_DEPTH, Math.min(0, -depth + ripple)))
  }

  position.needsUpdate = true
}

const YAW = (26 * Math.PI) / 180
const PITCH = (20 * Math.PI) / 180
const towardsCamera = new Vector3(
  Math.sin(YAW) * Math.cos(PITCH),
  Math.sin(PITCH),
  Math.cos(YAW) * Math.cos(PITCH),
)
const screenRight = new Vector3(Math.cos(YAW), 0, -Math.sin(YAW))
const screenUp = new Vector3().crossVectors(towardsCamera, screenRight)

// What has to stay in frame: the corners of the block and the crown.
const extents: { at: Vector3; radius: number }[] = [
  ...[-1, 1].flatMap((x) =>
    [-1, 1].flatMap((z) =>
      [-SOIL_DEPTH, LAWN_HEIGHT].map((y) => ({
        at: new Vector3(x * HALF_WIDTH, y, z * HALF_DEPTH),
        radius: 0.1,
      })),
    ),
  ),
  {
    at: new Vector3(TREE_X, LAWN_HEIGHT + CROWN_HEIGHT + 0.25, TREE_Z),
    radius: CROWN_RADIUS * 1.15,
  },
]

const frame = (() => {
  let left = Infinity
  let right = -Infinity
  let bottom = Infinity
  let top = -Infinity

  for (const { at, radius } of extents) {
    left = Math.min(left, at.dot(screenRight) - radius)
    right = Math.max(right, at.dot(screenRight) + radius)
    bottom = Math.min(bottom, at.dot(screenUp) - radius)
    top = Math.max(top, at.dot(screenUp) + radius)
  }

  const center = screenRight
    .clone()
    .multiplyScalar((left + right) / 2)
    .addScaledVector(screenUp, (bottom + top) / 2)

  return { width: right - left, height: top - bottom, center }
})()

const FRAME_MARGIN = 0.97
const LABEL_X = 1.75

const drops = Array.from({ length: 7 }, (_, index) => ({
  x: -0.4 + ((index * 2.3) % 5),
  z: -1.8 + ((index * 1.7) % 4.2),
  offset: index * 0.37,
}))

function backOut(t: number) {
  const overshoot = 1.9
  return 1 + (overshoot + 1) * (t - 1) ** 3 + overshoot * (t - 1) ** 2
}

function Scene({ isStatic, source, labels, onReady }: Omit<Props, 'isActive'>) {
  const invalidate = useThree((state) => state.invalidate)
  const waterMesh = useRef<Mesh>(null)
  const frontMesh = useRef<Mesh>(null)
  const crownGroup = useRef<Group>(null)
  const rings = useRef<(Mesh | null)[]>([])
  const pulses = useRef<(Mesh | null)[]>([])
  const dropMeshes = useRef<(Mesh | null)[]>([])
  const led = useRef<Mesh>(null)
  const bands = useRef<{
    water: ReturnType<typeof waterBand>
    front: ReturnType<typeof waterBand>
  }>(null)
  const motion = useRef({
    level: -1,
    drawnLevel: -1,
    reached: -1,
    pop: [0, 0, 0],
    pulse: [1, 1, 1],
    flash: 0,
    rain: 0,
    framedWidth: 0,
    framedHeight: 0,
  })

  useEffect(() => {
    const current = source.current
    current.onChange = () => invalidate()
    return () => {
      current.onChange = null
    }
  }, [source, invalidate])

  useFrame(({ camera, size, clock }, delta) => {
    const state = motion.current
    const step = Math.min(delta, 0.05)
    const { target, scrollDriven } = source.current

    if (state.framedWidth !== size.width || state.framedHeight !== size.height) {
      const view = camera as OrthographicCamera
      view.zoom = FRAME_MARGIN * Math.min(size.width / frame.width, size.height / frame.height)
      view.position.copy(frame.center).addScaledVector(towardsCamera, 60)
      view.lookAt(frame.center)
      view.updateProjectionMatrix()
      view.updateMatrixWorld()

      const anchor = new Vector3()
      labels.current.forEach((label, index) => {
        if (!label) return
        anchor.set(LABEL_X, headDepths[index], CUT + 0.2).project(view)
        const x = ((anchor.x + 1) / 2) * size.width
        const y = ((1 - anchor.y) / 2) * size.height
        label.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translateY(-50%)`
      })

      if (state.framedWidth === 0) onReady()
      state.framedWidth = size.width
      state.framedHeight = size.height
    }

    const settled = isStatic || state.level < 0
    state.level = settled
      ? target
      : state.level + (target - state.level) * (1 - Math.exp(-step * (scrollDriven ? 10 : 2.2)))

    bands.current ??= { water: waterBand(0.03, 0), front: waterBand(0.035, 1.7) }
    if (Math.abs(state.level - state.drawnLevel) > 0.0005) {
      sinkWater(bands.current.water, state.level * SOIL_DEPTH)
      sinkWater(bands.current.front, state.level * SOIL_DEPTH + 0.35)
      state.drawnLevel = state.level
    }
    if (waterMesh.current && waterMesh.current.geometry !== bands.current.water.geometry) {
      waterMesh.current.geometry = bands.current.water.geometry
    }
    if (frontMesh.current && frontMesh.current.geometry !== bands.current.front.geometry) {
      frontMesh.current.geometry = bands.current.front.geometry
    }

    const reached = reachedPoints(state.level + 0.002)
    if (reached !== state.reached) {
      labels.current.forEach((label, index) => {
        if (label) label.dataset.reached = String(index < reached)
      })
      // A head that just got wet reports in; on the first frame nothing is news.
      if (state.reached >= 0 && !isStatic) {
        for (let index = state.reached; index < reached; index++) state.pulse[index] = 0
      }
      state.reached = reached
    }

    headDepths.forEach((depth, index) => {
      const wet = index < reached
      const pop = settled
        ? Number(wet)
        : Math.min(1, Math.max(0, state.pop[index] + (wet ? step : -step) / 0.45))
      state.pop[index] = pop

      const ring = rings.current[index]
      if (ring) {
        ring.visible = pop > 0.01
        ring.scale.setScalar(wet ? backOut(pop) : pop)
      }

      const pulse = pulses.current[index]
      if (pulse) {
        const progress = state.pulse[index]
        pulse.visible = progress < 1
        if (progress < 1) {
          const eased = progress * progress * (3 - 2 * progress)
          pulse.position.y = depth + (RADIO_Y - RADIO_HEIGHT / 2 - depth) * eased
          pulse.scale.setScalar(0.4 + 0.6 * Math.sin(Math.PI * progress))
          state.pulse[index] = Math.min(1, progress + step / (0.5 + index * 0.25))
          if (state.pulse[index] === 1) state.flash = 1
        }
      }
    })

    if (led.current) {
      state.flash = Math.max(0, state.flash - step / 0.9)
      const lamp = led.current.material as MeshBasicMaterial
      lamp.color.set(state.flash > 0 ? colors.ledLit : colors.ledIdle)
      led.current.scale.setScalar(1 + state.flash * 0.9)
    }

    const raining = !isStatic && target - state.level > 0.015
    state.rain = Math.min(1, Math.max(0, state.rain + (raining ? step : -step) / 0.3))
    const time = clock.getElapsedTime()

    dropMeshes.current.forEach((drop, index) => {
      if (!drop) return
      drop.visible = state.rain > 0.01
      const fall = (time * 1.3 + drops[index].offset) % 1
      drop.position.y = LAWN_HEIGHT + 3.4 * (1 - fall)
      drop.scale.setScalar(state.rain * Math.min(1, (1 - fall) * 6))
    })

    if (crownGroup.current && !isStatic) {
      crownGroup.current.rotation.z = Math.sin(time * 0.8) * 0.025
      crownGroup.current.rotation.x = Math.sin(time * 0.6 + 1) * 0.015
    }
  })

  // Same light as the tour: ambient and key add up to a little over pi on the
  // lit faces, so the pale tones stay pale without clipping to white.
  return (
    <>
      <ambientLight intensity={2.2} />
      <directionalLight position={[-30, 70, 60]} intensity={1.35} />

      <mesh geometry={diorama}>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>

      <group ref={crownGroup} position={[TREE_X, LAWN_HEIGHT + TRUNK_HEIGHT, TREE_Z]}>
        <mesh geometry={crown}>
          <meshLambertMaterial vertexColors flatShading />
        </mesh>
      </group>

      <mesh ref={waterMesh}>
        <meshBasicMaterial color={colors.water} transparent opacity={0.26} depthWrite={false} />
      </mesh>
      <mesh ref={frontMesh}>
        <meshBasicMaterial color={colors.water} transparent opacity={0.12} depthWrite={false} />
      </mesh>

      {headDepths.map((depth, index) => (
        <group key={depth}>
          <mesh
            ref={(mesh) => {
              rings.current[index] = mesh
            }}
            position={[HEAD_X - 0.15, depth, CUT + 0.3]}
            visible={false}
          >
            <torusGeometry args={[0.56, 0.06, 8, 32]} />
            <meshBasicMaterial color={colors.water} />
          </mesh>
          <mesh
            ref={(mesh) => {
              pulses.current[index] = mesh
            }}
            position={[CABLE_X, depth, CUT + 0.18]}
            visible={false}
          >
            <sphereGeometry args={[0.11, 12, 8]} />
            <meshBasicMaterial color={colors.signal} />
          </mesh>
        </group>
      ))}

      <mesh ref={led} position={[PROBE_X + 0.18, RADIO_Y + RADIO_HEIGHT / 2 - 0.07, CUT + 0.33]}>
        <sphereGeometry args={[0.05, 10, 8]} />
        <meshBasicMaterial color={colors.ledIdle} />
      </mesh>

      {drops.map((drop, index) => (
        <mesh
          key={drop.offset}
          ref={(mesh) => {
            dropMeshes.current[index] = mesh
          }}
          position={[drop.x, LAWN_HEIGHT + 3, drop.z]}
          visible={false}
        >
          <sphereGeometry args={[0.07, 8, 6]} />
          <meshBasicMaterial color={colors.drop} />
        </mesh>
      ))}
    </>
  )
}

// The ClientRouter swaps the document rather than unmounting react, so fiber's
// own teardown does not run reliably and every visit would leak a webgl context.
function ReleaseContextOnNavigate() {
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    const release = () => {
      gl.forceContextLoss()
      gl.dispose()
    }

    document.addEventListener('astro:before-swap', release)
    return () => document.removeEventListener('astro:before-swap', release)
  }, [gl])

  return null
}

function SoilProbe3D({ isStatic, isActive, source, labels, onReady }: Props) {
  const frameloop = !isActive ? 'never' : isStatic ? 'demand' : 'always'

  return (
    <Canvas
      flat
      orthographic
      dpr={[1, 2]}
      frameloop={frameloop}
      camera={{ position: [0, 0, 60], near: 1, far: 200, zoom: 1 }}
      gl={{ antialias: true, alpha: true }}
      className="h-full w-full"
    >
      <ReleaseContextOnNavigate />
      <Scene isStatic={isStatic} source={source} labels={labels} onReady={onReady} />
    </Canvas>
  )
}

export default SoilProbe3D
