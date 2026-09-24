import type { Scene } from './showcase'

/**
 * The 30-second cut for an advertising wall.
 *
 * Not an excerpt of the booth loop: it plays once to people walking past rather
 * than in a loop to visitors standing in front of it, so every scene carries a
 * single statement and one short line under it. Same layouts, photographs and
 * screencasts as the booth board, so both stay in step without a second design.
 */
export const SPOT_SECONDS = 30

// Where each screencast scene seeks into its recording. The clips are cut to
// the length of their booth scene and open with a slow approach, so a six
// second window starting at zero would show the approach and nothing else.
// Chosen so the moment that carries the scene lands inside it: the red tree
// being opened on the map, the group being dragged into an assignment.
const MAP_CLIP_START = 5
const PLANNING_CLIP_START = 4

export const spotScenes: Scene[] = [
  {
    id: 'spot-problem',
    act: 'lage',
    layout: 'photo',
    seconds: 5,
    visual: { kind: 'image', asset: 'bewaesserung-jungbaum-tbz.jpg', pan: 'in-a' },
  },
  {
    id: 'spot-sensor',
    act: 'boden',
    layout: 'photo',
    seconds: 5,
    step: 'messen',
    opensStep: true,
    visual: { kind: 'image', asset: 'sensor-einbau-erdbohrer.jpg', pan: 'in-b' },
  },
  {
    id: 'spot-map',
    act: 'software',
    layout: 'exhibit',
    seconds: 6,
    step: 'verstehen',
    opensStep: true,
    side: 'right',
    visual: {
      kind: 'video',
      clip: 'showcase-karte.mp4',
      poster: 'v0.3.0-karte-uebersicht.png',
      startAt: MAP_CLIP_START,
    },
  },
  {
    id: 'spot-planning',
    act: 'software',
    layout: 'exhibit',
    seconds: 6,
    step: 'handeln',
    opensStep: true,
    side: 'right',
    visual: {
      kind: 'video',
      clip: 'showcase-einsatzplanung.mp4',
      poster: 'v0.4.0-einsatzplanung-board.png',
      startAt: PLANNING_CLIP_START,
    },
  },
  {
    id: 'spot-origin',
    act: 'fahrt',
    layout: 'photo',
    seconds: 4,
    visual: { kind: 'image', asset: 'team-progeek.jpg', pan: 'out-a' },
  },
  {
    id: 'spot-closing',
    act: 'fahrt',
    layout: 'closing',
    seconds: 4,
    hideChrome: ['logo', 'tour'],
    contacts: ['website', 'instagram'],
    visual: { kind: 'none' },
  },
]
