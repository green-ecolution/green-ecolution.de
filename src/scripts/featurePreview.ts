let page: AbortController | null = null

function setup() {
  page?.abort()
  page = new AbortController()
  const { signal } = page

  for (const toggle of document.querySelectorAll<HTMLButtonElement>('[data-preview-toggle]')) {
    const card = toggle.closest<HTMLElement>('[data-preview]')
    if (!card) continue

    toggle.addEventListener(
      'click',
      () => {
        const open = card.dataset.preview !== 'open'
        card.dataset.preview = open ? 'open' : 'closed'
        toggle.setAttribute('aria-pressed', String(open))
      },
      { signal },
    )
  }
}

document.addEventListener('astro:page-load', setup)
