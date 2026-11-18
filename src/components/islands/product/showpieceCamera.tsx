import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import type { Fog, PerspectiveCamera } from 'three'
import { roadHeight } from '../../../data/streamletTour'
import { blendPoses, geometric, matchedPose, type CameraPose } from '../../../lib/cameraPose'
import type { TourScript, TourView } from '../../../lib/wateringDay'
import { cardCover } from './covers'
import type { DayLive } from './shared'
import { glide, showpieceWeight, turned, type Stage, type TruckPose } from './stage'
import {
  framedView,
  gatewayView,
  homeStop,
  probeView,
  refillStop,
  refillView,
  resultView,
  showpieceStop,
  wateringView,
  type CloseView,
} from './closeView'

// The stage's background (green-light-100 at 60 % over white), so the far end
// of the town fades into the page.
const HAZE = '#F7F8EF'
const RIDE_HAZE = { near: 28, far: 120 } as const
// Beyond anything the slanted camera or its far, narrow stand-in sees; blended
// by ratio, the haze stays behind the town all through a flight.
const NO_HAZE = { near: 1e5, far: 2e5 } as const
// Over the back of the cab, ahead of the monitor on the tank, so only the cab
// roof shows at the bottom.
const SEAT = { up: 5.45, forward: 2 } as const
const AHEAD = { up: 4, forward: 14 } as const
const SEAT_FOV = 52
/**
 * Far away and this narrow, a perspective camera draws what the slanted
 * orthographic one draws, so the flights can start and end on it unseen.
 */
const MATCHED_FOV = 0.1
const ISO_DIRECTION = [1, 1, 1] as const
const NO_SHIFT = [0, 0] as const

// The view swings into a corner after the truck, not with it.
const TURN_RATE = 5

interface Props {
  live: RefObject<DayLive>
  stageRef: RefObject<Stage>
}

function seatPose(truck: TruckPose, heading: number): CameraPose {
  const sin = Math.sin(heading)
  const cos = Math.cos(heading)
  return {
    position: [
      truck.at[0] + sin * SEAT.forward,
      roadHeight + SEAT.up,
      truck.at[1] + cos * SEAT.forward,
    ],
    target: [
      truck.at[0] + sin * AHEAD.forward,
      roadHeight + AHEAD.up,
      truck.at[1] + cos * AHEAD.forward,
    ],
    fov: SEAT_FOV,
  }
}

interface CloseViews {
  script: TourScript | null
  /** Without a ride the fly-in goes straight to the watering view. */
  isRidden: boolean
  probe: CloseView | null
  gateway: CloseView | null
  watering: CloseView | null
  refill: CloseView | null
  result: CloseView | null
}

function poseFor(view: TourView, slanted: CameraPose, seat: CameraPose, close: CloseViews) {
  const share = glide(view.share)
  if (view.piece === null) return slanted
  // Every close-up but the watering is a plain one: down, a slow creep, back up.
  if (view.piece !== 'watering') {
    const held = close[view.piece] ?? { from: slanted, to: slanted }
    // The gateway is reached from the probe, with the message, not from above.
    if (view.mode === 'toGateway') return blendPoses(close.probe?.to ?? slanted, held.from, share)
    if (view.mode === 'flyIn') return blendPoses(slanted, held.from, share)
    if (view.mode === 'flyOut') return blendPoses(held.to, slanted, share)
    return blendPoses(held.from, held.to, share)
  }
  const ground = close.watering ?? { from: seat, to: seat }
  switch (view.mode) {
    case 'flyIn':
      return blendPoses(slanted, close.isRidden ? seat : ground.from, share)
    case 'ride':
      return seat
    case 'toWatering':
      return blendPoses(seat, ground.from, share)
    case 'watering':
      return blendPoses(ground.from, ground.to, share)
    default:
      return blendPoses(ground.to, slanted, share)
  }
}

/**
 * Draws the scene, through the slanted camera or, for the close-ups, through a
 * perspective one: down to the probe before the tour and over to the gateway
 * with its message; down to the truck, along
 * for the ride, onto the watering and back up; down to the hydrant while the
 * tank fills; and down to the depot for the day's result.
 */
