import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import { Color, MeshLambertMaterial, Vector3, type Group } from 'three'
import { depot, hydrant, townTrees } from '../../../data/productTown'
import type { PinTone } from '../../../data/storyTown'
import {
  canopyCenterHeight,
  depotHeight,
  depotRoofHeight,
  tourColors,
} from '../../../data/streamletTour'
import { moisture, thirst, type Thirst } from '../../../lib/dryness'
import { damp } from '../scene3d/damp'
import { Pin } from '../scene3d/Pin'
import { PIN_HULL, PIN_RADIUS, pinHeadScale, pinHeight } from '../scene3d/pinSize'
import { unitLobe } from '../scene3d/primitives'
import { lobes } from '../scene3d/trees'
import type { DayEvents, DayLive } from './shared'
import type { Stage } from './stage'

interface LiveProps {
  live: RefObject<DayLive>
  isStatic: boolean
}

const dryBody = new Color('#C9B86A')
const dryLit = new Color('#D8C97F')
const fresh = {
  body: new Color(tourColors.treeCanopy),
  lit: new Color(tourColors.treeCanopyLit),
}
const freshDark = {
  body: new Color(tourColors.treeCanopyDeep),
  lit: new Color(tourColors.treeCanopyDark),
}

// One pair per tree, kept outside react: the frame loop tints them.
const materials = townTrees.map(() => ({
  body: new MeshLambertMaterial({ flatShading: true }),
  lit: new MeshLambertMaterial({ flatShading: true }),
}))

/** The crowns of the twelve sensor trees: matt and a little smaller the drier the tree. */
export function Crowns({ live, isStatic }: LiveProps) {
  const crowns = useRef<(Group | null)[]>([])
  const health = useRef<number[] | null>(null)

  useFrame(({ clock }, delta) => {
    const { days, watered } = live.current
    const goals = townTrees.map((tree, index) => (watered[index] ? 1 : moisture(tree.rate, days)))
    // The first frame shows the trees as they are instead of drying them out.
    health.current ??= goals

    townTrees.forEach((tree, index) => {
      const level = isStatic
        ? goals[index]
        : damp(health.current?.[index] ?? goals[index], goals[index], 4, delta)
      if (health.current) health.current[index] = level

      const tone = tree.dark ? freshDark : fresh
      materials[index].body.color.lerpColors(dryBody, tone.body, level)
      materials[index].lit.color.lerpColors(dryLit, tone.lit, level)

      const crown = crowns.current[index]
      if (!crown) return
      crown.scale.setScalar(0.88 + 0.12 * level)
      crown.position.y = canopyCenterHeight(tree) - (1 - level) * 0.35
      crown.rotation.z = isStatic ? 0 : Math.sin(clock.getElapsedTime() * 0.9 + index) * 0.025
    })
  })

  return (
    <>
      {townTrees.map((tree, index) => (
        <group
          key={tree.id}
          ref={(node) => {
            crowns.current[index] = node
          }}
          position={[tree.at[0], canopyCenterHeight(tree), tree.at[1]]}
        >
          {lobes.map((lobe, lobeIndex) => (
            <mesh
              key={lobe.radius}
              geometry={unitLobe}
              position={[
                lobe.at[0] * tree.canopyRadius * (index % 2 === 0 ? 1 : -1),
                lobe.at[1] * tree.canopyRadius,
                lobe.at[2] * tree.canopyRadius,
              ]}
              scale={lobe.radius * tree.canopyRadius}
              material={lobeIndex === 0 ? materials[index].body : materials[index].lit}
            />
          ))}
        </group>
      ))}
    </>
  )
}

const pinTones: Record<Thirst, PinTone> = { dry: 'alert', soon: 'warn', ok: 'ok' }

/** How much the pin of a highlighted or selected tree grows. */
const PICKED_PIN = 1.25
// A close-up camera passing a pin would fill the picture with its head.
const NEAR_LENS = { hidden: 7, shown: 15 } as const

interface PinsProps extends LiveProps {
  stage: RefObject<Stage>
}

