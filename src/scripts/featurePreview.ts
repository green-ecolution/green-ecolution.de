let page: AbortController | null = null

function close(card: HTMLElement) {
  card.dataset.preview = 'closed'
  card.removeAttribute('data-preview-width')
  card.querySelector('[data-preview-toggle]')?.setAttribute('aria-pressed', 'false')
}

// A small card's preview spans two grid columns: its own and a neighbour's.
// On a single column there is no neighbour, so it stays the card's width.
function sizeSmallPreview(card: HTMLElement, grid: HTMLElement) {
  const style = getComputedStyle(grid)
  const columns = style.gridTemplateColumns.split(' ').filter(Boolean).length
  if (columns < 2) {
    card.removeAttribute('data-preview-width')
    return
  }

  const gap = Number.parseFloat(style.columnGap) || 0
  const cardRect = card.getBoundingClientRect()
  const gridRect = grid.getBoundingClientRect()
  const growRight = cardRect.right + gap + cardRect.width <= gridRect.right + 1

  card.dataset.grow = growRight ? 'right' : 'left'
  card.style.setProperty('--preview-width', `${cardRect.width * 2 + gap}px`)
  card.style.setProperty('--preview-extra', growRight ? `${cardRect.width + gap}px` : '0px')
  card.toggleAttribute('data-preview-width', true)
}

function setup() {
  page?.abort()
  page = new AbortController()
  const { signal } = page

  for (const grid of document.querySelectorAll<HTMLElement>('[data-feature-grid]')) {
    const cards = [...grid.querySelectorAll<HTMLElement>('[data-preview]')]
    const openCard = () => cards.find((card) => card.dataset.preview === 'open')

    for (const card of cards) {
      const toggle = card.querySelector<HTMLButtonElement>('[data-preview-toggle]')
      if (!toggle) continue

      toggle.addEventListener(
        'click',
        () => {
          if (card.dataset.preview === 'open') {
            close(card)
            return
          }
          for (const other of cards) if (other !== card) close(other)
          if (card.dataset.previewSize === 'small') sizeSmallPreview(card, grid)
          card.dataset.preview = 'open'
          toggle.setAttribute('aria-pressed', 'true')
        },
        { signal },
      )
    }

    document.addEventListener(
      'keydown',
      (event) => {
        const open = openCard()
        if (event.key !== 'Escape' || !open) return
        close(open)
        open.querySelector<HTMLElement>('[data-preview-toggle]')?.focus()
      },
      { signal },
    )

    document.addEventListener(
      'click',
      (event) => {
        const open = openCard()
        if (open && !open.contains(event.target as Node)) close(open)
      },
      { signal },
    )

    window.addEventListener(
      'resize',
      () => {
        const open = openCard()
        if (open?.dataset.previewSize === 'small') sizeSmallPreview(open, grid)
      },
      { signal },
    )
  }
}

document.addEventListener('astro:page-load', setup)
