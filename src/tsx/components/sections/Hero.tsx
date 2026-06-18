import React, { ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface HeroProps {
  headline: string
  description: string
  label?: string
  children?: ReactNode
}

const Hero: React.FC<HeroProps> = ({ headline, description, label, children }) => {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section className="mt-28 px-4 max-w-208 mx-auto md:px-6 lg:mt-36 lg:max-w-screen-lg xl:mt-52 xl:max-w-screen-xl">
      <div className="lg:text-center">
        {/* Section Label */}
        <div
          className={`inline-block mb-6 lg:mx-auto transition-all ${reducedMotion ? '' : 'duration-700'} ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <span className="text-xs font-semibold tracking-widest text-green-light-900 uppercase">
            {label ?? t('sections.hero.defaultLabel')}
          </span>
          <div className="h-0.5 w-12 bg-gradient-to-r from-green-light-900 to-transparent mt-1" />
        </div>

        {/* Headline */}
        <h1
          className={`font-lato font-bold text-3xl mb-6 text-grey-900 leading-tight
            md:text-4xl lg:text-5xl xl:text-6xl
            transition-all ${reducedMotion ? '' : 'duration-700'} ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          style={{ transitionDelay: reducedMotion ? '0ms' : '150ms' }}
        >
          {headline}
        </h1>

        {/* Description */}
        <p
          className={`text-grey-600 leading-relaxed max-w-3xl lg:mx-auto lg:text-lg
            transition-all ${reducedMotion ? '' : 'duration-700'} ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          style={{ transitionDelay: reducedMotion ? '0ms' : '300ms' }}
        >
          {description}
        </p>

        {/* Children with animation */}
        {children && (
          <div
            className={`mt-8 transition-all ${reducedMotion ? '' : 'duration-700'} ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: reducedMotion ? '0ms' : '450ms' }}
          >
            {children}
          </div>
        )}
      </div>
    </section>
  )
}

export default Hero
