import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, type RefObject } from 'react'
import { Vector3 } from 'three'
import { plate, shots } from '../../../data/storyTown'
import { tourColors } from '../../../data/streamletTour'
import { storyState, storyStill, type StoryState } from '../../../lib/storyTimeline'
import ReleaseContextOnNavigate from '../scene3d/ReleaseContextOnNavigate'
import type { Story, StorySource } from './shared'
import { groundGeometry, shadowGeometry, townGeometry } from './town'

interface Props {
  isStatic: boolean
  isActive: boolean
  source: RefObject<StorySource>
  onReady: () => void
}

const CAMERA_DISTANCE = 600
const SIDE = plate.half * 2
// What the plate measures on screen under a camera at [d, d, d], with room
// for the roofs at the back and a little air at the sides.
const TOWN_WIDTH = SIDE * Math.SQRT2 + 4
const TOWN_HEIGHT = (SIDE * 2) / Math.sqrt(6) + 12
// How quickly the scene catches up with the scroll position.
const FOLLOW = 7

interface ClockProps {
  isStatic: boolean
  sourceRef: RefObject<StorySource>
  storyRef: Story
  onReady: () => void
}

// Mounted first, so every other part reads the state of the same frame.
function StoryClock({ isStatic, sourceRef, storyRef, onReady }: ClockProps) {
  const current = useRef(0)
  const ready = useRef(false)
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    const live = sourceRef.current
    current.current = live.target
    live.onChange = () => invalidate()
    return () => {
      live.onChange = null
    }
  }, [sourceRef, invalidate])

  useFrame((_, delta) => {
    const { target, still } = sourceRef.current

    if (still !== null) {
      storyRef.current = storyStill(still)
    } else {
      const gap = target - current.current
      current.current =
        isStatic || Math.abs(gap) < 0.0005
          ? target
          : current.current + gap * (1 - Math.exp(-delta * FOLLOW))
      storyRef.current = storyState(current.current)
    }

    if (!ready.current) {
      ready.current = true
      onReady()
    }
  })

  return null
}

const lookAt = new Vector3()

function Rig({ story }: { story: Story }) {
  useFrame(({ camera, size }) => {
    const { from, to, blend } = story.current.camera
    const start = shots[from]
    const end = shots[to]
    const fit = Math.min(size.width / TOWN_WIDTH, size.height / TOWN_HEIGHT)

    lookAt.set(
      start.at[0] + (end.at[0] - start.at[0]) * blend,
      start.at[1] + (end.at[1] - start.at[1]) * blend,
      start.at[2] + (end.at[2] - start.at[2]) * blend,
    )
    camera.position.set(
      lookAt.x + CAMERA_DISTANCE,
      lookAt.y + CAMERA_DISTANCE,
      lookAt.z + CAMERA_DISTANCE,
    )
    camera.lookAt(lookAt)
    // Zoom is a ratio, so it blends as one.
    camera.zoom = fit * start.zoom * (end.zoom / start.zoom) ** blend
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

function StoryScene3D({ isStatic, isActive, source, onReady }: Props) {
  const story = useRef<StoryState>(storyState(0))
  const frameloop = !isActive ? 'never' : isStatic ? 'demand' : 'always'

  // Same light as the tour scene: ambient and key together come to a little
  // over pi on the lit faces, so the pale walls stay pale without clipping.
  return (
    <Canvas
      flat
      orthographic
      dpr={[1, 2]}
      frameloop={frameloop}
      camera={{
        position: [CAMERA_DISTANCE, CAMERA_DISTANCE, CAMERA_DISTANCE],
        near: 1,
        far: 3000,
        zoom: 1,
      }}
      gl={{ antialias: true, alpha: true }}
      className="h-full w-full"
    >
      <ReleaseContextOnNavigate />
      <StoryClock isStatic={isStatic} sourceRef={source} storyRef={story} onReady={onReady} />
      <Rig story={story} />
      <ambientLight intensity={2.2} />
      <directionalLight position={[-30, 60, 80]} intensity={1.35} />
      <Town />
    </Canvas>
  )
}

export default StoryScene3D
