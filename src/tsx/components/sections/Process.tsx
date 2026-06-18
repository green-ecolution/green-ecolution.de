import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { workflowSteps } from '../../../data/workflowSteps'
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

const stepDetails: string[][] = [
  [
    'sections.process.stepDetails.sensor.depths',
    'sections.process.stepDetails.sensor.measurements',
    'sections.process.stepDetails.sensor.transmission',
    'sections.process.stepDetails.sensor.installation',
  ],
  [
    'sections.process.stepDetails.dashboard.trafficLight',
    'sections.process.stepDetails.dashboard.prioritization',
    'sections.process.stepDetails.dashboard.timelines',
    'sections.process.stepDetails.dashboard.kpis',
  ],
  [
    'sections.process.stepDetails.routing.planning',
    'sections.process.stepDetails.routing.capacity',
    'sections.process.stepDetails.routing.restrictions',
    'sections.process.stepDetails.routing.export',
  ],
]

function Process() {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  const { ref, isVisible } = useIntersectionObserver()

  return (
    <section
      id="process"
      ref={ref}
      className="max-w-208 mx-auto my-20 px-4 md:px-6 lg:my-28 lg:max-w-screen-lg xl:my-36 xl:max-w-screen-xl"
    >
      {/* Header */}
      <div className="mb-10 lg:mb-16">
        <div
          className={`inline-block mb-6 ${reducedMotion ? '' : 'transition-all duration-700'} ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <span className="text-xs font-semibold tracking-widest text-green-light-900 uppercase">
            {t('sections.process.label')}
          </span>
          <div className="h-0.5 w-12 bg-gradient-to-r from-green-light-900 to-transparent mt-1" />
        </div>

        <h2
          className={`font-lato font-bold text-2xl text-grey-900 mb-4 lg:text-3xl xl:text-4xl ${reducedMotion ? '' : 'transition-all duration-700'} ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: reducedMotion ? '0ms' : '100ms' }}
        >
          {t('sections.process.title')}
        </h2>

        <p
          className={`text-grey-900/70 leading-relaxed max-w-2xl ${reducedMotion ? '' : 'transition-all duration-700'} ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: reducedMotion ? '0ms' : '200ms' }}
        >
          {t('sections.process.description')}
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-12 lg:space-y-0">
        {workflowSteps.map((step, index) => {
          const Icon = step.icon
          const details = stepDetails[index]
          const isEven = index % 2 === 0

          return (
            <div
              key={step.title}
              className={`lg:grid lg:grid-cols-2 lg:gap-12 xl:gap-16 lg:items-start ${
                !isEven ? 'lg:direction-rtl' : ''
              } ${index > 0 ? 'lg:pt-12 lg:border-t lg:border-grey-900/10' : ''} ${reducedMotion ? '' : 'transition-all duration-700'} ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{
                transitionDelay: reducedMotion ? '0ms' : `${300 + index * 200}ms`,
              }}
            >
              {/* Text side */}
              <div className={`mb-8 lg:mb-0 ${!isEven ? 'lg:order-2 lg:text-left' : ''}`}>
                <div className="flex items-center gap-3 mb-4">
                  <Icon className="w-6 h-6 text-green-dark-900/50" />
                  <span className="text-xs font-semibold tracking-widest uppercase text-green-dark-900/60">
                    {step.number} · {t(step.category)}
                  </span>
                </div>

                <h3 className="font-lato font-bold text-2xl text-grey-900 mb-3 lg:text-3xl">
                  {t(step.title)}
                </h3>

                <p className="text-grey-900/70 leading-relaxed mb-6 lg:text-lg">
                  {t(step.description)}
                </p>
              </div>

              {/* Details side */}
              <div className={`${!isEven ? 'lg:order-1' : ''}`}>
                <div className="bg-green-light-100/50 rounded-2xl p-5 md:p-6 lg:p-8">
                  <ul className="space-y-3">
                    {details.map((detail) => (
                      <li key={detail} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-dark-900/40 mt-2 flex-shrink-0" />
                        <span className="text-sm text-grey-900/70 leading-relaxed">
                          {t(detail)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default Process
