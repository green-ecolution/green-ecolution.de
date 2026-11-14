import { pinnedStep } from './pinnedSteps'

export const ACT_WEIGHTS: number[] = [1, 1, 1.5, 3.2]
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
  /** How far the vehicle's job at the spot has come. */
  work: number
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
const FINALE_INTRO = 0.08

/** Moments of an example as shares of its span, each paired with a value from 0 to 1. */
type Knots = readonly (readonly [number, number])[]

interface ExamplePlan {
  /** Share of the finale the example plays in. */
  span: number
  /** The camera has arrived and the spot starts to signal. */
  arrive: number
  alert: number
  drive: Knots
  work: Knots
  /** The vehicle starts to shrink away. */
  leave: number
}

/** The share of its way after which the gritter is on the ice in storyTown.ts. */
export const GRITTER_SLOWS_AT = 0.7
// The gritter hurries to the ice and spreads along it slowly; its job is the way itself.
const GRITTING: Knots = [
  [0.34, 0],
  [0.56, GRITTER_SLOWS_AT],
  [0.9, 1],
]

const PLANS: Record<ExampleId, ExamplePlan> = {
  bin: {
    span: 0.21,
    arrive: 0.3,
    alert: 0.45,
    drive: [
      [0.5, 0],
      [0.82, 1],
    ],
    work: [
      [0.82, 0],
      [0.9, 1],
    ],
    leave: 0.93,
  },
  winter: { span: 0.31, arrive: 0.2, alert: 0.3, drive: GRITTING, work: GRITTING, leave: 0.94 },
  rain: {
    span: 0.31,
    arrive: 0.2,
    alert: 0.3,
    drive: [
      [0.34, 0],
      [0.6, 1],
    ],
    work: [
      [0.62, 0],
      [0.9, 1],
    ],
    leave: 0.94,
  },
}

const plans = EXAMPLES.map((id) => PLANS[id])
const exampleFrom = (index: number) =>
  plans.slice(0, index).reduce((sum, plan) => sum + plan.span, FINALE_INTRO)
const INVITE_FROM = exampleFrom(EXAMPLES.length)
// Where a jump lands inside an act: late enough to show what the act is about.
const ACT_LANDING = 0.6
const STILL_FILLS = [0.9, 0.95, 0.999]

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const span = (value: number, from: number, to: number) => clamp01((value - from) / (to - from))
const ease = (t: number) => t * t * (3 - 2 * t)

function along(local: number, knots: Knots): number {
  const next = knots.findIndex(([at]) => local < at)
  if (next === 0) return knots[0][1]
  if (next < 0) return knots[knots.length - 1][1]
  const [fromAt, from] = knots[next - 1]
  const [toAt, to] = knots[next]
  return from + ((local - fromAt) / (toAt - fromAt)) * (to - from)
}
const hold = (shot: ShotId): CameraCut => ({ from: shot, to: shot, blend: 1 })

const IDLE: ExampleState = { signal: 0, alert: false, work: 0, resolved: false }
const DONE: ExampleState = { signal: 0, alert: false, work: 1, resolved: true }
const PARKED: VehicleState = { route: 'tour', at: 0, shown: 0 }

export function progressAt(act: number, fill: number): number {
  const before = ACT_WEIGHTS.slice(0, act).reduce((sum, weight) => sum + weight, 0)
  return (before + clamp01(fill) * ACT_WEIGHTS[act]) / TOTAL
}

export function progressForAct(index: number): number {
  // The finale opens on its title over the finished third act, before the
  // watering truck starts to shrink away at 0.016.
  return progressAt(index, index === ACT_WEIGHTS.length - 1 ? 0.01 : ACT_LANDING)
}

/** Where an example begins; one past the last gives where the invitation takes over. */
export function exampleStart(index: number): number {
  return progressAt(3, exampleFrom(index))
}

export function progressForExample(index: number): number {
  return progressAt(3, exampleFrom(index) + ACT_LANDING * plans[index].span)
}

export function pinsShown(reveal: number, count: number): number {
  return Math.min(count, Math.floor(clamp01(reveal) * count + 1e-9))
}

function exampleState(local: number, plan: ExamplePlan): ExampleState {
  const work = along(local, plan.work)
  const resolved = work >= 1
  return {
    signal: resolved ? 0 : span(local, plan.arrive, plan.alert),
    alert: local >= plan.alert && !resolved,
    work,
    resolved,
  }
}

type Finale = Pick<StoryState, 'camera' | 'activeExample' | 'examples' | 'invite' | 'vehicle'>

function finale(p: number): Finale {
  const examples = plans.map((plan, index) => {
    const from = exampleFrom(index)
    if (p < from) return IDLE
    if (p >= from + plan.span) return DONE
    return exampleState((p - from) / plan.span, plan)
  })

  if (p < FINALE_INTRO) {
    return {
      camera: hold('watering'),
      activeExample: null,
      examples,
      invite: 0,
      vehicle: { route: 'tour', at: 1, shown: 1 - span(p, 0.016, 0.064) },
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

  const index = plans.findLastIndex((_, example) => p >= exampleFrom(example))
  const plan = plans[index]
  const local = (p - exampleFrom(index)) / plan.span
  const setOff = plan.drive[0][0]
  return {
    camera: {
      from: index === 0 ? 'watering' : EXAMPLES[index - 1],
      to: EXAMPLES[index],
      blend: ease(span(local, 0, plan.arrive)),
    },
    activeExample: index,
    examples,
    invite: 0,
    vehicle: {
      route: index,
      at: along(local, plan.drive),
      // Pops in off screen and leaves before the camera moves on.
      shown: span(local, setOff - 0.04, setOff + 0.02) * (1 - span(local, plan.leave, 1)),
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
    examples: EXAMPLES.map(() => ({ signal: 1, alert: true, work: 0, resolved: false })),
  }
}

export const AUTO_STORY_MS = 31000

export function autoStoryProgress(elapsedMs: number): number {
  return clamp01(elapsedMs / AUTO_STORY_MS)
}
