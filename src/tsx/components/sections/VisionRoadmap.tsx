import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { roadmapItems } from '../../../data/roadmapItems'

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

const statusConfig = {
  completed: {
    dot: 'bg-green-dark-900',
    label: 'Abgeschlossen',
    labelColor: 'text-green-dark-900',
  },
  'in-progress': {
    dot: 'bg-green-light-900 animate-pulse',
    label: 'In Arbeit',
    labelColor: 'text-green-light-900',
  },
  planned: {
    dot: 'bg-grey-900/30',
    label: 'Geplant',
    labelColor: 'text-grey-600',
  },
}

function VisionRoadmap() {
  const reducedMotion = useReducedMotion()
  const { ref, isVisible } = useIntersectionObserver()

  return (
    <section
      ref={ref}
      className="px-4 max-w-208 mx-auto my-20 md:px-6 lg:my-28 lg:max-w-screen-lg xl:my-36 xl:max-w-screen-xl"
    >
      <div className="relative bg-green-light-100/50 rounded-2xl lg:rounded-3xl p-6 md:p-10 lg:p-12 xl:p-16 overflow-hidden">
        {/* Decorative organic shape */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-light-900/8 rounded-full blur-2xl" />
        <div className="lg:grid lg:grid-cols-[1.2fr_1fr] lg:gap-12 xl:gap-16">
          {/* Vision Text */}
          <div className="mb-10 lg:mb-0">
            {/* Section Label */}
            <div
              className={`inline-block mb-6 transition-all ${reducedMotion ? '' : 'duration-700'} ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <span className="text-xs font-semibold tracking-widest text-green-light-900 uppercase">
                Vision
              </span>
              <div className="h-0.5 w-12 bg-gradient-to-r from-green-light-900 to-transparent mt-1" />
            </div>

            <h2
              className={`font-lato font-bold text-2xl mb-6 text-grey-900 lg:text-3xl xl:text-4xl transition-all ${reducedMotion ? '' : 'duration-700'} ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: reducedMotion ? '0ms' : '100ms' }}
            >
              Für jede Kommune gemacht
            </h2>

            <div
              className={`space-y-4 transition-all ${reducedMotion ? '' : 'duration-700'} ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: reducedMotion ? '0ms' : '200ms' }}
            >
              <p className="text-grey-900/70 leading-relaxed">
                Die Plattform ist bewusst so gestaltet, dass sie in jeder Kommune eingesetzt werden
                kann. Kartenbereiche, Organisationsstrukturen und Bewässerungsregionen sind frei
                konfigurierbar.
              </p>
              <p className="text-grey-900/70 leading-relaxed">
                Es werden ausschließlich offene Standards und Open-Source-Komponenten verwendet.
                Cloud-native Architektur mit Kubernetes ermöglicht einen mandantenfähigen,
                hochverfügbaren Betrieb. Weitere Kommunen können leicht hinzugefügt werden.
              </p>
            </div>
          </div>

          {/* Roadmap Timeline */}
          <div>
            <h3
              className={`font-lato font-semibold text-sm tracking-wider uppercase text-grey-600 mb-6 transition-all ${reducedMotion ? '' : 'duration-700'} ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: reducedMotion ? '0ms' : '300ms' }}
            >
              Roadmap
            </h3>

            <div className="space-y-0">
              {roadmapItems.map((item, index) => {
                const config = statusConfig[item.status]
                const isLast = index === roadmapItems.length - 1

                return (
                  <div
                    key={item.title}
                    className={`group relative flex gap-4 transition-all ${reducedMotion ? '' : 'duration-700'} ${
                      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                    }`}
                    style={{
                      transitionDelay: reducedMotion ? '0ms' : `${350 + index * 120}ms`,
                    }}
                  >
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3.5 h-3.5 rounded-full flex-shrink-0 mt-1.5 ring-4 ring-white/60 transition-transform duration-300 group-hover:scale-125 ${config.dot} ${
                          reducedMotion && item.status === 'in-progress' ? '!animate-none' : ''
                        }`}
                      />
                      {!isLast && (
                        <div className="w-0.5 flex-1 bg-gradient-to-b from-green-light-900/30 to-grey-900/10 my-1" />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-lato font-semibold text-grey-900 group-hover:text-green-dark-900 transition-colors">
                          {item.title}
                        </h4>
                        <span
                          className={`text-[10px] font-semibold tracking-wider uppercase ${config.labelColor}`}
                        >
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-grey-600 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default VisionRoadmap
