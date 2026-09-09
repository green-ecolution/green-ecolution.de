import { useState, useEffect, useCallback, useRef } from 'react'
import { useT } from '../../../i18n/useT'
import { useDialogFocus } from '../../../hooks/useDialogFocus'
import { splitSlot } from '../../../lib/slotText'
import Arrow from '../Arrow'
import HomepageOverlayIcons from './HomepageOverlayIcons'
import WelcomeCard from './WelcomeCard'

type PopupId = 'moisture' | 'transmission' | 'recommendation'

interface Popup {
  id: PopupId
}

interface HomepageOverlayProps {
  language: string
  initialLoad: boolean
  isOverlayVisible: boolean
  onClose: () => void
}

const popups: Popup[] = [{ id: 'moisture' }, { id: 'transmission' }, { id: 'recommendation' }]

const HomepageOverlay: React.FC<HomepageOverlayProps> = ({
  language,
  initialLoad,
  isOverlayVisible,
  onClose,
}) => {
  const t = useT()
  // Replaces the Trans slot: the catalog keeps a neutral <Link> marker.
  const recommendation = splitSlot(t('overlay.popups.recommendation.description'), 'Link')
  const [currentPopupIndex, setCurrentPopupIndex] = useState(0)
  const [isPopupVisible, setIsPopupVisible] = useState(false)
  const dialogRef = useRef<HTMLElement>(null)
  const nextButtonRef = useRef<HTMLButtonElement>(null)
  const currentPopup = popups[currentPopupIndex]
  const delay = 1500

  const startTimer = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(callback, delay)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (initialLoad) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset state on visibility change
    setCurrentPopupIndex(0)
    return startTimer(() => setIsPopupVisible(true), delay)
  }, [isOverlayVisible, initialLoad, delay, startTimer])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset state on visibility change
    if (!isOverlayVisible) setIsPopupVisible(false)
  }, [isOverlayVisible])

  const handleNextClick = () => {
    if (currentPopupIndex < popups.length - 1) {
      setCurrentPopupIndex(currentPopupIndex + 1)
    } else {
      onClose()
    }
  }

  const handleStartAnimation = () => {
    if (isOverlayVisible) {
      return startTimer(() => setIsPopupVisible(true), delay)
    }
  }

  useEffect(() => {
    if (!isOverlayVisible) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOverlayVisible, onClose])

  useDialogFocus(dialogRef, isOverlayVisible)

  // The welcome card goes inert the moment the popups take over, so whoever was
  // on its button would be left with focus on nothing.
  useEffect(() => {
    if (
      isPopupVisible &&
      isOverlayVisible &&
      !dialogRef.current?.contains(document.activeElement)
    ) {
      nextButtonRef.current?.focus()
    }
  }, [isPopupVisible, isOverlayVisible])

  return (
    // Closed it keeps its box so the fade can run, which would otherwise leave
    // three invisible buttons in the tab order; inert takes them back out.
    <section
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={t('overlay.ariaLabel')}
      inert={!isOverlayVisible}
      className={`hidden fixed inset-0 xl:block ${isOverlayVisible ? 'z-[100]' : '-z-10'}`}
    >
      {/* Layered background. Dismissing by clicking it is a pointer shortcut for
          the close button, so it stays out of the accessibility tree. */}
      <div
        aria-hidden="true"
        onClick={onClose}
        data-scrim
        className={`
          absolute inset-0 bg-grey-900
          transition-opacity duration-700
          ${isOverlayVisible ? 'opacity-90' : 'opacity-0'}
        `}
      />

      {/* Organic gradient overlay */}
      <div
        className={`
          absolute inset-0 pointer-events-none
          transition-opacity duration-1000
          ${isOverlayVisible ? 'opacity-100' : 'opacity-0'}
        `}
        style={{
          background: `
            radial-gradient(ellipse at 20% 80%, rgba(76, 119, 65, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(101, 152, 88, 0.2) 0%, transparent 40%)
          `,
        }}
      />

      <div className="relative mx-auto h-screen w-screen max-w-screen-3xl">
        <WelcomeCard
          handleStartAnmiation={handleStartAnimation}
          onClose={onClose}
          delay={delay}
          isOverlayVisible={isOverlayVisible}
        />

        <article
          inert={!(isPopupVisible && isOverlayVisible)}
          className={`
            absolute top-1/2 -translate-y-2/3 right-[15%]
            transition-all duration-500
            ${isPopupVisible && isOverlayVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
          `}
          style={{ transitionDelay: isPopupVisible && isOverlayVisible ? '500ms' : '0ms' }}
        >
          <div className="relative">
            {/* Glow effect behind card */}
            <div
              className="absolute -inset-4 bg-green-light-900/20 rounded-3xl blur-xl"
              style={{ transform: 'scale(0.9)' }}
            />

            {/* Main card */}
            <div
              data-material
              className="relative bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl p-6 border border-green-light-900/10 w-[22.5rem] 2xl:p-8 2xl:w-[32rem]"
            >
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-4">
                {popups.map((popup, i) => (
                  <div
                    key={popup.id}
                    className={`
                      h-1.5 rounded-full transition-all duration-300
                      ${
                        i === currentPopupIndex
                          ? 'w-8 bg-green-dark-900'
                          : i < currentPopupIndex
                            ? 'w-3 bg-green-light-900'
                            : 'w-3 bg-grey-100'
                      }
                    `}
                  />
                ))}
                <span className="ml-auto text-xs text-grey-900/60 font-medium">
                  {currentPopupIndex + 1}/{popups.length}
                </span>
              </div>

              {/* Content */}
              <h2 className="font-lato font-bold text-xl text-grey-900 mb-3 2xl:text-2xl">
                {t(`overlay.popups.${currentPopup.id}.label`)}
              </h2>
              <p className="text-grey-900/80 leading-relaxed mb-6">
                {currentPopup.id === 'recommendation' ? (
                  <>
                    {recommendation.before}
                    <a
                      href={`/${language}/project#vorteile`}
                      className="text-green-dark-900 font-semibold underline underline-offset-2 transition-all ease-in-out duration-300 hover:text-green-light-900"
                    >
                      {recommendation.inner}
                    </a>
                    {recommendation.after}
                  </>
                ) : (
                  t(`overlay.popups.${currentPopup.id}.description`)
                )}
              </p>

              {/* Enhanced button */}
              <button
                type="button"
                ref={nextButtonRef}
                className="
                  flex items-center justify-center gap-x-3 rounded-xl w-full
                  font-semibold px-5 py-3 group cursor-pointer
                  bg-gradient-to-r from-green-dark-900 to-green-middle-900
                  text-white shadow-lg shadow-green-dark-900/20
                  transition-all ease-out duration-200
                  hover:shadow-xl hover:gap-x-4
                  active:scale-[0.97] active:duration-75
                "
                onClick={handleNextClick}
              >
                <span>
                  {currentPopupIndex < popups.length - 1
                    ? t('overlay.next')
                    : t('overlay.discover')}
                </span>
                <Arrow classes="w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>

            {/* Close button */}
            <button
              type="button"
              aria-label={t('overlay.closeAriaLabel')}
              onClick={onClose}
              className="
                absolute -right-3 -top-3
                w-10 h-10 rounded-full cursor-pointer
                bg-white shadow-lg border border-grey-100
                flex items-center justify-center
                text-grey-900/60
                transition-all ease-out duration-200
                hover:bg-green-light-100 hover:text-green-dark-900 hover:scale-110
                active:scale-95 active:duration-75
              "
            >
              <svg
                className="w-5 h-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </article>

        <HomepageOverlayIcons
          areIconsVisible={isPopupVisible && isOverlayVisible}
          index={currentPopupIndex}
          delay={delay}
        />
      </div>
    </section>
  )
}

export default HomepageOverlay
