import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import { Vector3, type Fog, type PerspectiveCamera } from 'three'
import { roadHeight } from '../../../data/streamletTour'
import { turned, type Stage } from './stage'

// The stage's background (green-light-100 at 60 % over white), so the far end
// of the town fades into the page.
const HAZE = '#F7F8EF'
const RIDE_HAZE = { near: 28, far: 120 } as const
// Far beyond anything the slanted camera sees, which stands 1000 units away.
const NO_HAZE = { near: 1e5, far: 2e5 } as const
// Over the back of the cab, ahead of the monitor on the tank, so only the cab
// roof shows at the bottom.
const SEAT = { up: 5.45, forward: 2 } as const
const AHEAD = { up: 4, forward: 14 } as const
// The view swings into a corner after the truck, not with it.
const TURN_RATE = 5
/** How dark the picture gets at the cut. */
const DIM = 0.9

const target = new Vector3()

interface Props {
  stage: RefObject<Stage>
  isStatic: boolean
}

export function RideCamera({ stage, isStatic }: Props) {
  const ride = useRef<PerspectiveCamera>(null)
  const haze = useRef<Fog>(null)
  const heading = useRef(0)
  const wasRiding = useRef(false)

  // A positive priority takes the drawing over from fiber: this is the only
  // render call of the scene, and it runs after every other part has updated.
  useFrame(({ gl, scene, camera, size }, delta) => {
    const { frame, truck, riding } = stage.current
    const view = ride.current
    const fog = haze.current
    gl.domElement.style.opacity = String(1 - DIM * (isStatic ? 0 : (frame?.cut ?? 0)))

    if (!riding || !view || !fog) {
      wasRiding.current = false
      if (fog) {
        fog.near = NO_HAZE.near
        fog.far = NO_HAZE.far
      }
      gl.render(scene, camera)
      return
    }

    heading.current = wasRiding.current
      ? turned(heading.current, truck.heading, 1 - Math.exp(-TURN_RATE * delta))
      : truck.heading
    wasRiding.current = true

    const sin = Math.sin(heading.current)
    const cos = Math.cos(heading.current)
    view.position.set(
      truck.at[0] + sin * SEAT.forward,
      roadHeight + SEAT.up,
      truck.at[1] + cos * SEAT.forward,
    )
    target.set(
      truck.at[0] + sin * AHEAD.forward,
      roadHeight + AHEAD.up,
      truck.at[1] + cos * AHEAD.forward,
    )
    view.lookAt(target)
    view.aspect = size.width / size.height
    view.updateProjectionMatrix()

    fog.near = RIDE_HAZE.near
    fog.far = RIDE_HAZE.far
    gl.render(scene, view)
  }, 1)

  return (
    <>
      <perspectiveCamera ref={ride} args={[52, 1, 0.5, 400]} />
      <fog ref={haze} attach="fog" args={[HAZE, NO_HAZE.near, NO_HAZE.far]} />
    </>
  )
}
