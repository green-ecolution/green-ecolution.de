import { useState, useEffect } from 'react'
import Arrow from '../../icons/Arrow'
import HomepageOverlay from './HomepageOverlay'
import HomepageHeroTrees from './HomepageHeroTrees'
import {
  setInitialLoad as setInitialLoadHelper,
  isInitialLoad as isInitialLoadHelper,
} from '../../helper/storage'
import { useReducedMotion } from '../../hooks/useReducedMotion'

function HomepageHero() {
  const [isOverlayVisible, setIsOverlayVisible] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- trigger animation on mount
    setIsVisible(true)
  }, [])

  const handleOpenOverlay = () => {
    setIsOverlayVisible(true)
  }

  const handleCloseOverlay = () => {
    setIsOverlayVisible(false)

    if (isInitialLoad) {
      setIsInitialLoad(false)
      setInitialLoadHelper()
    }
  }

  const bodyLock = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    document.body.classList.add('overflow-hidden')
  }

  useEffect(() => {
    const handleResize = () => {
      if (window.matchMedia('(max-width: 1279px)').matches) {
        setIsOverlayVisible(false)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    if (isOverlayVisible) {
      bodyLock()
    } else {
      document.body.classList.remove('overflow-hidden')
    }
    return () => {
      document.body.classList.remove('overflow-hidden')
    }
  }, [isOverlayVisible])

  useEffect(() => {
    if (
      isInitialLoadHelper() &&
      !isOverlayVisible &&
      window.matchMedia('(min-width: 1280px)').matches
    ) {
      // Skip animation entirely when reduced motion is preferred
      if (reducedMotion) {
        setInitialLoadHelper()
        return
      }

      // eslint-disable-next-line react-hooks/set-state-in-effect -- set initial load state
      setIsInitialLoad(true)
      bodyLock()

      const timer = setTimeout(() => {
        setIsOverlayVisible(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isOverlayVisible, reducedMotion])

  return (
    <section>
      <div className="overflow-hidden relative mx-auto w-screen h-screen max-w-screen-3xl pointer-events-none before:bg-background-yellow-dot before:bg-cover before:w-4/5 before:h-[100vh] before:max-h-[45rem] before:absolute before:-right-4 before:bottom-0 before:-z-50 before:bg-no-repeat sm:before:-right-10 md:before:max-h-[70rem] 2xl:before:right-0 2xl:before:bg-contain">
        {/* Organic gradient blob */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/4 -left-20 w-[40rem] h-[40rem] opacity-30"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(172, 182, 59, 0.4) 0%, transparent 70%)',
              filter: 'blur(60px)',
              transform: 'rotate(-15deg)',
            }}
          />
        </div>

        <article
          className={`pointer-events-auto max-w-208 mx-auto px-4 pt-28 mb-8 md:px-6 lg:mb-14 lg:pt-36 lg:max-w-screen-lg xl:max-w-screen-xl xl:pt-44
            ${reducedMotion ? '' : 'transition-all duration-500'}
            ${isOverlayVisible ? 'xl:opacity-0 xl:pointer-events-none' : ''}`}
        >
          <div className="max-w-[30rem] 2xl:max-w-[40rem]">
            {/* Animated label */}
            <div
              className={`
                inline-flex items-center gap-2 px-3 py-1.5 mb-6
                bg-green-light-100 rounded-full border border-green-light-900/20
                ${reducedMotion ? '' : 'transition-all duration-700'}
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}
            >
              <span className="w-2 h-2 bg-green-light-900 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-green-dark-900 tracking-wide uppercase">
                Smart Irrigation
              </span>
            </div>

            {/* Headline with stagger */}
            <h1
              className={`
                font-lato font-bold text-2xl mb-6 text-grey-900 lg:text-4xl xl:text-5xl
                ${reducedMotion ? '' : 'transition-all duration-700'}
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}
              style={{ transitionDelay: reducedMotion ? '0ms' : '150ms' }}
            >
              Wir ermöglichen{' '}
              <span className="relative inline-block">
                <span className="relative z-10">smarte Bewässerung</span>
                <span
                  className={`
                    absolute -bottom-1 left-0 h-3 bg-green-light-900/30 -z-0 rounded-xs
                    ${reducedMotion ? 'w-full' : 'transition-all duration-700 ease-out'}
                    ${isVisible ? 'w-full' : 'w-0'}
                  `}
                  style={{ transitionDelay: reducedMotion ? '0ms' : '600ms' }}
                />
              </span>{' '}
              von Grünflächen!
            </h1>

            {/* Motto tagline */}
            <p
              className={`
                mb-4 font-lato text-sm tracking-widest uppercase text-green-middle-900 lg:text-base
                ${reducedMotion ? '' : 'transition-all duration-700'}
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}
              style={{ transitionDelay: reducedMotion ? '0ms' : '250ms' }}
            >
              Messen. Verstehen. Handeln.
            </p>

            {/* Description with stagger */}
            <p
              className={`
                mb-6 text-grey-900/80 leading-relaxed lg:mb-8 lg:text-lg
                ${reducedMotion ? '' : 'transition-all duration-700'}
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}
              style={{ transitionDelay: reducedMotion ? '0ms' : '350ms' }}
            >
              Mittels sensorgestützter Überwachung von Grünflächen werden Daten über das
              LoRaWan-Netz übermittelt und ausgewertet, sodass Handlungsempfehlungen für die
              Bewässerung abgegeben werden können.
            </p>

            {/* Button with stagger */}
            <div
              className={`
                ${reducedMotion ? '' : 'transition-all duration-700'}
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}
              style={{ transitionDelay: reducedMotion ? '0ms' : '500ms' }}
            >
              <button
                type="button"
                className={`
                  hidden items-center justify-center gap-x-3 rounded-2xl w-max
                  font-semibold px-6 py-3 group cursor-pointer
                  bg-gradient-to-r from-green-dark-900 to-green-middle-900
                  text-white shadow-lg shadow-green-dark-900/25
                  transition-all duration-300
                  hover:shadow-xl hover:shadow-green-dark-900/30 hover:-translate-y-0.5
                  hover:gap-x-4
                  ${!isInitialLoadHelper() && !reducedMotion ? 'xl:flex' : ''}
                `}
                onClick={handleOpenOverlay}
              >
                <span>Animation abspielen</span>
                <Arrow classes="w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </article>

        <HomepageHeroTrees />
      </div>

      <HomepageOverlay
        initialLoad={isInitialLoad}
        isOverlayVisible={isOverlayVisible}
        onClose={handleCloseOverlay}
      />
    </section>
  )
}

export default HomepageHero
