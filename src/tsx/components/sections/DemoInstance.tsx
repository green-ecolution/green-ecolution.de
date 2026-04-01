import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { ExternalLink } from 'lucide-react'

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

function DemoInstance() {
  const reducedMotion = useReducedMotion()
  const { ref, isVisible } = useIntersectionObserver()

  return (
    <section
      ref={ref}
      className="px-4 max-w-208 mx-auto my-20 md:px-6 lg:my-28 lg:max-w-screen-lg xl:my-36 xl:max-w-screen-xl"
    >
      <div className="relative bg-gradient-to-tr from-green-dark-900 via-green-middle-900/80 to-green-dark-900 rounded-2xl lg:rounded-3xl overflow-hidden shadow-xl ring-1 ring-white/5">
        {/* Distinct diagonal stripe pattern */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, white 0px, white 1px, transparent 1px, transparent 12px)',
          }}
        />

        {/* Glow behind browser mockup area */}
        <div className="absolute top-1/2 right-0 w-[30rem] h-[30rem] bg-green-light-900/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />

        <div className="relative z-10 p-6 md:p-10 lg:p-12 xl:p-16 lg:grid lg:grid-cols-[1fr_1.2fr] lg:gap-12 lg:items-center">
          {/* Text Content */}
          <div className="mb-8 lg:mb-0">
            {/* Section Label */}
            <div
              className={`inline-block mb-6 transition-all ${reducedMotion ? '' : 'duration-700'} ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <span className="text-xs font-bold tracking-widest text-white uppercase">
                Live Demo
              </span>
              <div className="h-0.5 w-12 bg-gradient-to-r from-white/50 to-transparent mt-1" />
            </div>

            <h2
              className={`font-lato font-bold text-2xl mb-4 text-white lg:text-3xl xl:text-4xl transition-all ${reducedMotion ? '' : 'duration-700'} ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: reducedMotion ? '0ms' : '100ms' }}
            >
              Überzeug dich selbst
            </h2>

            <p
              className={`text-white/70 leading-relaxed mb-8 max-w-lg transition-all ${reducedMotion ? '' : 'duration-700'} ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: reducedMotion ? '0ms' : '200ms' }}
            >
              Die öffentlich zugängliche Demo-Instanz zeigt den aktuellen Funktionsumfang:
              Kartenansicht mit Ampelsystem, Dashboard mit Sensordaten und automatisierte
              Routenberechnung. Keine Installation nötig, direkt im Browser.
            </p>

            <div
              className={`transition-all ${reducedMotion ? '' : 'duration-700'} ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: reducedMotion ? '0ms' : '300ms' }}
            >
              <a
                href="https://demo.green-ecolution.de"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Demo von Green Ecolution im Browser öffnen"
                className="group inline-flex items-center justify-center gap-x-3 rounded-xl font-semibold px-8 py-4 bg-white text-green-dark-900 transition-all duration-300 hover:bg-green-light-100 hover:shadow-lg hover:shadow-black/20 hover:scale-105 active:scale-100"
              >
                <span>Demo öffnen</span>
                <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>

          {/* Browser Mockup — hidden on small screens */}
          <div
            className={`hidden md:block transition-all ${reducedMotion ? '' : 'duration-1000'} ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: reducedMotion ? '0ms' : '400ms' }}
          >
            <div className="bg-white rounded-xl lg:rounded-2xl shadow-2xl overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 bg-grey-900/5 border-b border-grey-900/10">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#f87171]" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#fbbf24]" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#4ade80]" />
                </div>
                <div className="flex-1 mx-2 sm:mx-4">
                  <div className="h-5 sm:h-6 bg-grey-900/10 rounded-md max-w-xs mx-auto flex items-center justify-center">
                    <span className="text-[10px] sm:text-xs text-grey-600/60">
                      demo.green-ecolution.de
                    </span>
                  </div>
                </div>
              </div>

              {/* Screenshot */}
              <div className="relative">
                <img
                  src="/assets/images/releases/v0.1.0-dashboard.png"
                  alt="Green Ecolution Demo, Dashboard mit Kartenansicht und Sensordaten"
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DemoInstance
