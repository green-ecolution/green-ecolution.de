import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, type RefObject } from 'react'
import { DEPOT_SITE } from '../../../data/productTown'
import { tourColors } from '../../../data/streamletTour'
import { geometric } from '../../../lib/cameraPose'
import { AMBIENT_MS, MAX_DPR } from '../../../lib/sceneBudget'
import { smoothDamp } from '../../../lib/smoothDamp'
import {
  ISO_VIEW,
  holdAt,
  nextElapsed,
  relayAt,
  tourFrame,
  type Hold,
  type ViewMode,
} from '../../../lib/wateringDay'
import { UNSCALED_PIN_ZOOM } from '../scene3d/pinSize'
import ReleaseContextOnNavigate from '../scene3d/ReleaseContextOnNavigate'
import { Crowns, HitAreas, Labels, TreePins } from './actors'
import { barCover, cardCover } from './covers'
import type { DayEvents, DayLive, TourProgress } from './shared'
import { ShowpieceCamera } from './showpieceCamera'
import {
  OVERVIEW,
  PARKED,
  mapShot,
  showpieceWeight,
  shotFor,
  townFit,
  truckPose,
  type Shot,
  type Stage,
} from './stage'
import {
  GatewayRings,
  ProbeRings,
  RefillHose,
  RefillPulse,
  RelayMessage,
  RouteRibbon,
  Truck,
  WaterJet,
} from './tourActors'
import { groundGeometry, shadowGeometry, townGeometry } from './town'

interface Props {
  isStatic: boolean
  isActive: boolean
  isReady: boolean
  live: RefObject<DayLive>
  events: DayEvents
  labels: RefObject<(HTMLElement | null)[]>
  /** The node that carries `--day-tank` for the gauges. */
  tank: RefObject<HTMLElement | null>
}

const CAMERA_DISTANCE = 600
/** Seconds the slanted camera's spring takes to close most of a gap. */
const SMOOTH_TIME = 0.9
// A frame after a pause must not jump the tour or the camera ahead.
const MAX_FRAME_SECONDS = 0.05
const UNREPORTED: TourProgress = { served: -1, dwell: -2, done: false, routed: false }
const CAMERA_NAMES: Record<ViewMode, string> = {
  iso: 'iso',
  flyIn: 'fly-in',
  probing: 'probing',
  toGateway: 'to-gateway',
  gateway: 'gateway',
  ride: 'ride',
  toWatering: 'to-watering',
  watering: 'watering',
  refilling: 'refilling',
  result: 'result',
  flyOut: 'fly-out',
}

interface ClockProps {
  isStatic: boolean
  liveRef: RefObject<DayLive>
  stageRef: RefObject<Stage>
  events: DayEvents
  tankRef: RefObject<HTMLElement | null>
}

