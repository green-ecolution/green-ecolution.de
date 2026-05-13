import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Lottie from 'lottie-react'
import dashboardAnimation from '../../../json/dashboardAnimation.json'
import { useReducedMotion } from '../../hooks/useReducedMotion'

function useIntersectionObserver(threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}

function DashboardPreview() {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  const { ref, isVisible } = useIntersectionObserver()

  return (
    <section
      ref={ref}
      className="my-20 px-4 max-w-208 mx-auto md:px-6 lg:my-28 lg:max-w-screen-lg xl:my-36 xl:max-w-screen-xl"
    >
      {/* Header */}
      <article className="mb-10 lg:mb-14 lg:text-center">
        <div
          className={`inline-block mb-4 lg:mx-auto transition-all ${reducedMotion ? '' : 'duration-700'} ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <span className="text-xs font-semibold tracking-widest text-green-light-900 uppercase">
            {t('sections.dashboardPreview.label')}
          </span>
          <div className="h-0.5 w-12 bg-gradient-to-r from-green-light-900 to-transparent mt-1" />
        </div>

        <h2
          className={`font-lato font-bold text-2xl mb-4 lg:text-3xl text-grey-900 transition-all ${reducedMotion ? '' : 'duration-700'} ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: reducedMotion ? '0ms' : '150ms' }}
        >
          {t('sections.dashboardPreview.title.firstLine')}
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          {t('sections.dashboardPreview.title.secondLine')}
        </h2>

        <p
          className={`text-grey-600 leading-relaxed max-w-2xl lg:mx-auto transition-all ${reducedMotion ? '' : 'duration-700'} ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: reducedMotion ? '0ms' : '300ms' }}
        >
          {t('sections.dashboardPreview.description')}
        </p>
      </article>

      {/* Dashboard Screenshot */}
      <figure
        className={`relative transition-all ${reducedMotion ? '' : 'duration-1000'} ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{ transitionDelay: reducedMotion ? '0ms' : '450ms' }}
      >
        {/* Decorative background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-light-900/10 via-green-dark-900/5 to-transparent rounded-3xl blur-3xl scale-110" />

        {/* Screenshot container */}
        <div className="relative bg-white rounded-2xl lg:rounded-3xl shadow-xl border border-grey-900/10 overflow-hidden">
          {/* Browser-like top bar */}
          <div className="flex items-center gap-2 px-2 py-2 sm:px-4 sm:py-3 bg-grey-900/5 border-b border-grey-900/10">
            <div className="flex gap-1 sm:gap-1.5">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#f87171]" />
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#fbbf24]" />
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#4ade80]" />
            </div>
            <div className="flex-1 mx-2 sm:mx-4">
              <div className="h-5 sm:h-6 bg-grey-900/10 rounded-md max-w-md mx-auto flex items-center justify-center">
                <span className="text-[10px] sm:text-xs text-grey-600/60">
                  app.green-ecolution.de
                </span>
              </div>
            </div>
          </div>

          {/* Dashboard Image with Lottie Overlay */}
          <div className="relative overflow-hidden">
            <img
              src="/assets/images/releases/v0.1.0-dashboard.png"
              alt={t('sections.dashboardPreview.imageAlt')}
              className="w-full h-auto"
            />
            {/* Lottie animation overlay - hidden on mobile */}
            <div className="hidden md:block absolute top-[25%] right-[3%] w-[42%] pointer-events-none bg-white">
              <Lottie
                animationData={dashboardAnimation}
                autoplay={!reducedMotion && isVisible}
                loop={true}
              />
            </div>
          </div>
        </div>
      </figure>
    </section>
  )
}

export default DashboardPreview
