import { canopyCenterHeight, type Tree } from '../../../data/streamletTour'

export const PIN_RADIUS = 0.78
export const PIN_POST = 1.8
/** The white outline around a pin's head, relative to its radius. */
export const PIN_HULL = 1.14
// Smallest head radius in css pixels: the town shot is the picture for
// "understand", and its pins have to read on a phone-sized stage.
const MIN_HEAD_PX = 7

/** How much a pin's head is enlarged; an orthographic zoom is css pixels per world unit. */
export const pinHeadScale = (zoom: number) => Math.max(1, MIN_HEAD_PX / (PIN_RADIUS * zoom))

export const pinHeight = (tree: Tree) =>
  canopyCenterHeight(tree) + tree.canopyRadius + PIN_POST + 0.2
