import { useEffect, useRef, useState } from 'react'
import { Splide, SplideSlide } from '@splidejs/react-splide'
import { i18nTranslated } from '../../helper/sliderTranslations'
import '@splidejs/react-splide/css'
import IntroductionCard from '../cards/IntroductionCard'
import { useReducedMotion } from '../../hooks/useReducedMotion'

function useIntersectionObserver(threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)

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

function Introduction() {
  const reducedMotion = useReducedMotion()
  const { ref, isVisible } = useIntersectionObserver()
  const facts = [
    {
      label: 'Entwicklung einer Sensorlösung',
      icon: '/assets/svg/general/sensor.svg',
      description:
        'Daten zur Bodenfeuchte werden mithilfe von in unterschiedlicher Tiefe platzierten Sensoren geliefert.',
    },
    {
      label: 'Auswertung der Messdaten',
      icon: '/assets/svg/general/statistics.svg',
      description:
        'Auswertung der durch Sensoren übermittelten Daten für eine bedarfsgerechte Bewässerung von Jungbäumen.',
    },
    {
      label: 'Augenmerk auf Jungbäume',
      icon: '/assets/svg/general/tree.svg',
      description:
        'Jungbäume sind besonders hitzeanfällig und daher äußerst schutzbedürftig. Aus diesem Grund werden Bäume in deren ersten drei Standjahren überwacht.',
    },
    {
      label: 'Monitoring mehrerer Standorte',
      icon: '/assets/svg/general/location.svg',
      description:
        'Unter Verwendung des LoRaWan-Netzes können verschiedene Standorte überwacht und weitere einfach eingebunden werden.',
    },
  ]

  const breakpoints = {
    640: {
      perPage: 2,
    },
    1024: {
      destroy: true,
    },
  }

  return (
    <section
      ref={ref}
      className="max-w-208 mx-auto mt-36 mb-20 md:mt-40 lg:mt-16 lg:mb-0 lg:max-w-screen-lg lg:grid lg:grid-cols-[1fr_1.5fr] lg:gap-x-10 lg:items-center xl:grid-cols-2 xl:max-w-screen-xl"
    >
      <article className="px-4 mb-8 md:px-6 lg:mb-14">
        {/* Section Label */}
        <div
          className={`
            mb-6 lg:mb-8
            ${reducedMotion ? '' : 'transition-all duration-700'}
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          <div className="inline-block">
            <span className="text-xs font-semibold tracking-widest text-green-light-900 uppercase">
              Überblick
            </span>
            <div className="h-0.5 w-12 bg-gradient-to-r from-green-light-900 to-transparent mt-1" />
          </div>
        </div>

        <h2
          className={`
            font-lato font-bold text-2xl mb-6 text-grey-900 lg:text-3xl
            ${reducedMotion ? '' : 'transition-all duration-700'}
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{ transitionDelay: reducedMotion ? '0ms' : '100ms' }}
        >
          Was beinhaltet smartes Grünflächenmanagement?
        </h2>
        <p
          className={`
            text-grey-900/80 leading-relaxed
            ${reducedMotion ? '' : 'transition-all duration-700'}
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{ transitionDelay: reducedMotion ? '0ms' : '200ms' }}
        >
          Smartes Grünflächenmanagement umfasst die effiziente Überwachung und Bewässerung von
          Vegetation auf Grünflächen durch den Einsatz moderner Technologien wie Sensoren und
          Datenanalyse. Dadurch wird eine präzise Steuerung der Pflegemaßnahmen ermöglicht, die
          angepasst sind an die spezifischen Standortbedingungen.
        </p>
      </article>

      <div
        className={`
          ${reducedMotion ? '' : 'transition-all duration-700'}
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        `}
        style={{ transitionDelay: reducedMotion ? '0ms' : '300ms' }}
      >
        <Splide
          options={{
            rewind: true,
            arrows: false,
            i18n: i18nTranslated,
            mediaQuery: 'min',
            breakpoints: breakpoints,
            reducedMotion: { speed: 0, rewindSpeed: 0 },
          }}
          aria-label="Fakten zum Grünflächenmanagement"
          className="splide--grid md:px-2"
        >
          {facts.map((fact) => (
            <SplideSlide key={fact.label} className="pb-10 px-4 lg:px-2 lg:pb-2">
              <IntroductionCard
                label={fact.label}
                icon={fact.icon}
                description={fact.description}
              />
            </SplideSlide>
          ))}
        </Splide>
      </div>
    </section>
  )
}

export default Introduction
