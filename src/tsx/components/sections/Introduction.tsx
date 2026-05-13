import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  const { ref, isVisible } = useIntersectionObserver()
  const facts = [
    {
      label: t('sections.introduction.facts.sensor.label'),
      icon: '/assets/svg/general/sensor.svg',
      description: t('sections.introduction.facts.sensor.description'),
    },
    {
      label: t('sections.introduction.facts.evaluation.label'),
      icon: '/assets/svg/general/statistics.svg',
      description: t('sections.introduction.facts.evaluation.description'),
    },
    {
      label: t('sections.introduction.facts.youngTrees.label'),
      icon: '/assets/svg/general/tree.svg',
      description: t('sections.introduction.facts.youngTrees.description'),
    },
    {
      label: t('sections.introduction.facts.locations.label'),
      icon: '/assets/svg/general/location.svg',
      description: t('sections.introduction.facts.locations.description'),
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
              {t('sections.introduction.label')}
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
          {t('sections.introduction.title')}
        </h2>
        <p
          className={`
            text-grey-900/80 leading-relaxed
            ${reducedMotion ? '' : 'transition-all duration-700'}
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{ transitionDelay: reducedMotion ? '0ms' : '200ms' }}
        >
          {t('sections.introduction.description')}
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
          aria-label={t('sections.introduction.carouselAriaLabel')}
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
