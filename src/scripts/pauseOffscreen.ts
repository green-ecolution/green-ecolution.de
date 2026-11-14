// A css animation that repeats forever keeps ticking while its element is far
// outside the window. Regions marked with data-pause-offscreen run theirs only
// while in sight: motion.css pauses everything under [data-offscreen]. Without
// the script the attribute is never set and the animations simply run.
let page: AbortController | null = null

const SMIL = 'animate, animateMotion, animateTransform'

export function setup() {
  page?.abort()
  page = new AbortController()

  const regions = [...document.querySelectorAll<HTMLElement>('[data-pause-offscreen]')]
  if (regions.length === 0) return

  // SMIL knows nothing of animation-play-state, and it restyles its svg on
  // every frame wherever that is, so those drawings are paused by hand.
  const drawings = new Map(
    regions.map((region) => [
      region,
      [...region.querySelectorAll<SVGSVGElement>('svg')].filter((svg) => svg.querySelector(SMIL)),
    ]),
  )

  const viewport = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const isOffscreen = !entry.isIntersecting
      entry.target.toggleAttribute('data-offscreen', isOffscreen)
      for (const svg of drawings.get(entry.target as HTMLElement) ?? []) {
        if (isOffscreen) svg.pauseAnimations()
        // A drawing that is not rendered stays paused. Whoever shows it later
        // starts it, as soilProbe.ts does for its sketch.
        else if (svg.checkVisibility?.() ?? true) svg.unpauseAnimations()
      }
    }
  })
  for (const region of regions) viewport.observe(region)

  page.signal.addEventListener('abort', () => viewport.disconnect())
}

document.addEventListener('astro:page-load', setup)
