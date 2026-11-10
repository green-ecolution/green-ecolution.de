// Slightly above the middle, where the eye rests while reading down a page.
const READING_LINE = 0.45

export function activeStepIndex(stepTops: number[], viewportHeight: number): number {
  const line = viewportHeight * READING_LINE
  let active = 0
  stepTops.forEach((top, index) => {
    if (top <= line) active = index
  })
  return active
}
