import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { TranslationProvider } from '../../i18n/TranslationProvider'
import { useT } from '../../i18n/useT'
import { useOutsideClick } from '../../hooks/useOutsideClick'
import { useDialogFocus } from '../../hooks/useDialogFocus'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { projectMomentum, rubberband, spring } from '../../lib/spring'
import { ARROW_PATH } from '../../lib/iconPaths'

interface NavLink {
  label: string
  href: string
  active?: boolean
  description?: string
}

interface NavGroup {
  id: string
  label: string
  active: boolean
  items: NavLink[]
}

type NavEntry = NavLink | NavGroup

interface Props {
  entries: NavEntry[]
  imprintHref: string
  privacyHref: string
  demoHref: string
  strings: Record<string, string>
  children?: ReactNode
}

// How far a pointer has to travel before it counts as a drag rather than a tap,
// and how much of that has to be horizontal before we take the gesture away
// from the browser's own vertical scrolling.
const DRAG_THRESHOLD_PX = 10
const VELOCITY_WINDOW_MS = 100
// Widest the panel ever stretches when pulled past its open stop, as a fraction
// of its own width. Small on purpose: it has to read as give, not as a resize.
const MAX_OVERSHOOT_STRETCH = 0.045
// Below this the navigation is a drawer, from here on a bar. Header.astro
// hydrates the island on the other side of the same line.
const DESKTOP_QUERY = '(min-width: 1024px)'

const CHEVRON_PATH = 'm19.5 8.25-7.5 7.5-7.5-7.5'

const ACTIVE_UNDERLINE =
  'underline underline-offset-4 decoration-2 decoration-green-light-900 lg:decoration-green-middle-900'
const LABEL_HOVER =
  'transition-colors ease-out duration-150 group-hover:text-green-light-900 group-active:text-green-light-900 lg:group-hover:text-green-middle-900 lg:group-active:text-green-middle-900'
const DRAWER_ARROW =
  'w-6 shrink-0 transition-all ease-out duration-200 group-hover:translate-x-2 group-hover:text-green-light-900 group-active:translate-x-2 group-active:text-green-light-900 lg:hidden'

function Icon({ path, className }: { path: string; className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  )
}

function NavItem({ label, href, active, onClick }: NavLink & { onClick: () => void }) {
  return (
    <li className="mb-4 lg:mb-0">
      <a
        href={href}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className="text-lg md:text-2xl font-bold flex justify-between items-center group cursor-pointer lg:text-base lg:font-medium lg:leading-none lg:my-1"
      >
        <p className={`whitespace-nowrap ${LABEL_HOVER} ${active ? ACTIVE_UNDERLINE : ''}`}>
          {label}
        </p>
        <Icon path={ARROW_PATH} className={DRAWER_ARROW} />
      </a>
    </li>
  )
}

