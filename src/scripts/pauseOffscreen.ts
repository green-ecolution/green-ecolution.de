// A css animation that repeats forever keeps ticking while its element is far
// outside the window. Regions marked with data-pause-offscreen run theirs only
// while in sight: motion.css pauses everything under [data-offscreen]. Without
// the script the attribute is never set and the animations simply run.
let page: AbortController | null = null

export function setup() {
  page?.abort()
  page = new AbortController()

  const regions = document.querySelectorAll<HTMLElement>('[data-pause-offscreen]')
  if (regions.length === 0) return

  const viewport = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      entry.target.toggleAttribute('data-offscreen', !entry.isIntersecting)
    }
  })
  for (const region of regions) viewport.observe(region)

  page.signal.addEventListener('abort', () => viewport.disconnect())
}

document.addEventListener('astro:page-load', setup)
