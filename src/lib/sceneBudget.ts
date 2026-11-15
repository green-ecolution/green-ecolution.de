// How long a 3d scene keeps drawing after its state came to rest. It has to
// outlast every eased part (pins, pulses, fades). Past that only the ambient
// motion is left, and a scene that draws it forever costs a frame loop for as
// long as it is in sight.
export const AMBIENT_MS = 4000

// Capped below a retina display's 2: with antialiasing on, the flat-shaded
// models look the same at 1.5 and fill a little over half the pixels.
export const MAX_DPR: [number, number] = [1, 1.5]
