import type { TourScript } from '../../../lib/wateringDay'

/** What the island knows and the scene reads every frame, without a render in between. */
export interface DayLive {
  /** Days without rain, as the slider stands. */
  days: number
  /** Per tree in townTrees: watered on this tour. */
  watered: boolean[]
  /** Per tree: its number on the planned tour, 0 if it is not on it. */
  order: number[]
  /** Tree clicked in the list or in the scene; the camera goes there. */
  selected: number | null
  /** Tree under the mouse or keyboard focus in the list; only named, the camera stays. */
  highlighted: number | null
  script: TourScript | null
  /** Seconds into the tour; the scene's clock advances it while `running`. */
  elapsed: number
  running: boolean
  /** Set by the scene: something in here changed, draw again. */
  onChange: (() => void) | null
}

export interface TourProgress {
  /** Stops left behind. */
  served: number
  /** Index of the stop the vehicle stands at, or -1 on the road. */
  dwell: number
  done: boolean
}

export interface DayEvents {
  onReady: () => void
  onProgress: (progress: TourProgress) => void
  onSelect: (tree: number | null) => void
}
