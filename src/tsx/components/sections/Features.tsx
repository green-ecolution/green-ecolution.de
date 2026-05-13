import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  TreeDeciduous,
  Truck,
  ClipboardList,
  LayoutDashboard,
  Users,
  BarChart3,
} from 'lucide-react'
import { ReactNode } from 'react'
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

interface Feature {
  label: string
  icon: ReactNode
  description: string
  color: 'green-light' | 'green-dark' | 'green-middle'
  size?: 'default' | 'large'
}

const colorClasses = {
  'green-light': 'bg-green-light-900/10 hover:bg-green-light-900/15',
  'green-dark': 'bg-green-dark-900/10 hover:bg-green-dark-900/15',
  'green-middle': 'bg-green-middle-900/10 hover:bg-green-middle-900/15',
}

const borderClasses = {
  'green-light': 'border-green-light-900/20 hover:border-green-light-900/40',
  'green-dark': 'border-green-dark-900/20 hover:border-green-dark-900/40',
  'green-middle': 'border-green-middle-900/20 hover:border-green-middle-900/40',
}

const iconColorClasses = {
  'green-light': 'bg-green-light-900/20 text-green-light-900',
  'green-dark': 'bg-green-dark-900/20 text-green-dark-900',
  'green-middle': 'bg-green-middle-900/20 text-green-middle-900',
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div
      className={`
        group h-full rounded-xl p-4 md:rounded-2xl md:p-6 lg:p-8
        border ${borderClasses[feature.color]}
        transition-all duration-300
        hover:shadow-lg hover:-translate-y-0.5
        ${colorClasses[feature.color]}
      `}
    >
      <figure
        className={`
          w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl
          flex items-center justify-center mb-3 md:mb-4
          transition-all duration-300
          group-hover:scale-105
          ${iconColorClasses[feature.color]}
        `}
      >
        <span className="[&>svg]:w-5 [&>svg]:h-5 md:[&>svg]:w-6 md:[&>svg]:h-6 lg:[&>svg]:w-8 lg:[&>svg]:h-8">
          {feature.icon}
        </span>
      </figure>
      <h3 className="font-lato font-bold text-base md:text-xl mb-1 md:mb-2 text-grey-900">
        {feature.label}
      </h3>
      <p className="text-grey-900/70 text-sm md:text-base leading-relaxed">{feature.description}</p>
    </div>
  )
}

function Features() {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  const { ref, isVisible } = useIntersectionObserver()

  const features: Feature[] = [
    {
      label: t('sections.features.items.dashboard.label'),
      icon: <LayoutDashboard />,
      description: t('sections.features.items.dashboard.description'),
      color: 'green-dark',
      size: 'large',
    },
    {
      label: t('sections.features.items.grouping.label'),
      icon: <TreeDeciduous />,
      description: t('sections.features.items.grouping.description'),
      color: 'green-light',
    },
    {
      label: t('sections.features.items.fleet.label'),
      icon: <Truck />,
      description: t('sections.features.items.fleet.description'),
      color: 'green-middle',
    },
    {
      label: t('sections.features.items.tourPlanning.label'),
      icon: <ClipboardList />,
      description: t('sections.features.items.tourPlanning.description'),
      color: 'green-middle',
    },
    {
      label: t('sections.features.items.team.label'),
      icon: <Users />,
      description: t('sections.features.items.team.description'),
      color: 'green-light',
    },
    {
      label: t('sections.features.items.analysis.label'),
      icon: <BarChart3 />,
      description: t('sections.features.items.analysis.description'),
      color: 'green-dark',
      size: 'large',
    },
  ]

  return (
    <section
      ref={ref}
      id="features"
      className="max-w-208 mx-auto my-20 px-4 md:px-6 lg:my-28 lg:max-w-screen-lg xl:my-36 xl:max-w-screen-xl"
    >
      {/* Section Label */}
      <div
        className={`
          text-center mb-6 lg:mb-8
          ${reducedMotion ? '' : 'transition-all duration-700'}
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
      >
        <div className="inline-block">
          <span className="text-xs font-semibold tracking-widest text-green-light-900 uppercase">
            {t('sections.features.label')}
          </span>
          <div className="h-0.5 w-12 bg-gradient-to-r from-green-light-900 to-transparent mt-1 mx-auto" />
        </div>
      </div>

      <article className="mb-8 lg:mb-14 text-center">
        <h2
          className={`
            font-lato font-bold text-2xl mb-4 text-grey-900 lg:text-3xl
            ${reducedMotion ? '' : 'transition-all duration-700'}
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{ transitionDelay: reducedMotion ? '0ms' : '100ms' }}
        >
          {t('sections.features.title')}
        </h2>
        <p
          className={`
            text-grey-900/70 max-w-2xl mx-auto leading-relaxed
            ${reducedMotion ? '' : 'transition-all duration-700'}
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{ transitionDelay: reducedMotion ? '0ms' : '200ms' }}
        >
          {t('sections.features.description')}
        </p>
      </article>

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4 lg:grid-rows-2">
        {features.map((feature, index) => (
          <div
            key={feature.label}
            className={`
              ${feature.size === 'large' ? 'col-span-2' : ''}
              ${index === 0 ? 'lg:row-span-1' : ''}
              ${reducedMotion ? '' : 'transition-all duration-700'}
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
            style={{ transitionDelay: reducedMotion ? '0ms' : `${300 + index * 100}ms` }}
          >
            <FeatureCard feature={feature} />
          </div>
        ))}
      </div>
    </section>
  )
}

export default Features