// In the drawer a group is a small heading over its links. On the bar it is a
// button with a panel; src/scripts/navDropdown.ts opens it, because the island
// does not hydrate there.
function NavGroupItem({ id, label, active, items, onClick }: NavGroup & { onClick: () => void }) {
  const panelId = `nav-panel-${id}`

  return (
    <li data-nav-group className="nav-group my-6 first:mt-0 lg:relative lg:my-0">
      <p className="mb-3 text-sm text-white/60 md:text-base lg:hidden">{label}</p>
      <button
        type="button"
        data-nav-trigger
        aria-expanded={false}
        aria-controls={panelId}
        className="hidden items-center gap-x-1 my-1 text-base font-medium leading-none cursor-pointer group lg:flex"
      >
        <span className={`whitespace-nowrap ${LABEL_HOVER} ${active ? ACTIVE_UNDERLINE : ''}`}>
          {label}
        </span>
        <Icon
          path={CHEVRON_PATH}
          className="nav-chevron w-3.5 stroke-2 transition-transform duration-200"
        />
      </button>
      <div id={panelId} className="nav-panel lg:absolute lg:top-full lg:-left-5 lg:w-80 lg:pt-5">
        <ul
          aria-label={label}
          className="lg:p-2 lg:bg-white lg:rounded-2xl lg:border lg:border-grey-900/10 lg:shadow-nav-panel"
        >
          {items.map((item) => (
            <li key={item.href} className="mb-3 last:mb-0 lg:mb-0">
              <a
                href={item.href}
                onClick={onClick}
                aria-current={item.active ? 'page' : undefined}
                className="text-lg md:text-2xl font-bold flex justify-between items-center group cursor-pointer lg:block lg:px-4 lg:py-3 lg:rounded-xl lg:text-base lg:font-normal lg:transition-colors lg:duration-150 lg:hover:bg-green-light-100 lg:focus-visible:bg-green-light-100"
              >
                <span className="block">
                  <span
                    className={`block whitespace-nowrap lg:font-semibold ${LABEL_HOVER} ${item.active ? ACTIVE_UNDERLINE : ''}`}
                  >
                    {item.label}
                  </span>
                  {item.description && (
                    <span className="hidden mt-1 text-sm text-grey-900/70 lg:block">
                      {item.description}
                    </span>
                  )}
                </span>
                <Icon path={ARROW_PATH} className={DRAWER_ARROW} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </li>
  )
}

function Navigation({
  entries,
  imprintHref,
  privacyHref,
  demoHref,
  children,
}: Omit<Props, 'strings'>) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const reducedMotion = useReducedMotion()

  const navRef = useRef<HTMLElement>(null)
  const stopAnimation = useRef<(() => void) | null>(null)
  const stopStretch = useRef<(() => void) | null>(null)
  // How far past its open stop the panel is being pulled, as a scale factor
  // rather than a position: the right edge has to stay against the screen.
  const stretch = useRef(0)
  // Where the drawer actually is right now, in px from its open position. Every
  // animation starts from this, which is what lets a gesture interrupt one.
  const offset = useRef(0)
  // Handed from the gesture to the animation that replaces it, so the drawer
  // keeps flying at the speed the finger left it with.
  const releaseVelocity = useRef(0)
  const drag = useRef<{
    pointerId: number
    startX: number
    startY: number
    startOffset: number
    axis: 'none' | 'horizontal' | 'vertical'
    lastX: number
    lastTime: number
    velocity: number
  } | null>(null)

  const close = useCallback(() => setOpen(false), [])

  const paint = useCallback((value: number) => {
    const nav = navRef.current
    if (!nav) return
    offset.current = value
    const width = nav.offsetWidth || 1
    // On the root rather than on the nav, because the scrim is a sibling and
    // reads the same progress.
    const root = document.documentElement.style
    root.setProperty('--drawer-x', `${value}px`)
    // The scrim tracks the drag instead of waiting for it to finish, so the
    // gesture is answered the whole way through and not only at the end.
    root.setProperty('--drawer-progress', `${Math.max(0, 1 - value / width)}`)
  }, [])

  const paintStretch = useCallback((value: number) => {
    stretch.current = value
    document.documentElement.style.setProperty('--drawer-stretch', `${value}`)
  }, [])

  // Let go of the edge and it snaps back with a little overshoot of its own.
  // That bounce is the whole point of the boundary: it says there is nothing
  // more this way, without ever feeling stuck.
  const releaseStretch = useCallback(() => {
    stopStretch.current?.()
    if (stretch.current === 0) return

    if (reducedMotion) {
      paintStretch(0)
      return
    }

    stopStretch.current = spring({
      from: stretch.current,
      to: 0,
      damping: 0.55,
      response: 0.35,
      restDistance: 0.0005,
      restVelocity: 0.005,
      onFrame: paintStretch,
    })
  }, [paintStretch, reducedMotion])

  const settle = useCallback(
    (target: number, velocity = 0) => {
      stopAnimation.current?.()

      if (reducedMotion) {
        paint(target)
        return
      }

      stopAnimation.current = spring({
        from: offset.current,
        to: target,
        velocity,
        // A drawer is thrown, so it is allowed a little overshoot. These are the
        // values Apple ships for sheets.
        damping: 0.8,
        response: 0.3,
        onFrame: paint,
      })
    },
    [paint, reducedMotion],
  )

  useEffect(() => {
    const checkMobile = () => setIsMobile(!window.matchMedia(DESKTOP_QUERY).matches)
    const handleResize = () => {
      checkMobile()
      if (window.matchMedia(DESKTOP_QUERY).matches) {
        setOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', open)
    return () => document.body.classList.remove('overflow-hidden')
  }, [open])

  useEffect(() => {
    const nav = navRef.current
    if (!isMobile || !nav) return

    // Before the first paint the drawer sits at the class default of 100%, which
    // is not a px value the spring could start from.
    if (!document.documentElement.style.getPropertyValue('--drawer-x')) {
      paint(nav.offsetWidth)
    }

    settle(open ? 0 : nav.offsetWidth, releaseVelocity.current)
    releaseVelocity.current = 0
    // A link tapped mid-pull would otherwise leave the panel stretched.
    releaseStretch()

    // The closed position is stored in px, so a viewport change would otherwise
    // leave the drawer parked at the width it had before.
    const onResize = () => {
      if (!open) paint(nav.offsetWidth)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      stopAnimation.current?.()
      stopStretch.current?.()
    }
  }, [open, isMobile, paint, settle, releaseStretch])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, close])

  useDialogFocus(navRef, isMobile && open)

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!isMobile || !open || event.pointerType === 'mouse' || !event.isPrimary) return

    // Grabbing a drawer that is still animating has to pick it up where it is,
    // not where it was heading.
    stopAnimation.current?.()
    stopStretch.current?.()

    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: offset.current,
      axis: 'none',
      lastX: event.clientX,
      lastTime: event.timeStamp,
      velocity: 0,
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const state = drag.current
    if (state?.pointerId !== event.pointerId) return

    const deltaX = event.clientX - state.startX
    const deltaY = event.clientY - state.startY

    if (state.axis === 'none') {
      if (Math.abs(deltaX) < DRAG_THRESHOLD_PX && Math.abs(deltaY) < DRAG_THRESHOLD_PX) return
      state.axis = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical'
      if (state.axis === 'horizontal') {
        event.currentTarget.setPointerCapture(event.pointerId)
      }
    }

    if (state.axis !== 'horizontal') return

    const elapsed = event.timeStamp - state.lastTime
    if (elapsed > 0) {
      const sample = ((event.clientX - state.lastX) / elapsed) * 1000
      // Smoothed over a short window: a single frame's delta is far too noisy to
      // throw the drawer with.
      const weight = Math.min(elapsed / VELOCITY_WINDOW_MS, 1)
      state.velocity = state.velocity * (1 - weight) + sample * weight
      state.lastX = event.clientX
      state.lastTime = event.timeStamp
    }

    const width = event.currentTarget.offsetWidth
    const next = state.startOffset + deltaX

    if (next < 0) {
      // Past the open stop the panel gives instead of travelling, so the right
      // edge never lifts off the screen and nothing shows through behind it.
      paint(0)
      // rubberband saturates at the dimension it is given, so the dimension here
      // is the stretch budget itself rather than the panel width.
      paintStretch(rubberband(-next, MAX_OVERSHOOT_STRETCH * width) / width)
      return
    }

    paintStretch(0)
    paint(Math.min(next, width))
  }

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const state = drag.current
    if (state?.pointerId !== event.pointerId) return
    drag.current = null

    if (state.axis !== 'horizontal') return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    releaseStretch()

    const width = event.currentTarget.offsetWidth
    const projected = offset.current + projectMomentum(state.velocity)

    if (projected > width / 2) {
      // setOpen re-runs the effect above, which starts the spring from the
      // current offset and picks the release velocity up from the ref.
      releaseVelocity.current = state.velocity
      setOpen(false)
    } else {
      settle(0, state.velocity)
    }
  }

  const outsideRef = useOutsideClick((event: MouseEvent) => {
    const toggle = document.getElementById('main-navigation-toggle')
    if (toggle && (event.target === toggle || toggle.contains(event.target as Node))) {
      return
    }
    close()
  })

  const attachNav = useCallback(
    (node: HTMLElement | null) => {
      navRef.current = node
      outsideRef.current = node
    },
    [outsideRef],
  )

  const navContent = (
    <>
      <div
        className="fixed inset-0 bg-grey-900 z-[55] lg:hidden"
        style={{
          opacity: 'calc(0.6 * var(--drawer-progress, 0))',
          pointerEvents: open ? 'auto' : 'none',
        }}
        onClick={close}
        aria-hidden="true"
      />
      <nav
        id="main-navigation"
        ref={attachNav}
        aria-label={t('nav.ariaLabel')}
        inert={isMobile && !open}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="main-navigation touch-pan-y fixed top-[calc(0.5rem+env(safe-area-inset-top))] bottom-[calc(0.5rem+env(safe-area-inset-bottom))] right-0 flex flex-col overflow-y-auto overscroll-contain px-4 w-[70vw] z-[60] bg-grey-900 max-w-100 rounded-tl-2xl rounded-bl-2xl shadow-main-nav md:px-6 lg:block lg:overflow-visible lg:relative lg:inset-y-auto lg:right-auto lg:bg-transparent lg:shadow-none lg:w-auto lg:max-w-none lg:z-auto"
      >
        <ul className="pt-[min(5rem,9vh)] text-white md:pt-24 lg:pt-0 lg:text-grey-900 lg:flex lg:gap-x-6 xl:gap-x-8 2xl:gap-x-10 lg:justify-center lg:items-center">
          {entries.map((entry) =>
            'items' in entry ? (
              <NavGroupItem key={entry.id} {...entry} onClick={close} />
            ) : (
              <NavItem key={entry.href} {...entry} onClick={close} />
            ),
          )}
          <li>
            <a
              href={demoHref}
              aria-label="demo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-x-4 rounded-2xl w-max font-semibold px-5 py-2 group cursor-pointer transition-all ease-out duration-200 text-white bg-green-dark-900 hover:bg-green-light-900 hover:shadow-lg hover:shadow-green-light-900/40 hover:-translate-y-0.5 active:bg-green-light-900 active:translate-y-0 active:scale-[0.97] active:duration-75 lg:gap-x-2 lg:px-4 lg:py-1.5 lg:text-sm"
            >
              <span className="whitespace-nowrap">{t('nav.tryNow')}</span>
              <Icon
                path={ARROW_PATH}
                className="w-6 transition-all ease-in-out duration-300 group-hover:translate-x-2 lg:w-4 lg:group-hover:translate-x-0.5"
              />
            </a>
          </li>
          <li className="mt-4 lg:mt-0 lg:border-l lg:border-grey-900/15 lg:pl-4" onClick={close}>
            {children}
          </li>
        </ul>

        <ul className="mt-auto pt-6 pb-6 text-white flex flex-wrap gap-x-5 items-center text-sm md:pb-10 md:text-base lg:hidden">
          <li>
            <a
              href={imprintHref}
              onClick={close}
              className="transition-opacity ease-out duration-150 hover:opacity-75 active:opacity-60"
            >
              {t('nav.imprint')}
            </a>
          </li>
          <li>
            <a
              href={privacyHref}
              onClick={close}
              className="transition-opacity ease-out duration-150 hover:opacity-75 active:opacity-60"
            >
              {t('nav.privacy')}
            </a>
          </li>
        </ul>
      </nav>
    </>
  )

  return (
    <>
      <button
        type="button"
        id="main-navigation-toggle"
        aria-expanded={open}
        aria-controls="main-navigation"
        aria-haspopup="menu"
        aria-label={t('header.openNavigation')}
        className="relative w-11 h-11 p-2.5 z-50 group cursor-pointer transition-transform ease-out duration-100 active:scale-90 lg:hidden"
        onClick={() => setOpen(!open)}
      >
        <span
          className={`block w-6 h-0.5 transition-all ease-out duration-200 ${open ? 'bg-white rotate-45 absolute' : 'bg-grey-900 mb-1'}`}
        />
        <span
          className={`block w-6 h-0.5 transition-all ease-out duration-200 ${open ? 'bg-white -rotate-45 absolute' : 'bg-grey-900 mb-1'}`}
        />
      </button>
      {isMobile ? createPortal(navContent, document.body) : navContent}
    </>
  )
}

export default function MainNavigation({ strings, ...props }: Props) {
  return (
    <TranslationProvider strings={strings}>
      <Navigation {...props} />
    </TranslationProvider>
  )
}
