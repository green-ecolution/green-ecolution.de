/**
 * A critically damped spring towards `target`, after Unity's SmoothDamp:
 * starts from its velocity, ends at rest, never overshoots. Returns the new
 * value and velocity.
 */
export function smoothDamp(
  current: number,
  velocity: number,
  target: number,
  smoothTime: number,
  delta: number,
): [number, number] {
  if (delta <= 0) return [current, velocity]
  const omega = 2 / Math.max(1e-4, smoothTime)
  const x = omega * delta
  // A Padé approximation of exp(-x), exact enough and cheap.
  const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)
  const change = current - target
  const pull = (velocity + omega * change) * delta
  let next = target + (change + pull) * decay
  let nextVelocity = (velocity - omega * pull) * decay
  if (target - current > 0 === next > target) {
    next = target
    nextVelocity = 0
  }
  return [next, nextVelocity]
}
