import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, type RefObject } from 'react'
import { Vector3 } from 'three'
import { plate } from '../../../data/productTown'
import { tourColors } from '../../../data/streamletTour'
import { AMBIENT_MS, MAX_DPR } from '../../../lib/sceneBudget'
import { tourFrame } from '../../../lib/wateringDay'
import ReleaseContextOnNavigate from '../scene3d/ReleaseContextOnNavigate'
import { Crowns, HitAreas, Labels, TreePins } from './actors'
import type { DayEvents, DayLive, TourProgress } from './shared'
import { OVERVIEW, PARKED, shotFor, truckPose, type Stage } from './stage'
import { RefillPulse, RouteRibbon, Truck, WaterJet } from './tourActors'
import { groundGeometry, shadowGeometry, townGeometry } from './town'

interface Props {
  isStatic: boolean
  isActive: boolean
  live: RefObject<DayLive>
  events: DayEvents
  labels: RefObject<(HTMLElement | null)[]>
  tank: RefObject<HTMLDivElement | null>
}

const CAMERA_DISTANCE = 600
const SPAN = plate.width + plate.depth
// What the plate measures on screen under a camera at [d, d, d], with room for
// the roofs at the back and a little air at the sides.
const TOWN_WIDTH = SPAN / Math.SQRT2 + 4
const TOWN_HEIGHT = SPAN / Math.sqrt(6) + 12
const CAMERA_RATE = 3.2
// A frame after a pause must not jump the tour or the camera ahead.
const MAX_FRAME_SECONDS = 0.05
const UNREPORTED: TourProgress = { served: -1, dwell: -2, done: false }

interface ClockProps {
  isStatic: boolean
  liveRef: RefObject<DayLive>
  stageRef: RefObject<Stage>
  events: DayEvents
  tankRef: RefObject<HTMLDivElement | null>
}

// Mounted first, so every other part reads the state of the same frame.
function DayClock({ isStatic, liveRef, stageRef, events, tankRef }: ClockProps) {
  const invalidate = useThree((state) => state.invalidate)
  const awakeUntil = useRef(0)
  const reported = useRef(UNREPORTED)
  const ready = useRef(false)

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
      state.elapsed = Math.min(script.duration, state.elapsed + Math.min(delta, MAX_FRAME_SECONDS))
    }

    const frame = script ? tourFrame(script, state.elapsed) : null
    stageRef.current.frame = frame
    stageRef.current.truck = truckPose(script, frame)
    stageRef.current.riding = !isStatic && frame?.shot === 'pov'

    if (script && frame) {
      if (tankRef.current && state.running) {
        tankRef.current.style.transform = `scaleX(${(frame.tank / script.capacity).toFixed(3)})`
      }
      const last = reported.current
      if (frame.served !== last.served || frame.dwell !== last.dwell || frame.done !== last.done) {
        reported.current = { served: frame.served, dwell: frame.dwell, done: frame.done }
        events.onProgress(reported.current)
      }
      if (frame.done && state.running) {
        state.running = false
        awakeUntil.current = performance.now() + AMBIENT_MS
      }
    } else {
      reported.current = UNREPORTED
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
  stage: RefObject<Stage>
}

// There is one such scene on a page, so the rig's vectors can live out here.
const lookAt = new Vector3()
const goal = new Vector3()

function Rig({ isStatic, live, stage }: RigProps) {
  const zoom = useRef(1)
  const settled = useRef(false)

  useFrame(({ camera, size }, delta) => {
    // Reduced motion keeps the whole town in the picture: no camera travel.
    const shot = isStatic ? OVERVIEW : shotFor(live.current, stage.current)
    goal.set(shot.at[0], shot.at[1], shot.at[2])

    if (isStatic || !settled.current) {
      lookAt.copy(goal)
      zoom.current = shot.zoom
      settled.current = true
    } else {
      const share = 1 - Math.exp(-CAMERA_RATE * Math.min(delta, MAX_FRAME_SECONDS))
      lookAt.lerp(goal, share)
      // Zoom is a ratio, so it closes in by a ratio as well.
      zoom.current *= (shot.zoom / zoom.current) ** share
    }

    const fit = Math.min(size.width / TOWN_WIDTH, size.height / TOWN_HEIGHT)
    camera.position.set(
      lookAt.x + CAMERA_DISTANCE,
      lookAt.y + CAMERA_DISTANCE,
      lookAt.z + CAMERA_DISTANCE,
    )
    camera.lookAt(lookAt)
    camera.zoom = fit * zoom.current
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

function WateringDayScene3D({ isStatic, isActive, live, events, labels, tank }: Props) {
  const stage = useRef<Stage>({ frame: null, truck: PARKED, riding: false })

  // Same light as the other two towns: ambient and key together come to a
  // little over pi on the lit faces, so the pale walls stay pale.
  return (
    <Canvas
      flat
      orthographic
      dpr={MAX_DPR}
      frameloop={isActive ? 'demand' : 'never'}
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
      <Rig isStatic={isStatic} live={live} stage={stage} />
      <ambientLight intensity={2.2} />
      <directionalLight position={[-30, 60, 80]} intensity={1.35} />
      <Town />
      <RouteRibbon live={live} stage={stage} isStatic={isStatic} />
      <Truck live={live} stage={stage} isStatic={isStatic} />
      <WaterJet live={live} stage={stage} isStatic={isStatic} />
      <RefillPulse live={live} stage={stage} isStatic={isStatic} />
      <Crowns live={live} isStatic={isStatic} />
      <TreePins live={live} isStatic={isStatic} />
      <HitAreas live={live} events={events} />
      <Labels live={live} stage={stage} nodes={labels} />
    </Canvas>
  )
}

export default WateringDayScene3D
