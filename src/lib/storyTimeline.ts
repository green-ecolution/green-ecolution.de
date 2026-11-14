import { pinnedStep } from './pinnedSteps'

export const ACT_WEIGHTS: number[] = [1, 1, 1.5, 2.5]
export const EXAMPLES = ['bin', 'winter', 'rain'] as const
export type ExampleId = (typeof EXAMPLES)[number]
export type ShotId = 'tree' | 'town' | 'watering' | ExampleId

export interface CameraCut {
  from: ShotId
  to: ShotId
  blend: number
}

export interface ExampleState {
  signal: number
  alert: boolean
  resolved: boolean
}

export interface VehicleState {
  /** The tour of act three, or the index of the example it drives up to. */
  route: 'tour' | number
  at: number
  shown: number
}

export interface StoryState {
  act: number
  actProgress: number
  camera: CameraCut
  sensorDrop: number
  signal: number
  /** Share of the tree pins that are up; ours comes last. */
  pins: number
  alert: boolean
  route: number
  drive: number
  vehicle: VehicleState
  watering: number
  health: number
  activeExample: number | null
  examples: ExampleState[]
  invite: number
}

const TOTAL = ACT_WEIGHTS.reduce((sum, weight) => sum + weight, 0)
const FINALE_INTRO = 0.1
const EXAMPLE_SPAN = 0.27
const INVITE_FROM = FINALE_INTRO + EXAMPLES.length * EXAMPLE_SPAN
// Where a jump lands inside an act: late enough to show what the act is about.
const ACT_LANDING = 0.6
const STILL_FILLS = [0.9, 0.95, 0.999]

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const span = (value: number, from: number, to: number) => clamp01((value - from) / (to - from))
const ease = (t: number) => t * t * (3 - 2 * t)
const hold = (shot: ShotId): CameraCut => ({ from: shot, to: shot, blend: 1 })

const IDLE: ExampleState = { signal: 0, alert: false, resolved: false }
const DONE: ExampleState = { signal: 0, alert: false, resolved: true }
const PARKED: VehicleState = { route: 'tour', at: 0, shown: 0 }

export function progressAt(act: number, fill: number): number {
  const before = ACT_WEIGHTS.slice(0, act).reduce((sum, weight) => sum + weight, 0)
  return (before + clamp01(fill) * ACT_WEIGHTS[act]) / TOTAL
}

export function progressForAct(index: number): number {
  // The finale opens on its title over the finished third act, before the
  // watering truck starts to shrink away at 0.02.
  return progressAt(index, index === ACT_WEIGHTS.length - 1 ? 0.01 : ACT_LANDING)
}

export function progressForExample(index: number): number {
  return progressAt(3, FINALE_INTRO + (index + ACT_LANDING) * EXAMPLE_SPAN)
}

export function pinsShown(reveal: number, count: number): number {
  return Math.min(count, Math.floor(clamp01(reveal) * count + 1e-9))
}

function exampleState(local: number): ExampleState {
  const resolved = local >= 0.85
  return {
    signal: resolved ? 0 : span(local, 0.3, 0.45),
    alert: local >= 0.45 && !resolved,
    resolved,
  }
}

type Finale = Pick<StoryState, 'camera' | 'activeExample' | 'examples' | 'invite' | 'vehicle'>

function finale(p: number): Finale {
  const examples = EXAMPLES.map((_, index) => {
    const from = FINALE_INTRO + index * EXAMPLE_SPAN
    if (p < from) return IDLE
    if (p >= from + EXAMPLE_SPAN) return DONE
    return exampleState((p - from) / EXAMPLE_SPAN)
  })

  if (p < FINALE_INTRO) {
    return {
      camera: hold('watering'),
      activeExample: null,
      examples,
      invite: 0,
      vehicle: { route: 'tour', at: 1, shown: 1 - span(p, 0.02, 0.08) },
    }
  }

  if (p >= INVITE_FROM) {
    return {
      camera: { from: 'rain', to: 'town', blend: ease(span(p, INVITE_FROM, 0.98)) },
      activeExample: null,
      examples,
      invite: span(p, 0.94, 1),
      vehicle: { route: EXAMPLES.length - 1, at: 1, shown: 0 },
    }
  }

  const index = Math.min(EXAMPLES.length - 1, Math.floor((p - FINALE_INTRO) / EXAMPLE_SPAN))
  const local = (p - FINALE_INTRO - index * EXAMPLE_SPAN) / EXAMPLE_SPAN
  return {
    camera: {
      from: index === 0 ? 'watering' : EXAMPLES[index - 1],
      to: EXAMPLES[index],
      blend: ease(span(local, 0, 0.3)),
    },
    activeExample: index,
    examples,
    invite: 0,
    vehicle: {
      route: index,
      at: span(local, 0.5, 0.85),
      // Pops in off screen and leaves before the camera moves on.
      shown: span(local, 0.46, 0.52) * (1 - span(local, 0.93, 1)),
    },
  }
}

export function storyState(progress: number): StoryState {
  const { index: act, fill: p } = pinnedStep(progress, ACT_WEIGHTS)
  const start: StoryState = {
    act,
    actProgress: p,
    camera: hold('tree'),
    sensorDrop: 0,
    signal: 0,
    pins: 0,
    alert: false,
    route: 0,
    drive: 0,
    vehicle: PARKED,
    watering: 0,
    health: 0,
    activeExample: null,
    examples: EXAMPLES.map(() => IDLE),
    invite: 0,
  }

  if (act === 0) {
    return { ...start, sensorDrop: span(p, 0.15, 0.55), signal: span(p, 0.55, 0.75) }
  }

  const measured = { ...start, sensorDrop: 1, signal: 1 }
  if (act === 1) {
    return {
      ...measured,
      camera: { from: 'tree', to: 'town', blend: ease(span(p, 0, 0.45)) },
      pins: span(p, 0.4, 0.85),
      alert: p >= 0.85,
    }
  }

  if (act === 2) {
    const drive = span(p, 0.18, 0.7)
    return {
      ...measured,
      camera:
        p < 0.55
          ? hold('town')
          : { from: 'town', to: 'watering', blend: ease(span(p, 0.55, 0.75)) },
      pins: 1,
      alert: p < 0.8,
      route: span(p, 0, 0.22),
      drive,
      vehicle: { route: 'tour', at: drive, shown: span(p, 0.16, 0.2) },
      watering: span(p, 0.7, 0.9),
      health: span(p, 0.78, 1),
    }
  }

  return { ...measured, pins: 1, route: 1, drive: 1, watering: 1, health: 1, ...finale(p) }
}

export function stillProgress(act: number): number {
  return act >= STILL_FILLS.length ? 1 : progressAt(act, STILL_FILLS[act])
}

/** The picture an act leaves behind; the finale shows all its examples at once. */
export function storyStill(act: number): StoryState {
  const state = storyState(stillProgress(act))
  if (act < STILL_FILLS.length) return state
  return {
    ...state,
    invite: 0,
    examples: EXAMPLES.map(() => ({ signal: 1, alert: true, resolved: false })),
  }
}

export const AUTO_STORY_MS = 28000

export function autoStoryProgress(elapsedMs: number): number {
  return clamp01(elapsedMs / AUTO_STORY_MS)
}
