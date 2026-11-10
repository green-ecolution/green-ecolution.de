let page: AbortController | null = null

function close(card: HTMLElement) {
  card.dataset.preview = 'closed'
  card.querySelector('[data-preview-toggle]')?.setAttribute('aria-pressed', 'false')
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
          // One open card at a time: each row has room for one card to grow.
          for (const other of cards) if (other !== card) close(other)
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
  }
}

document.addEventListener('astro:page-load', setup)