export function ShowpieceCamera({ live, stageRef }: Props) {
  const lens = useRef<PerspectiveCamera>(null)
  const haze = useRef<Fog>(null)
  const heading = useRef(0)
  const wasAway = useRef(false)
  const close = useRef<CloseViews>({
    script: null,
    isRidden: true,
    probe: null,
    gateway: null,
    watering: null,
    refill: null,
    result: null,
  })
  // The close-ups as framed for the stage's shape and its card.
  const framed = useRef<{ key: string; source: CloseViews; views: CloseViews } | null>(null)

  // A positive priority takes the drawing over from fiber: this is the only
  // render call of the scene, and it runs after every other part has updated.
  useFrame(({ gl, scene, camera, size }, delta) => {
    const stage = stageRef.current
    const { truck, view, iso } = stage
    const lensCamera = lens.current
    const fog = haze.current
    const { script } = live.current

    if (view.mode === 'iso' || !lensCamera || !fog || !script) {
      wasAway.current = false
      stage.lens = null
      if (fog) {
        fog.near = NO_HAZE.near
        fog.far = NO_HAZE.far
      }
      gl.render(scene, camera)
      return
    }

    heading.current = wasAway.current
      ? turned(heading.current, truck.heading, 1 - Math.exp(-TURN_RATE * delta))
      : truck.heading
    wasAway.current = true

    if (close.current.script !== script) {
      const ridden = showpieceStop(script)
      const refilled = refillStop(script)
      const home = homeStop(script)
      close.current = {
        script,
        isRidden: script.showpiece?.ride !== null,
        probe:
          ridden && script.probeShot ? probeView(ridden.truck, ridden.heading, ridden.tree) : null,
        gateway: script.gatewayShot ? gatewayView() : null,
        watering: ridden ? wateringView(ridden.truck, ridden.heading, ridden.tree) : null,
        refill: refilled ? refillView(refilled.truck, refilled.heading) : null,
        result: resultView(home.truck, home.heading),
      }
    }

    const slanted = matchedPose(iso.at, ISO_DIRECTION, iso.height, MATCHED_FOV)
    const aspect = size.width / size.height
    // Measured every frame: the card takes the text of the coming close-up
    // just after the flight begins, and its height follows that text.
    const card = cardCover(gl.domElement)
    const key = `${size.width}x${size.height}:${card?.right}:${card?.top}`
    if (framed.current?.key !== key || framed.current.source !== close.current) {
      const source = close.current
      framed.current = {
        key,
        source,
        views: {
          ...source,
          probe: source.probe && framedView(source.probe, aspect, card),
          gateway: source.gateway && framedView(source.gateway, aspect, card),
          watering: source.watering && framedView(source.watering, aspect, card),
          refill: source.refill && framedView(source.refill, aspect, card),
          result: source.result && framedView(source.result, aspect, card),
        },
      }
    }
    const views = framed.current?.views ?? close.current
    const pose = poseFor(view, slanted, seatPose(truck, heading.current), views)

    const [x, y, z] = pose.position
    const [tx, ty, tz] = pose.target
    const distance = Math.hypot(x - tx, y - ty, z - tz)
    lensCamera.position.set(x, y, z)
    stage.lens = [x, y, z]
    lensCamera.lookAt(tx, ty, tz)
    lensCamera.fov = pose.fov
    lensCamera.aspect = aspect
    // Tight around the town at every distance, so depth stays precise.
    lensCamera.near = Math.max(0.5, distance - 160)
    lensCamera.far = distance + 400
    lensCamera.updateProjectionMatrix()
    // An off-centre frustum: the picture moves, the camera does not turn.
    const [shiftX, shiftY] = pose.shift ?? NO_SHIFT
    lensCamera.projectionMatrix.elements[8] = shiftX
    lensCamera.projectionMatrix.elements[9] = shiftY
    lensCamera.projectionMatrixInverse.copy(lensCamera.projectionMatrix).invert()

    const weight = showpieceWeight(view)
    fog.near = geometric(NO_HAZE.near, RIDE_HAZE.near, weight)
    fog.far = geometric(NO_HAZE.far, RIDE_HAZE.far, weight)
    gl.render(scene, lensCamera)
  }, 1)

  return (
    <>
      <perspectiveCamera ref={lens} args={[SEAT_FOV, 1, 0.5, 400]} />
      <fog ref={haze} attach="fog" args={[HAZE, NO_HAZE.near, NO_HAZE.far]} />
    </>
  )
}
