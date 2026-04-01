import { useEffect, useRef, useState } from 'react'
import { Splide, SplideSlide } from '@splidejs/react-splide'
import { i18nTranslated } from '../../helper/sliderTranslations'
import '@splidejs/react-splide/css'
import StakeholderCard from '../cards/StakeholderCard'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface StakeholderProps {
  hasDesktopList?: boolean
}

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

const Stakeholder: React.FC<StakeholderProps> = ({ hasDesktopList = false }) => {
  const reducedMotion = useReducedMotion()
  const { ref, isVisible } = useIntersectionObserver()

  const stakeholder = [
    {
      label: 'PROGEEK GmbH',
      role: 'Technischer Partner',
      url: 'https://progeek.de/',
      image: '/assets/images/logo/progeek.svg',
      description:
        'PROGEEK steht für innovative IT-Lösungen, individuelle Softwareentwicklung und digitale Beratung – mit dem Ziel, Unternehmen auf ihrem Weg in die Zukunft der Digitalisierung zu begleiten.',
    },
    {
      label: 'Smarte Grenzregion',
      role: 'Projektkoordinator',
      url: 'https://smarte-grenzregion.de/',
      image: '/assets/images/logo/smarte-grenzregion.png',
      description:
        'Das Projekt „Smarte Grenzregion zwischen den Meeren" will die digitale Transformation in der Region vorantreiben, um eine integrierte und nachhaltige Stadt- und Regionalentwicklung zu gestalten und das Gemeinwohl zu stärken.',
    },
    {
      label: 'Hochschule Flensburg',
      role: 'Initiator',
      url: 'https://hs-flensburg.de/',
      image: '/assets/images/logo/hochschule-flensburg.png',
      description:
        'Die Hochschule Flensburg bietet praxisnahe Studiengänge mit Fokus auf angewandte Forschung und enge Zusammenarbeit mit der Industrie an.',
    },
    {
      label: 'TBZ Flensburg',
      role: 'Anwendungspartner',
      url: 'https://www.tbz-flensburg.de/',
      image: '/assets/images/logo/tbz.png',
      description:
        'Das Technische Betriebszentrum (TBZ) ist der zentrale Dienstleister für die Stadt Flensburg und u.a. für die Pflege öffentlicher Grünflächen, Straßenreinigung sowie Abfallwirtschaft zuständig.',
    },
  ]

  const breakpoints = {
    1024: {
      destroy: true,
    },
  }

  return (
    <section
      ref={ref}
      className={`max-w-208 mx-auto pt-20 mb-28 lg:pt-28 lg:mb-36 xl:pt-36 xl:mb-52 ${
        hasDesktopList ? 'lg:max-w-screen-lg xl:max-w-screen-xl' : ''
      }`}
    >
      {/* Section Label */}
      <div
        className={`
          px-4 md:px-6 mb-6 lg:mb-8
          transition-all ${reducedMotion ? '' : 'duration-700'}
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          ${hasDesktopList ? 'lg:text-center' : ''}
        `}
      >
        <div className={`inline-block ${hasDesktopList ? 'lg:mx-auto' : ''}`}>
          <span className="text-xs font-semibold tracking-widest text-green-light-900 uppercase">
            Partner & Beteiligte
          </span>
          <div
            className={`h-0.5 w-12 bg-gradient-to-r from-green-light-900 to-transparent mt-1 ${hasDesktopList ? 'lg:mx-auto' : ''}`}
          />
        </div>
      </div>

      {/* Header */}
      <article className={`px-4 mb-10 md:px-6 lg:mb-14 ${hasDesktopList ? 'lg:text-center' : ''}`}>
        <h2
          className={`
            font-lato font-bold text-2xl mb-4 text-grey-900 lg:text-3xl xl:text-4xl
            transition-all ${reducedMotion ? '' : 'duration-700'}
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{ transitionDelay: reducedMotion ? '0ms' : '100ms' }}
        >
          Wer sind die Beteiligten?
        </h2>
        <p
          className={`
            text-grey-900/70 leading-relaxed max-w-3xl ${hasDesktopList ? 'lg:mx-auto' : ''}
            transition-all ${reducedMotion ? '' : 'duration-700'}
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{ transitionDelay: reducedMotion ? '0ms' : '200ms' }}
        >
          In Zusammenarbeit zwischen PROGEEK, der Smarten-Grenzregion, der Stadt Flensburg und der
          Hochschule Flensburg soll eine bedarfsgerechte und datenbasierte Bewässerung für Bäume
          aufgebaut werden.
        </p>
      </article>

      {/* Carousel/Grid */}
      <div
        className={`
          transition-all ${reducedMotion ? '' : 'duration-700'}
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
            ...(hasDesktopList && { breakpoints: breakpoints }),
            reducedMotion: { speed: 0, rewindSpeed: 0 },
          }}
          aria-label="Beteiligten am Projekt"
        >
          {stakeholder.map((company, index) => (
            <SplideSlide key={company.label} className="pb-10 px-4 md:px-6">
              <StakeholderCard
                label={company.label}
                role={company.role}
                url={company.url}
                image={company.image}
                hasDesktopList={hasDesktopList}
                index={index}
                isVisible={isVisible}
                reducedMotion={reducedMotion}
              >
                <p className="my-4 md:my-5 text-grey-900/80 leading-relaxed">
                  {company.description}
                </p>
              </StakeholderCard>
            </SplideSlide>
          ))}
        </Splide>
      </div>
    </section>
  )
}

export default Stakeholder
