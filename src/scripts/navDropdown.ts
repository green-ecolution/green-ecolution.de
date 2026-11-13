// Long enough to cross the gap between a trigger and its panel on a diagonal.
export const CLOSE_DELAY_MS = 150

let page: AbortController | null = null

function groupOf(target: EventTarget | null) {
  return target instanceof Element ? target.closest<HTMLElement>('[data-nav-group]') : null
}

function setOpen(group: HTMLElement, open: boolean) {
  group.toggleAttribute('data-open', open)
  group.querySelector('[data-nav-trigger]')?.setAttribute('aria-expanded', String(open))
}

function closeAll(except?: HTMLElement | null) {
  for (const group of document.querySelectorAll<HTMLElement>('[data-nav-group][data-open]')) {
    if (group !== except) setOpen(group, false)
  }
}

export function setup() {
  page?.abort()
  page = new AbortController()
  const { signal } = page

  let hovered: HTMLElement | null = null
  let closeTimer = 0

  // Everything is delegated: the navigation island re-renders its markup when
  // the viewport crosses the breakpoint, which would drop listeners bound to
  // the nodes themselves.
  document.addEventListener(
    'click',
    (event) => {
      const group = groupOf(event.target)
      const target = event.target as Element

      if (!group || target.closest('a')) {
        closeAll()
        return
      }
      if (!target.closest('[data-nav-trigger]')) return

      closeAll(group)
      // A mouse click lands on a panel the hover has already opened; toggling
      // would shut it under the pointer.
      setOpen(group, hovered === group || !group.hasAttribute('data-open'))
    },
    { signal },
  )

  document.addEventListener(
    'pointerover',
    (event) => {
      if (event.pointerType !== 'mouse') return
      const group = groupOf(event.target)
      if (!group) return

      window.clearTimeout(closeTimer)
      hovered = group
      closeAll(group)
      setOpen(group, true)
    },
    { signal },
  )

  document.addEventListener(
    'pointerout',
    (event) => {
      if (event.pointerType !== 'mouse' || !hovered) return
      if (event.relatedTarget instanceof Node && hovered.contains(event.relatedTarget)) return

      const left = hovered
      hovered = null
      window.clearTimeout(closeTimer)
      closeTimer = window.setTimeout(() => setOpen(left, false), CLOSE_DELAY_MS)
    },
    { signal },
  )

  document.addEventListener(
    'focusout',
    (event) => {
      const group = groupOf(event.target)
      if (!group || group === hovered) return
      if (event.relatedTarget instanceof Node && group.contains(event.relatedTarget)) return
      setOpen(group, false)
    },
    { signal },
  )

  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Escape') return
      const group = document.querySelector<HTMLElement>('[data-nav-group][data-open]')
      if (!group) return

      // Focus first: once the panel is hidden the link inside it loses focus to
      // the body and the reader would start again from the top of the page.
      if (group.contains(document.activeElement)) {
        group.querySelector<HTMLElement>('[data-nav-trigger]')?.focus()
      }
      setOpen(group, false)
    },
    { signal },
  )

  signal.addEventListener('abort', () => window.clearTimeout(closeTimer))
}

// Fires on the first load and after every ClientRouter navigation.
document.addEventListener('astro:page-load', setup)
