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

export { damp } from '../scene3d/damp'