// Mounted first, so every other part reads the state of the same frame.
function DayClock({ isStatic, liveRef, stageRef, events, tankRef }: ClockProps) {
  const invalidate = useThree((state) => state.invalidate)
  const canvas = useThree((state) => state.gl.domElement)
  const awakeUntil = useRef(0)
  const reported = useRef(UNREPORTED)
  const ready = useRef(false)
  const camera = useRef<ViewMode | null>(null)
  const holding = useRef<Hold['kind'] | null>(null)
  const relaying = useRef(false)
  const standing = useRef<{ dwell: number; heading: number }>({ dwell: -1, heading: 0 })

  // The stage tells the page which camera draws: the caption and the probe read it.
  useEffect(() => {
    const node = canvas.closest('[data-day-stage]')
    return () => {
      node?.removeAttribute('data-day-camera')
      node?.removeAttribute('data-day-hold')
      node?.removeAttribute('data-day-turn')
      node?.removeAttribute('data-day-relay')
    }
  }, [canvas])

  useEffect(() => {
    const state = liveRef.current
    state.onChange = () => {
      awakeUntil.current = performance.now() + AMBIENT_MS
      invalidate()
    }
    state.onChange()
    return () => {
      state.onChange = null
    }
  }, [liveRef, invalidate])

  useFrame((_, delta) => {
    const state = liveRef.current
    const { script } = state
    if (script && state.running) {
      state.elapsed = nextElapsed(
        script,
        state.elapsed,
        Math.min(delta, MAX_FRAME_SECONDS),
        state.isReading,
      )
    }

    const frame = script ? tourFrame(script, state.elapsed) : null
    stageRef.current.frame = frame
    stageRef.current.truck = truckPose(script, frame)
    const view = isStatic || !frame ? ISO_VIEW : frame.view
    stageRef.current.view = view
    if (view.mode !== camera.current) {
      if (view.mode === 'flyIn' && view.piece) events.onCloseUp(view.piece)
      camera.current = view.mode
      canvas.closest('[data-day-stage]')?.setAttribute('data-day-camera', CAMERA_NAMES[view.mode])
    }

    // The message's way to the depot has a caption of its own.
    const isRelaying = !isStatic && script !== null && relayAt(script, state.elapsed) !== null
    if (isRelaying !== relaying.current) {
      relaying.current = isRelaying
      canvas.closest('[data-day-stage]')?.toggleAttribute('data-day-relay', isRelaying)
    }

    // For the probe: how far the truck turned at the stop it just left.
    const dwell = frame && !frame.done ? frame.dwell : -1
    if (script && dwell !== standing.current.dwell) {
      const left = standing.current
      if (left.dwell >= 0 && dwell === -1) {
        const { stop } = script.dwells[left.dwell]
        const place =
          stop.kind !== 'refill' ? stop.kind : stop.site === DEPOT_SITE ? 'depot' : 'hydrant'
        const turn = Math.abs(
          Math.atan2(
            Math.sin(stageRef.current.truck.heading - left.heading),
            Math.cos(stageRef.current.truck.heading - left.heading),
          ),
        )
        canvas
          .closest('[data-day-stage]')
          ?.setAttribute(
            'data-day-turn',
            `${left.dwell}:${place}:${Math.round((turn * 180) / Math.PI)}`,
          )
      }
      standing.current = { dwell, heading: stageRef.current.truck.heading }
    }

    if (script && frame) {
      const hold = isStatic || frame.done ? null : holdAt(script, state.elapsed)
      if (tankRef.current && state.running) {
        tankRef.current.style.setProperty('--day-tank', (frame.tank / script.capacity).toFixed(3))
        tankRef.current.style.setProperty('--day-hold', (hold?.left ?? 1).toFixed(3))
      }
      if ((hold?.kind ?? null) !== holding.current) {
        holding.current = hold?.kind ?? null
        events.onHold(holding.current)
        // For the probe: the map's hold has no camera of its own to tell it by.
        canvas.closest('[data-day-stage]')?.setAttribute('data-day-hold', holding.current ?? '')
      }
      const last = reported.current
      const routed = frame.reveal > 0
      if (
        frame.served !== last.served ||
        frame.dwell !== last.dwell ||
        frame.done !== last.done ||
        routed !== last.routed
      ) {
        reported.current = { served: frame.served, dwell: frame.dwell, done: frame.done, routed }
        events.onProgress(reported.current)
      }
      if (frame.done && state.running) {
        state.running = false
        awakeUntil.current = performance.now() + AMBIENT_MS
      }
    } else {
      reported.current = UNREPORTED
      if (holding.current !== null) {
        holding.current = null
        events.onHold(null)
        canvas.closest('[data-day-stage]')?.setAttribute('data-day-hold', '')
      }
    }

    if (!ready.current) {
      ready.current = true
      events.onReady()
    }

    // The canvas draws on demand, so every frame has to ask for the next one.
    if (!isStatic && (state.running || performance.now() < awakeUntil.current)) invalidate()
  })

  return null
}

interface RigProps {
  isStatic: boolean
  live: RefObject<DayLive>
  stageRef: RefObject<Stage>
}

interface RigState {
  settled: boolean
  at: [number, number, number]
  velocity: [number, number, number]
  /** Zoom is a ratio, so the spring works on its logarithm. */
  zoom: number
  zoomVelocity: number
}

