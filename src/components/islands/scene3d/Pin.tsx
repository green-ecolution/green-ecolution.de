import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { BackSide, Color, type Group, type MeshBasicMaterial } from 'three'
import { pinColors, type PinTone } from '../../../data/storyTown'
import { tourColors } from '../../../data/streamletTour'
import type { GroundPoint } from '../../../lib/storyPath'
import { damp } from './damp'
import { PIN_HULL, PIN_POST, PIN_RADIUS, pinHeadScale } from './pinSize'

const pinTints: Record<PinTone, Color> = {
  ok: new Color(pinColors.ok),
  warn: new Color(pinColors.warn),
  alert: new Color(pinColors.alert),
  info: new Color(pinColors.info),
}

export interface PinLook {
  tone: PinTone
  shown: boolean
  /** Only a pin in alarm pulses. */
  alarm: boolean
}

interface PinProps {
  at: GroundPoint
  /** Height of the middle of the pin's head. */
  height: number
  /** Asked every frame, so it may read whatever state the scene keeps. */
  look: () => PinLook
  isStatic: boolean
}

export function Pin({ at, height, look, isStatic }: PinProps) {
  const group = useRef<Group>(null)
  const headGroup = useRef<Group>(null)
  const head = useRef<MeshBasicMaterial>(null)
  const size = useRef(0)

  useFrame(({ camera, clock }, delta) => {
    const { tone, shown, alarm } = look()
    const goal = shown ? 1 : 0
    const fresh = size.current < 0.05
    size.current = isStatic ? goal : damp(size.current, goal, 12, delta)

    if (head.current) {
      // A pin coming up starts in its colour; a standing one changes over.
      if (fresh || isStatic) head.current.color.copy(pinTints[tone])
      else head.current.color.lerp(pinTints[tone], 1 - Math.exp(-delta * 8))
    }
    headGroup.current?.scale.setScalar(pinHeadScale(camera.zoom))
    if (!group.current) return
    const pulse = !alarm || isStatic ? 1 : 1 + Math.sin(clock.getElapsedTime() * 4) * 0.08
    group.current.visible = size.current > 0.01
    group.current.scale.setScalar(size.current * pulse)
  })

  return (
    <group ref={group} position={[at[0], height, at[1]]} visible={false}>
      <mesh position={[0, -PIN_POST / 2, 0]}>
        <cylinderGeometry args={[0.07, 0.07, PIN_POST, 6]} />
        <meshBasicMaterial color={tourColors.vehicleBody} />
      </mesh>
      <group ref={headGroup}>
        <mesh scale={PIN_HULL}>
          <sphereGeometry args={[PIN_RADIUS, 20, 14]} />
          <meshBasicMaterial color="#FFFFFF" side={BackSide} />
        </mesh>
        <mesh>
          <sphereGeometry args={[PIN_RADIUS, 20, 14]} />
          <meshBasicMaterial ref={head} color={pinColors.ok} />
        </mesh>
      </group>
    </group>
  )
}
