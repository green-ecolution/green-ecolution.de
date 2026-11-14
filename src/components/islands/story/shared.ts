import type { RefObject } from 'react'
import type { StoryState } from '../../../lib/storyTimeline'
import { treePit } from '../scene3d/trees'

export type Story = RefObject<StoryState>

export interface StorySource {
  target: number
  /** Set while the scene shows the still of an act instead of following. */
  still: number | null
  onChange: (() => void) | null
}

export interface ActorProps {
  story: Story
  isStatic: boolean
}

export const PIT_TOP = treePit.kerbHeight + treePit.soilHeight

/** Moves a value towards its target at a pace that does not depend on the frame rate. */
export function damp(current: number, target: number, rate: number, delta: number): number {
  return current + (target - current) * (1 - Math.exp(-rate * delta))
}
