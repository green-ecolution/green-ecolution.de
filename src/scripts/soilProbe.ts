let page: AbortController | null = null

function setup() {
  page?.abort()
  page = new AbortController()
  const { signal } = page

  for (const root of document.querySelectorAll<HTMLElement>('[data-soak-root]')) {
    const options = [...root.querySelectorAll<HTMLButtonElement>('[data-soak-option]')]
    const text = root.querySelector<HTMLElement>('[data-soak-text]')

    for (const option of options) {
      option.addEventListener(
        'click',
        () => {
          root.dataset.soak = option.dataset.soakOption
          for (const other of options) other.setAttribute('aria-pressed', String(other === option))
          if (text) text.textContent = option.dataset.soakStatus ?? ''
        },
        { signal },
      )
    }
  }
}

document.addEventListener('astro:page-load', setup)
