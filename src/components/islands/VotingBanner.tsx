import { useEffect, useRef, useState } from 'react'
import { Trophy, X, ArrowRight } from 'lucide-react'
import { TranslationProvider } from '../../i18n/TranslationProvider'
import { useT } from '../../i18n/useT'
import { dismissVotingBanner, isVotingBannerDismissed } from '../../lib/storage'

interface Props {
  votingUrl: string
  /** ISO date. Passed in so the deadline lives in one place, not in this file. */
  deadline: string
  strings: Record<string, string>
}

function Banner({ votingUrl, deadline }: Omit<Props, 'strings'>) {
  const t = useT()
  // Starts visible so the server already reserves the space. Mounting it the
  // other way round pushed the whole page down one frame after hydration, and
  // the page that has not been dismissed is by far the common case. The build
  // skips the island entirely once the deadline has passed.
  const [isVisible, setIsVisible] = useState(true)
  const bannerRef = useRef<HTMLElement>(null)

  // Both checks belong on the client: there is no localStorage on the server, and
  // Date.now() during render would be impure and could differ between the two.
  useEffect(() => {
    if (isVotingBannerDismissed() || Date.now() > new Date(deadline).getTime()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- both inputs only exist in the browser
      setIsVisible(false)
    }
  }, [deadline])

  // Header and page content are pushed down by this, so the height must stay in sync
  useEffect(() => {
    const root = document.documentElement
    const banner = bannerRef.current

    if (!banner) {
      root.style.removeProperty('--voting-banner-height')
      return
    }

    const observer = new ResizeObserver(() => {
      root.style.setProperty('--voting-banner-height', `${banner.offsetHeight}px`)
    })
    observer.observe(banner)

    return () => {
      observer.disconnect()
      root.style.removeProperty('--voting-banner-height')
    }
  }, [isVisible])

  // Dropping the banner from the tree would snap the whole page up by its
  // height. It collapses along the axis it occupies instead, so the content
  // arrives where the reader can follow it.
  const handleDismiss = () => {
    const banner = bannerRef.current
    dismissVotingBanner()

    if (!banner || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(false)
      return
    }

    // The ResizeObserver above keeps --voting-banner-height on the collapsing
    // height, so header and content ride it down instead of snapping.
    banner.addEventListener('transitionend', () => setIsVisible(false), { once: true })
    banner.style.height = `${banner.offsetHeight}px`
    requestAnimationFrame(() => {
      banner.style.height = '0px'
      banner.style.opacity = '0'
    })
  }

  if (!isVisible) return null

  return (
    <aside
      ref={bannerRef}
      aria-label={t('banner.ariaLabel')}
      className="fixed inset-x-0 top-0 z-40 overflow-hidden bg-green-dark-900 text-white transition-[height,opacity] ease-out duration-300"
    >
      <div className="relative mx-auto max-w-screen-lg px-4 md:px-6 xl:max-w-screen-xl">
        <a
          href={votingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-x-3 py-2.5 pr-8 transition-opacity ease-out duration-100 active:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:justify-center sm:gap-x-4 sm:py-2 md:pr-10"
        >
          <Trophy className="w-4 h-4 shrink-0 text-green-light-900" aria-hidden />

          <span className="text-xs leading-snug sm:text-sm">
            <span className="font-semibold">{t('banner.title')}</span>
            <span className="hidden sm:inline">: {t('banner.desktopDescription')}</span>
            <span className="block text-white/85 sm:hidden">{t('banner.mobileDescription')}</span>
          </span>

          <span className="hidden shrink-0 items-center gap-x-2 rounded-xl bg-green-light-900 px-4 py-1.5 text-sm font-semibold text-grey-900 transition-colors ease-in-out duration-300 group-hover:bg-white sm:inline-flex">
            {t('banner.cta')}
            <ArrowRight className="w-4 h-4 transition-transform ease-in-out duration-300 group-hover:translate-x-1" />
          </span>

          <ArrowRight className="ml-auto w-4 h-4 shrink-0 sm:hidden" aria-hidden />
        </a>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label={t('banner.dismissAriaLabel')}
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg p-1 text-white/70 transition-colors ease-out duration-150 hover:bg-white/10 hover:text-white active:bg-white/20 active:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:right-4"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  )
}

// The react version sat in the router root and hid itself everywhere but the
// start page. In astro only the start page renders it, so the path check is gone.
export default function VotingBanner({ strings, ...props }: Props) {
  return (
    <TranslationProvider strings={strings}>
      <Banner {...props} />
    </TranslationProvider>
  )
}