function Rig({ isStatic, live, stageRef }: RigProps) {
  const rig = useRef<RigState>({
    settled: false,
    at: [0, 0, 0],
    velocity: [0, 0, 0],
    zoom: 0,
    zoomVelocity: 0,
  })
  // The picture for the map's card, as framed for the stage's shape, its card and its bar.
  const framedMap = useRef<{ key: string; shot: Shot } | null>(null)

  useFrame(({ camera, size, gl }, delta) => {
    const state = rig.current
    const stage = stageRef.current
    let map = OVERVIEW
    if (!isStatic && stage.frame?.shot === 'map') {
      // Measured every frame: the card's height follows the text it holds.
      const card = cardCover(gl.domElement)
      const bar = barCover(gl.domElement)
      const key = `${size.width}x${size.height}:${card?.right}:${card?.top}:${bar}`
      if (framedMap.current?.key !== key) {
        framedMap.current = { key, shot: mapShot(size, card, bar) }
      }
      map = framedMap.current.shot
    }
    // Reduced motion keeps the whole town in the picture: no camera travel.
    const shot = isStatic ? OVERVIEW : shotFor(live.current, stage, map)

    if (isStatic || !state.settled) {
      state.at = [shot.at[0], shot.at[1], shot.at[2]]
      state.velocity = [0, 0, 0]
      state.zoom = Math.log(shot.zoom)
      state.zoomVelocity = 0
      state.settled = true
    } else {
      const step = Math.min(delta, MAX_FRAME_SECONDS)
      for (let axis = 0; axis < 3; axis++) {
        ;[state.at[axis], state.velocity[axis]] = smoothDamp(
          state.at[axis],
          state.velocity[axis],
          shot.at[axis],
          SMOOTH_TIME,
          step,
        )
      }
      ;[state.zoom, state.zoomVelocity] = smoothDamp(
        state.zoom,
        state.zoomVelocity,
        Math.log(shot.zoom),
        SMOOTH_TIME,
        step,
      )
    }

    const [x, y, z] = state.at
    const zoom = townFit(size) * Math.exp(state.zoom)
    camera.position.set(x + CAMERA_DISTANCE, y + CAMERA_DISTANCE, z + CAMERA_DISTANCE)
    camera.lookAt(x, y, z)
    stage.iso.at = [x, y, z]
    stage.iso.height = size.height / zoom
    // Pin heads grow with this camera's zoom. Away from the slanted view the
    // picture comes from another camera, so there they keep their own size; the
    // flights blend over, so the heads do not jump at the switch.
    camera.zoom = geometric(
      zoom,
      Math.max(UNSCALED_PIN_ZOOM, zoom),
      isStatic ? 0 : showpieceWeight(stage.view),
    )
    camera.updateProjectionMatrix()
    // The labels project through this camera later in the same frame.
    camera.updateMatrixWorld()
  })

  return null
}

function Town() {
  return (
    <>
      <mesh geometry={groundGeometry}>
        <meshLambertMaterial color={tourColors.ground} />
      </mesh>
      <mesh geometry={shadowGeometry}>
        <meshBasicMaterial color={tourColors.shadow} transparent opacity={0.1} depthWrite={false} />
      </mesh>
      <mesh geometry={townGeometry}>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>
    </>
  )
}

function WateringDayScene3D({ isStatic, isActive, isReady, live, events, labels, tank }: Props) {
  const stage = useRef<Stage>({
    frame: null,
    truck: PARKED,
    view: ISO_VIEW,
    iso: { at: [0, 0, 0], height: 1 },
    lens: null,
  })

  // Same light as the other two towns: ambient and key together come to a
  // little over pi on the lit faces, so the pale walls stay pale.
  return (
    <Canvas
      flat
      orthographic
      dpr={MAX_DPR}
      // It draws off screen until its first frame is done: a tour planned from
      // below the stage needs a ready scene to be played.
      frameloop={isActive || !isReady ? 'demand' : 'never'}
      camera={{
        position: [CAMERA_DISTANCE, CAMERA_DISTANCE, CAMERA_DISTANCE],
        near: 1,
        far: 3000,
        zoom: 1,
      }}
      gl={{ antialias: true, alpha: true }}
      className="h-full w-full"
      onPointerMissed={() => events.onSelect(null)}
    >
      <ReleaseContextOnNavigate />
      <DayClock
        isStatic={isStatic}
        liveRef={live}
        stageRef={stage}
        events={events}
        tankRef={tank}
      />
      <Rig isStatic={isStatic} live={live} stageRef={stage} />
      <ambientLight intensity={2.2} />
      <directionalLight position={[-30, 60, 80]} intensity={1.35} />
      <Town />
      <RouteRibbon live={live} stage={stage} isStatic={isStatic} />
      <Truck live={live} stage={stage} isStatic={isStatic} />
      <WaterJet live={live} stage={stage} isStatic={isStatic} />
      <RefillPulse live={live} stage={stage} isStatic={isStatic} />
      <RefillHose live={live} stage={stage} isStatic={isStatic} />
      <ProbeRings live={live} stage={stage} isStatic={isStatic} />
      <GatewayRings live={live} stage={stage} isStatic={isStatic} />
      <RelayMessage live={live} stage={stage} isStatic={isStatic} />
      <Crowns live={live} isStatic={isStatic} />
      <TreePins live={live} stage={stage} isStatic={isStatic} />
      <HitAreas live={live} events={events} />
      <Labels live={live} stage={stage} nodes={labels} />
      <ShowpieceCamera live={live} stageRef={stage} />
    </Canvas>
  )
}

export default WateringDayScene3D
