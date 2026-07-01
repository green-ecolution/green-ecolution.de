import { useEffect, useRef, useState } from 'react'
import { architectureSteps } from '../../../data/architectureSteps'
import { useReducedMotion } from '../../hooks/useReducedMotion'

function useIntersectionObserver(threshold = 0.2) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold, rootMargin: '0px 0px -100px 0px' },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}

function useStaggeredVisibility(itemCount: number, baseDelay = 200) {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(() => new Set())
  const { ref, isVisible } = useIntersectionObserver(0.1)

  useEffect(() => {
    if (!isVisible) return

    const timers: NodeJS.Timeout[] = []
    for (let i = 0; i < itemCount; i++) {
      const timer = setTimeout(() => {
        setVisibleItems((prev) => new Set([...prev, i]))
      }, i * baseDelay)
      timers.push(timer)
    }

    return () => timers.forEach(clearTimeout)
  }, [isVisible, itemCount, baseDelay])

  return { ref, visibleItems, isVisible }
}

const cardConfigs = [
  {
    gradient: 'from-green-dark-900 to-green-dark-900/95',
    glow: 'shadow-green-dark-900/30',
    number: '01',
  },
  {
    gradient: 'from-green-middle-900 to-green-middle-900/95',
    glow: 'shadow-green-middle-900/30',
    number: '02',
  },
  {
    gradient: 'from-green-dark-900 to-green-dark-900/95',
    glow: 'shadow-green-dark-900/30',
    number: '03',
  },
  {
    gradient: 'from-green-middle-900 to-green-middle-900/95',
    glow: 'shadow-green-middle-900/30',
    number: '04',
  },
]

function DataParticle({ delay, duration }: { delay: number; duration: number }) {
  return (
    <circle r="3" fill="#ACB63B" opacity="0.9">
      <animate
        attributeName="opacity"
        values="0;1;1;0"
        dur={`${duration}s`}
        begin={`${delay}s`}
        repeatCount="indefinite"
      />
      <animateMotion dur={`${duration}s`} begin={`${delay}s`} repeatCount="indefinite">
        <mpath href="#flowPath" />
      </animateMotion>
    </circle>
  )
}