export function TreePins({ live, stage, isStatic }: PinsProps) {
  const pins = useRef<(Group | null)[]>([])
  const picked = useRef(townTrees.map(() => 1))

  useFrame((_, delta) => {
    const { highlighted, selected } = live.current
    const { lens } = stage.current
    pins.current.forEach((pin, index) => {
      if (!pin) return
      const goal = index === highlighted || index === selected ? PICKED_PIN : 1
      const size = isStatic ? goal : damp(picked.current[index], goal, 12, delta)
      picked.current[index] = size
      const away = lens
        ? Math.hypot(pin.position.x - lens[0], pin.position.y - lens[1], pin.position.z - lens[2])
        : Infinity
      const near = Math.min(
        1,
        Math.max(0, (away - NEAR_LENS.hidden) / (NEAR_LENS.shown - NEAR_LENS.hidden)),
      )
      pin.scale.setScalar(size * near * near * (3 - 2 * near))
      pin.visible = near > 0
    })
  })

  // Each pin hangs in a group at its head, so it grows about the head.
  return (
    <>
      {townTrees.map((tree, index) => (
        <group
          key={tree.id}
          ref={(node) => {
            pins.current[index] = node
          }}
          position={[tree.at[0], pinHeight(tree), tree.at[1]]}
        >
          <Pin
            at={[0, 0]}
            height={0}
            isStatic={isStatic}
            look={() => {
              const { days, watered } = live.current
              const state = watered[index] ? 'ok' : thirst(moisture(tree.rate, days))
              return { shown: true, tone: pinTones[state], alarm: state === 'dry' }
            }}
          />
        </group>
      ))}
    </>
  )
}

interface HitAreasProps {
  live: RefObject<DayLive>
  events: DayEvents
}

/** Invisible columns around the trees: a crown alone is a small target on a phone. */
export function HitAreas({ live, events }: HitAreasProps) {
  return (
    <>
      {townTrees.map((tree, index) => {
        const height = pinHeight(tree) + PIN_RADIUS * 2
        return (
          <mesh
            key={tree.id}
            position={[tree.at[0], height / 2, tree.at[1]]}
            onClick={(event) => {
              event.stopPropagation()
              events.onSelect(live.current.selected === index ? null : index)
            }}
            onPointerOver={(event) => {
              ;(event.nativeEvent.target as HTMLElement).style.cursor = 'pointer'
            }}
            onPointerOut={(event) => {
              ;(event.nativeEvent.target as HTMLElement).style.cursor = ''
            }}
          >
            <cylinderGeometry
              args={[tree.canopyRadius + 0.8, tree.canopyRadius + 0.8, height, 12]}
            />
            {/* Fiber does not hit-test what is not drawn, so it is drawn see-through. */}
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        )
      })}
    </>
  )
}

const LABEL_GAP = PIN_RADIUS + 0.5

// Where each html label stands: the trees in the order of townTrees, then the
// depot and the hydrant.
const labelAnchors: (readonly [number, number, number])[] = [
  ...townTrees.map((tree) => [tree.at[0], pinHeight(tree) + LABEL_GAP, tree.at[1]] as const),
  [depot.at[0], depotHeight + depotRoofHeight + 1.4, depot.at[1]],
  // At the foot of the standpipe, nearest the viewer.
  [hydrant.at[0] + 1, 0, hydrant.at[1] + 1],
]

// Above the hydrant its label would cover the pins of the trees behind it. It
// hangs below instead, pushed right, because the nearest pins lie to its left.
const HANGING_LABEL = townTrees.length + 1

function labelShown(state: DayLive, index: number): boolean {
  if (index >= townTrees.length) return true
  if (state.script) return state.order[index] > 0 && !state.watered[index]
  return state.selected === index || state.highlighted === index
}

const projected = new Vector3()

interface LabelsProps {
  live: RefObject<DayLive>
  stage: RefObject<Stage>
  nodes: RefObject<(HTMLElement | null)[]>
}

// The labels are html over the canvas; this keeps each above its anchor.
export function Labels({ live, stage, nodes }: LabelsProps) {
  useFrame(({ camera, size }) => {
    // A label over a pin clears the enlarged head by as much as the head grew.
    const lift = (pinHeadScale(camera.zoom) - 1) * PIN_RADIUS * PIN_HULL * camera.zoom
    // They stand over the slanted view only; another camera draws the showpiece.
    const isSlanted = stage.current.view.mode === 'iso'

    labelAnchors.forEach((anchor, index) => {
      const node = nodes.current[index]
      if (!node) return
      projected.set(anchor[0], anchor[1], anchor[2]).project(camera)
      const left = ((projected.x + 1) / 2) * size.width
      const top = ((1 - projected.y) / 2) * size.height - (index < townTrees.length ? lift : 0)
      const shift = index === HANGING_LABEL ? 'translate(-30%, 4px)' : 'translate(-50%, -100%)'
      node.style.transform = `translate(${left.toFixed(1)}px, ${top.toFixed(1)}px) ${shift}`
      node.dataset.shown = String(isSlanted && labelShown(live.current, index))
    })
  })

  return null
}
