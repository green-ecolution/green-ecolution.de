let page: AbortController | null = null

// A link to a closed <details> would land on its summary alone.
function setup() {
  page?.abort()
  page = new AbortController()

  const open = () => {
    const target = location.hash ? document.getElementById(location.hash.slice(1)) : null
    const details = target?.querySelector<HTMLDetailsElement>('details[data-open-on-anchor]')
    if (details) details.open = true
  }

  open()
  window.addEventListener('hashchange', open, { signal: page.signal })
}

document.addEventListener('astro:page-load', setup)

// Without an import or export this file would share its names with every other script.
export {}
