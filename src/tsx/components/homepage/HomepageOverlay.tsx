import { useState, useEffect, useCallback } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import Arrow from '../../icons/Arrow'
import HomepageOverlayIcons from './HomepageOverlayIcons'
import WelcomeCard from '../cards/WelcomeCard'

interface Popup {
  label: string
  shortName: string
  description: React.ReactNode
}

interface HomepageOverlayProps {
  initialLoad: boolean
  isOverlayVisible: boolean
  onClose: () => void
}

const HomepageOverlay: React.FC<HomepageOverlayProps> = ({
  initialLoad,
  isOverlayVisible,
  onClose,
}) => {
  const [currentPopupIndex, setCurrentPopupIndex] = useState(0)
  const [isPopupVisible, setIsPopupVisible] = useState(false)
  const { t } = useTranslation()
  const delay = 1500

  const popups: Popup[] = [
    {
      label: t('homepageOverlay.popups.irrigationStatus.label'),
      shortName: 'Bewässerungszustand',
      description: <>{t('homepageOverlay.popups.irrigationStatus.description')}</>,
    },
    {
      label: t('homepageOverlay.popups.dataTransmission.label'),
      shortName: 'Datenübertragung',
      description: <>{t('homepageOverlay.popups.dataTransmission.description')}</>,
    },
    {
      label: t('homepageOverlay.popups.recommendations.label'),
      shortName: 'Handlungsempfehlungen',
      description: (
        <>
          {t('homepageOverlay.popups.recommendations.description')}&nbsp;
          <Link
            to="/project"
            hash="vorteile"
            className="text-green-dark-900 font-semibold underline underline-offset-2 transition-all ease-in-out duration-300 hover:text-green-light-900"
          >
            {t('homepageOverlay.popups.recommendations.link')}
          </Link>
        </>
      ),
    },
  ]

  const currentPopup = popups[currentPopupIndex]

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

  return (
    <section className={`hidden fixed inset-0 xl:block ${isOverlayVisible ? 'z-[100]' : '-z-10'}`}>
      {/* Layered background */}
      <div
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
            <div className="relative bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl p-6 border border-green-light-900/10 w-[22.5rem] 2xl:p-8 2xl:w-[32rem]">
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-4">
                {popups.map((popup, i) => (
                  <div
                    key={popup.shortName}
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
                {currentPopup.label}
              </h2>
              <p className="text-grey-900/80 leading-relaxed mb-6">{currentPopup.description}</p>

              {/* Enhanced button */}
              <button
                type="button"
                className="
                  flex items-center justify-center gap-x-3 rounded-xl w-full
                  font-semibold px-5 py-3 group cursor-pointer
                  bg-gradient-to-r from-green-dark-900 to-green-middle-900
                  text-white shadow-lg shadow-green-dark-900/20
                  transition-all duration-300
                  hover:shadow-xl hover:gap-x-4
                "
                onClick={handleNextClick}
              >
                <span>
                  {currentPopupIndex < popups.length - 1
                    ? t('homepageOverlay.button.next')
                    : t('homepageOverlay.button.discover')}
                </span>
                <Arrow classes="w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>

            {/* Close button */}
            <button
              type="button"
              aria-label={t('homepageOverlay.closeAriaLabel')}
              onClick={onClose}
              className="
                absolute -right-3 -top-3
                w-10 h-10 rounded-full cursor-pointer
                bg-white shadow-lg border border-grey-100
                flex items-center justify-center
                text-grey-900/60
                transition-all duration-300
                hover:bg-green-light-100 hover:text-green-dark-900 hover:scale-110
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
