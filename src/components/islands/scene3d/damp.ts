/** Moves a value towards its target at a pace that does not depend on the frame rate. */
export function damp(current: number, target: number, rate: number, delta: number): number {
  return current + (target - current) * (1 - Math.exp(-rate * delta))
}
