import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { governancePillars } from '../../../data/governancePillars'

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

function OpenSourceGovernance() {
  const reducedMotion = useReducedMotion()
  const { ref, isVisible } = useIntersectionObserver()

  return (
    <section ref={ref} className="relative overflow-hidden bg-[#1a2a16]">
      {/* Subtle noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Asymmetric decorative glows */}
      <div className="absolute top-0 right-1/4 w-[40rem] h-[20rem] bg-green-dark-900/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[25rem] h-[15rem] bg-green-middle-900/10 rounded-full blur-3xl translate-y-1/3" />

      <div className="relative z-10 max-w-208 mx-auto px-4 py-20 md:px-6 lg:py-28 lg:max-w-screen-lg xl:py-36 xl:max-w-screen-xl">
        {/* Header */}
        <div className="mb-10 lg:mb-14">
          <div
            className={`inline-block mb-6 transition-all ${reducedMotion ? '' : 'duration-700'} ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <span className="text-xs font-semibold tracking-widest text-green-light-900 uppercase">
              Governance
            </span>
            <div className="h-0.5 w-12 bg-gradient-to-r from-green-light-900 to-transparent mt-1" />
          </div>

          <h2
            className={`font-lato font-bold text-2xl mb-4 text-white lg:text-3xl xl:text-4xl transition-all ${reducedMotion ? '' : 'duration-700'} ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: reducedMotion ? '0ms' : '100ms' }}
          >
            Open Source als Prinzip
          </h2>

          <p
            className={`text-white/60 leading-relaxed max-w-2xl transition-all ${reducedMotion ? '' : 'duration-700'} ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: reducedMotion ? '0ms' : '200ms' }}
          >
            Transparenz, Unabhängigkeit und Nachnutzbarkeit: die Grundpfeiler unserer
            Open-Source-Strategie.
          </p>
        </div>

        {/* 3×2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {governancePillars.map((pillar, index) => {
            const Icon = pillar.icon

            // Mobile (1 col): top border on every item except first
            // md (2 cols): top border on row 2+ (index >= 2), left border on right column (index % 2 !== 0)
            // lg (3 cols): top border on row 2 (index >= 3), left border on non-first columns (index % 3 !== 0)
            const borderClasses = [
              // Mobile (1 col): only top borders
              index > 0 ? 'border-t border-white/10' : '',
              // md (2 cols): left border on right column
              index % 2 !== 0 ? 'md:border-l md:border-white/10' : '',
              // lg (3 cols): reset top for first row, add left for col 2+3
              index < 3 ? 'lg:border-t-0' : '',
              index % 3 !== 0 ? 'lg:border-l lg:border-white/10' : '',
              index % 3 === 0 && index >= 3 ? 'lg:border-l-0' : '',
            ].join(' ')

            return (
              <article
                key={pillar.category}
                className={`group p-6 lg:p-8 transition-all hover:bg-white/[0.03] ${reducedMotion ? '' : 'duration-700'} ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                } ${borderClasses}`}
                style={{
                  transitionDelay: reducedMotion ? '0ms' : `${300 + index * 100}ms`,
                }}
              >
                <div className="mb-4 w-10 h-10 rounded-lg bg-green-dark-900/60 flex items-center justify-center transition-colors group-hover:bg-green-dark-900">
                  <Icon className="w-5 h-5 text-green-light-900" />
                </div>

                <span className="text-xs font-semibold tracking-widest uppercase text-green-light-900/70 mb-2 block">
                  {pillar.category}
                </span>

                <h3 className="font-lato font-bold text-white mb-2 tracking-wide">
                  {pillar.title}
                </h3>

                <p className="text-white/50 text-sm leading-relaxed">{pillar.description}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default OpenSourceGovernance
