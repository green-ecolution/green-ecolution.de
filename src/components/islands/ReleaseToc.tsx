import { useEffect, useState } from 'react'
import { TranslationProvider } from '../../i18n/TranslationProvider'
import { useT } from '../../i18n/useT'

interface TocEntry {
  id: string
  label: string
}

interface Props {
  entries: TocEntry[]
  strings: Record<string, string>
}

// Matches scroll-padding-top on <html> (scroll-pt-40) plus a little tolerance,
// so a heading counts as current right after an anchor jump lands on it.
const ACTIVE_THRESHOLD_PX = 170

function Toc({ entries }: { entries: TocEntry[] }) {
  const t = useT()
  const [activeId, setActiveId] = useState<string | null>(entries[0]?.id ?? null)

  useEffect(() => {
    // Reading positions on scroll rather than observing a narrow band, because a
    // jump longer than the band would skip the headings inside it.
    let frame = 0

    const update = () => {
      frame = 0
      const passed = entries.filter((entry) => {
        const element = document.getElementById(entry.id)
        return element ? element.getBoundingClientRect().top <= ACTIVE_THRESHOLD_PX : false
      })

      setActiveId(passed[passed.length - 1]?.id ?? entries[0]?.id ?? null)
    }

    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [entries])

  return (
    <nav aria-label={t('toc.ariaLabel')} className="sticky top-28">
      <span className="text-xs font-semibold tracking-widest text-green-dark-900 uppercase">
        {t('toc.title')}
      </span>
      <div className="label-rule mb-4" />

      <ul className="space-y-1 border-l border-grey-900/10">
        {entries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              aria-current={activeId === entry.id ? 'true' : undefined}
              className={`block -ml-px border-l-2 pl-3 py-1 text-sm transition-colors ${
                activeId === entry.id
                  ? 'border-green-dark-900 text-green-dark-900 font-semibold'
                  : 'border-transparent text-grey-900/60 hover:text-green-dark-900'
              }`}
            >
              {entry.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function ReleaseToc({ entries, strings }: Props) {
  return (
    <TranslationProvider strings={strings}>
      <Toc entries={entries} />
    </TranslationProvider>
  )
}
