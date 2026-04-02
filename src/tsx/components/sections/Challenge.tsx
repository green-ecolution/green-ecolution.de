import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { challengeFigures } from '../../../data/challengeFigures'

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

function Challenge() {
  const reducedMotion = useReducedMotion()
  const { ref, isVisible } = useIntersectionObserver()

  return (
    <section ref={ref} className="relative overflow-hidden">
      {/* Dark gradient background — steeper angle for distinct feel vs Contact/Demo */}
      <div className="bg-gradient-to-b from-[#1e3a1a] via-green-dark-900 to-green-middle-900/90">
        {/* Crosshatch pattern — distinct from dot pattern used elsewhere */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(45deg, white 1px, transparent 1px), linear-gradient(-45deg, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Asymmetric gradient mesh */}
        <div className="absolute -top-20 left-1/4 w-[50rem] h-[30rem] bg-green-light-900/6 rounded-full blur-3xl rotate-12" />
        <div className="absolute bottom-0 -right-20 w-[25rem] h-[25rem] bg-green-middle-900/8 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-208 mx-auto px-4 py-20 md:px-6 lg:py-28 lg:max-w-screen-lg xl:py-36 xl:max-w-screen-xl">
          {/* Quote Block */}
          <div className="mb-12 lg:mb-16 xl:mb-20">
            {/* Decorative quotation mark */}
            <div
              className={`transition-all ${reducedMotion ? '' : 'duration-1000'} ${
                isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
            >
              <span
                className="block mb-4 font-lato text-white/10 leading-none select-none"
                style={{ fontSize: '5rem' }}
                aria-hidden="true"
              >
                &bdquo;
              </span>
            </div>

            <blockquote
              className={`border-l-2 border-green-light-900/30 pl-6 lg:pl-8 transition-all ${reducedMotion ? '' : 'duration-700'} ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: reducedMotion ? '0ms' : '150ms' }}
            >
              <p className="font-lato text-2xl font-light italic text-white leading-snug max-w-3xl md:text-3xl lg:text-4xl xl:text-5xl">
                Städte gießen nach Gefühl.
                <br />
                <span className="text-green-light-900">Nicht nach Bedarf.</span>
              </p>
            </blockquote>
          </div>

          {/* Divider */}
          <div
            className={`w-16 h-px bg-gradient-to-r from-green-light-900/50 to-transparent mb-10 lg:mb-14 transition-all ${reducedMotion ? '' : 'duration-700'} ${
              isVisible ? 'opacity-100 w-16' : 'opacity-0 w-0'
            }`}
            style={{ transitionDelay: reducedMotion ? '0ms' : '350ms' }}
          />

          {/* Supporting text */}
          <p
            className={`text-white/70 leading-relaxed max-w-3xl mb-12 lg:mb-16 lg:text-lg transition-all ${reducedMotion ? '' : 'duration-700'} ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: reducedMotion ? '0ms' : '450ms' }}
          >
            Städtische Grünflächen regulieren das Mikroklima, fördern Biodiversität und stärken den
            Standortwettbewerb. Doch anhaltende Trockenheit und fehlende Digitalisierung gefährden
            dieses Gut. Die Bewässerungsplanung vieler Kommunen stützt sich allein auf die
            Einschätzung einzelner Mitarbeiter, ganz ohne Datengrundlage. Statt bedarfsgerechter
            Bewässerung wird pauschal gegossen, was Wasser verschwendet und trotzdem nicht alle
            Bäume erreicht. Nicht optimierte Bewässerungsfahrten verursachen zusätzlich vermeidbare
            CO₂-Emissionen.
          </p>

          {/* Cost Figures Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
            {challengeFigures.map((figure, index) => (
              <article
                key={figure.unit}
                className={`group bg-white/[0.07] backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-lg ${
                  isVisible
                    ? 'opacity-100 translate-y-0'
                    : `opacity-0 translate-y-8 ${reducedMotion ? '' : '!duration-700'}`
                }`}
                style={{
                  transitionDelay: reducedMotion || isVisible ? '0ms' : `${550 + index * 150}ms`,
                }}
              >
                <div className="mb-3">
                  <span className="font-lato text-3xl font-bold text-white tracking-tight lg:text-4xl xl:text-5xl">
                    {figure.value}
                  </span>
                </div>
                <span className="inline-block text-xs font-semibold tracking-widest uppercase text-green-light-900 mb-3">
                  {figure.unit}
                </span>
                <p className="text-white/60 text-sm leading-relaxed">{figure.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Challenge