function ConnectionLine({
  isVisible,
  reducedMotion,
  index,
}: {
  isVisible: boolean
  reducedMotion: boolean
  index: number
}) {
  const pathLength = 100

  return (
    <div
      className={`hidden lg:flex items-center justify-center w-20 xl:w-28 transition-all duration-700 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ transitionDelay: `${(index + 1) * 200 + 300}ms` }}
    >
      <svg viewBox="0 0 100 40" className="w-full h-10" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`lineGrad${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4C7741" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#ACB63B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#4C7741" stopOpacity="0.6" />
          </linearGradient>
          <path id="flowPath" d="M 0 20 Q 25 10 50 20 Q 75 30 100 20" />
        </defs>

        {/* Background dashed path */}
        <path
          d="M 0 20 Q 25 10 50 20 Q 75 30 100 20"
          fill="none"
          stroke="rgba(76, 119, 65, 0.2)"
          strokeWidth="2"
          strokeDasharray="4 4"
        />

        {/* Animated main path */}
        <path
          d="M 0 20 Q 25 10 50 20 Q 75 30 100 20"
          fill="none"
          stroke={`url(#lineGrad${index})`}
          strokeWidth="2"
          strokeDasharray={pathLength}
          strokeDashoffset={isVisible && !reducedMotion ? 0 : pathLength}
          className="transition-all duration-1000"
          style={{ transitionDelay: `${(index + 1) * 200 + 400}ms` }}
        />

        {/* Data particles */}
        {!reducedMotion && isVisible && (
          <>
            <DataParticle delay={0 + index * 0.3} duration={2} />
            <DataParticle delay={0.7 + index * 0.3} duration={2} />
            <DataParticle delay={1.4 + index * 0.3} duration={2} />
          </>
        )}

        {/* Arrow head */}
        <polygon
          points="92,20 100,17 100,23"
          fill="#ACB63B"
          className={`transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{ transitionDelay: `${(index + 1) * 200 + 600}ms` }}
        />
      </svg>
    </div>
  )
}

function MobileConnectionLine({
  isVisible,
}: {
  isVisible: boolean
  reducedMotion: boolean
  index: number
}) {
  return (
    <div
      className={`flex lg:hidden justify-center py-3 transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-green-dark-900/40">
        <path
          d="M6 9 L12 15 L18 9"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

function ArchitectureCard({
  step,
  config,
  index,
  isVisible,
  reducedMotion,
}: {
  step: (typeof architectureSteps)[0]
  config: (typeof cardConfigs)[0]
  index: number
  isVisible: boolean
  reducedMotion: boolean
}) {
  const Icon = step.icon

  return (
    <div
      className={`group relative transition-all ${reducedMotion ? '' : 'duration-700'} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: reducedMotion ? '0ms' : `${index * 200}ms` }}
    >
      {/* Card */}
      <div
        className={`relative bg-gradient-to-br ${config.gradient} rounded-2xl p-5 lg:p-6
          shadow-lg ${config.glow} hover:shadow-xl
          transition-all duration-300 hover:-translate-y-1
          ring-1 ring-white/10 overflow-hidden
          w-full lg:w-40 xl:w-48`}
      >
        {/* Large step number watermark - inside card */}
        <div className="absolute top-3 right-4 text-5xl lg:text-6xl font-lato font-bold text-white/15 select-none pointer-events-none leading-none">
          {config.number}
        </div>

        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />

        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative z-10">
          {/* Icon container */}
          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ring-1 ring-white/20">
            <Icon className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
          </div>

          {/* Content */}
          <h3 className="font-lato font-bold text-lg lg:text-xl text-white mb-1">{step.label}</h3>
          <p className="text-white/70 text-sm leading-relaxed">{step.description}</p>
        </div>
      </div>
    </div>
  )
}

function Architecture() {
  const reducedMotion = useReducedMotion()
  const { ref, visibleItems, isVisible } = useStaggeredVisibility(
    architectureSteps.length,
    reducedMotion ? 0 : 200,
  )

  return (
    <section
      id="architecture"
      ref={ref}
      className="max-w-208 mx-auto my-20 px-4 md:px-6 lg:my-28 lg:max-w-screen-lg xl:my-36 xl:max-w-screen-xl"
    >
      {/* Header */}
      <article
        className={`mb-12 lg:mb-16 lg:text-center transition-all ${reducedMotion ? '' : 'duration-700'} ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="inline-block mb-4">
          <span className="text-xs font-semibold tracking-widest text-green-light-900 uppercase">
            System-Architektur
          </span>
          <div className="h-0.5 w-12 bg-gradient-to-r from-green-light-900 to-transparent mt-1" />
        </div>
        <h2 className="font-lato font-bold text-2xl lg:text-4xl mb-4 text-grey-900">
          Der Weg der Daten
        </h2>
        <p className="text-grey-600 max-w-2xl mx-auto text-base lg:text-lg">
          So gelangen die Messwerte vom Baum bis zur optimierten Bewässerungsroute durch das Green
          Ecolution System.
        </p>
      </article>

      {/* Desktop Flowchart */}
      <div className="hidden lg:flex items-start justify-center">
        {architectureSteps.map((step, index) => (
          <div key={step.label} className="flex items-center">
            <ArchitectureCard
              step={step}
              config={cardConfigs[index]}
              index={index}
              isVisible={visibleItems.has(index)}
              reducedMotion={reducedMotion}
            />
            {index < architectureSteps.length - 1 && (
              <ConnectionLine
                isVisible={visibleItems.has(index)}
                reducedMotion={reducedMotion}
                index={index}
              />
            )}
          </div>
        ))}
      </div>

      {/* Mobile Flowchart */}
      <div className="lg:hidden flex flex-col items-center max-w-sm mx-auto">
        {architectureSteps.map((step, index) => (
          <div key={step.label} className="w-full">
            <ArchitectureCard
              step={step}
              config={cardConfigs[index]}
              index={index}
              isVisible={visibleItems.has(index)}
              reducedMotion={reducedMotion}
            />
            {index < architectureSteps.length - 1 && (
              <MobileConnectionLine
                isVisible={visibleItems.has(index)}
                reducedMotion={reducedMotion}
                index={index}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export default Architecture
