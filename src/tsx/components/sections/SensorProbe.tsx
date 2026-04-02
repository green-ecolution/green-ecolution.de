import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { sensorSpecs, sensorFeatures } from '../../../data/sensorSpecs'

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

function SoilIllustration({
  isVisible,
  reducedMotion,
}: {
  isVisible: boolean
  reducedMotion: boolean
}) {
  const depths = [
    { y: 120, label: '30 cm', color: '#658A58', zone: 'Feinwurzeln' },
    { y: 200, label: '60 cm', color: '#4C7741', zone: 'Hauptwurzeln' },
    { y: 280, label: '90 cm', color: '#3D5F35', zone: 'Tiefenwurzeln' },
  ]

  return (
    <svg
      viewBox="0 0 320 360"
      className={`w-full max-w-sm mx-auto transition-all ${reducedMotion ? '' : 'duration-1000'} ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      aria-label="Schematische Darstellung einer Bodensonde in drei Tiefen"
      role="img"
    >
      {/* Sky */}
      <rect x="0" y="0" width="320" height="60" fill="#f0f7ed" rx="8" />

      {/* Ground surface */}
      <rect x="0" y="60" width="320" height="300" fill="#8B7355" opacity="0.15" rx="0" />
      <rect x="0" y="60" width="320" height="4" fill="#ACB63B" opacity="0.4" />

      {/* Soil layers */}
      <rect x="0" y="64" width="320" height="100" fill="#8B7355" opacity="0.08" />
      <rect x="0" y="164" width="320" height="100" fill="#8B7355" opacity="0.14" />
      <rect x="0" y="264" width="320" height="96" fill="#8B7355" opacity="0.2" />

      {/* Root structures (stylized) */}
      {/* Shallow fine roots at 30cm zone */}
      <g opacity="0.18">
        <path
          d="M160,75 Q130,90 100,100 Q80,105 65,95"
          fill="none"
          stroke="#6B4423"
          strokeWidth="1.5"
        />
        <path
          d="M160,75 Q180,85 210,95 Q230,100 250,92"
          fill="none"
          stroke="#6B4423"
          strokeWidth="1.5"
        />
        <path
          d="M160,78 Q140,95 115,108 Q100,115 85,108"
          fill="none"
          stroke="#6B4423"
          strokeWidth="1"
        />
        <path
          d="M160,78 Q175,92 200,105 Q220,112 240,105"
          fill="none"
          stroke="#6B4423"
          strokeWidth="1"
        />
      </g>
      {/* Medium roots at 60cm zone */}
      <g opacity="0.13">
        <path
          d="M160,100 Q135,140 110,170 Q95,185 80,178"
          fill="none"
          stroke="#6B4423"
          strokeWidth="1.8"
        />
        <path
          d="M160,100 Q185,145 205,175 Q218,188 235,180"
          fill="none"
          stroke="#6B4423"
          strokeWidth="1.8"
        />
      </g>
      {/* Deep roots at 90cm zone */}
      <g opacity="0.09">
        <path
          d="M158,120 Q140,190 125,250 Q118,270 110,260"
          fill="none"
          stroke="#6B4423"
          strokeWidth="2"
        />
        <path
          d="M162,120 Q178,195 190,255 Q196,272 205,262"
          fill="none"
          stroke="#6B4423"
          strokeWidth="2"
        />
      </g>

      {/* Depth lines with zone labels */}
      {depths.map((d) => (
        <g key={d.label}>
          <line
            x1="40"
            y1={d.y}
            x2="280"
            y2={d.y}
            stroke="#8B7355"
            strokeWidth="0.5"
            strokeDasharray="6 4"
            opacity="0.3"
          />
          <text
            x="300"
            y={d.y + 4}
            textAnchor="end"
            fill="#8B7355"
            fontSize="11"
            fontFamily="Lato"
            fontWeight="600"
            opacity="0.6"
          >
            {d.label}
          </text>
          <text
            x="40"
            y={d.y - 6}
            textAnchor="start"
            fill={d.color}
            fontSize="9"
            fontFamily="Lato"
            fontWeight="600"
            opacity="0.7"
          >
            {d.zone}
          </text>
        </g>
      ))}

      {/* Probe shaft */}
      <rect x="155" y="40" width="10" height="260" fill="#4C7741" rx="3" opacity="0.9" />
      <rect x="157" y="40" width="6" height="260" fill="#658A58" rx="2" opacity="0.5" />

      {/* Probe cap above ground */}
      <rect x="148" y="32" width="24" height="30" fill="#3D5F35" rx="6" />
      <rect x="153" y="36" width="14" height="4" fill="#ACB63B" rx="2" opacity="0.7" />

      {/* Sensor nodes at each depth */}
      {depths.map((d, i) => (
        <g key={`sensor-${d.label}`}>
          <circle cx="160" cy={d.y} r="12" fill={d.color} opacity="0.2" />
          <circle cx="160" cy={d.y} r="7" fill={d.color} />
          <circle cx="160" cy={d.y} r="3" fill="white" opacity="0.6" />

          {/* Animated data particles rising from sensors */}
          {!reducedMotion && (
            <>
              <circle r="2.5" fill="#ACB63B" opacity="0">
                <animateMotion
                  path={`M160,${d.y} L160,40`}
                  dur="3s"
                  begin={`${i * 0.8}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0;0.8;0.8;0"
                  dur="3s"
                  begin={`${i * 0.8}s`}
                  repeatCount="indefinite"
                />
              </circle>
              <circle r="2" fill="#ACB63B" opacity="0">
                <animateMotion
                  path={`M160,${d.y} L160,40`}
                  dur="3s"
                  begin={`${i * 0.8 + 1.5}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0;0.6;0.6;0"
                  dur="3s"
                  begin={`${i * 0.8 + 1.5}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </>
          )}
        </g>
      ))}

      {/* Tree above ground */}
      <rect x="157" y="12" width="6" height="22" fill="#6B4423" rx="2" />
      <ellipse cx="160" cy="6" rx="18" ry="12" fill="#4C7741" opacity="0.7" />
      <ellipse cx="160" cy="3" rx="12" ry="8" fill="#3D5F35" opacity="0.5" />

      {/* LoRaWAN signal waves */}
      {!reducedMotion && (
        <g opacity="0.4">
          <path
            d="M178,28 Q188,20 178,12"
            fill="none"
            stroke="#ACB63B"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <animate attributeName="opacity" values="0;0.6;0" dur="2s" repeatCount="indefinite" />
          </path>
          <path
            d="M184,32 Q198,20 184,8"
            fill="none"
            stroke="#ACB63B"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <animate
              attributeName="opacity"
              values="0;0.4;0"
              dur="2s"
              begin="0.4s"
              repeatCount="indefinite"
            />
          </path>
        </g>
      )}
    </svg>
  )
}

function SensorProbe() {
  const reducedMotion = useReducedMotion()
  const { ref, isVisible } = useIntersectionObserver()

  return (
    <section
      ref={ref}
      className="px-4 max-w-208 mx-auto my-20 md:px-6 lg:my-28 lg:max-w-screen-lg xl:my-36 xl:max-w-screen-xl"
    >
      <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16 lg:items-center">
        {/* Illustration with subtle card treatment */}
        <div className="mb-10 lg:mb-0">
          <div className="relative bg-gradient-to-b from-green-light-100/60 to-white rounded-2xl p-4 lg:p-6 border border-green-dark-900/5 shadow-sm">
            <SoilIllustration isVisible={isVisible} reducedMotion={reducedMotion} />
          </div>
        </div>

        {/* Content */}
        <div>
          {/* Section Label */}
          <div
            className={`inline-block mb-6 transition-all ${reducedMotion ? '' : 'duration-700'} ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <span className="text-xs font-semibold tracking-widest text-green-light-900 uppercase">
              Hardware
            </span>
            <div className="h-0.5 w-12 bg-gradient-to-r from-green-light-900 to-transparent mt-1" />
          </div>

          {/* Heading */}
          <h2
            className={`font-lato font-bold text-2xl mb-4 text-grey-900 lg:text-3xl xl:text-4xl transition-all ${reducedMotion ? '' : 'duration-700'} ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: reducedMotion ? '0ms' : '100ms' }}
          >
            Die Bodensonde
          </h2>

          {/* Description */}
          <p
            className={`text-grey-900/70 leading-relaxed mb-8 transition-all ${reducedMotion ? '' : 'duration-700'} ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: reducedMotion ? '0ms' : '200ms' }}
          >
            Konzipiert für den Einsatz im öffentlichen Raum. Sensoren in drei Tiefen (30, 60 und 90
            cm) bilden das gesamte Wurzelprofil eines Baumes ab, von den oberflächennahen
            Feinwurzeln bis zu den tieferen Hauptwurzeln. So lässt sich erkennen, ob Wasser
            tatsächlich im Wurzelbereich ankommt oder nur die Oberfläche benetzt wird. Die
            Installation erfolgt bodenbündig mit handelsüblichen Erdbohrern. Pflegearbeiten wie
            Mähen werden nicht beeinträchtigt.
          </p>

          {/* Spec Badges */}
          <div
            className={`flex flex-wrap gap-3 mb-8 transition-all ${reducedMotion ? '' : 'duration-700'} ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: reducedMotion ? '0ms' : '300ms' }}
          >
            {sensorSpecs.map((spec) => (
              <div
                key={spec.label}
                className="flex items-center gap-2 border border-green-light-900/40 rounded-full px-4 py-2 transition-all duration-300 hover:border-green-light-900 hover:bg-green-light-100/50 hover:shadow-sm cursor-default"
              >
                <span className="font-lato font-bold text-green-dark-900">{spec.value}</span>
                <span className="text-sm text-grey-600">{spec.label}</span>
              </div>
            ))}
          </div>

          {/* Sensor Features */}
          <div className="space-y-4">
            {sensorFeatures.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.label}
                  className={`flex items-start gap-4 transition-all ${reducedMotion ? '' : 'duration-700'} ${
                    isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}
                  style={{
                    transitionDelay: reducedMotion ? '0ms' : `${400 + index * 100}ms`,
                  }}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-light-900/15 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-green-dark-900" />
                  </div>
                  <div>
                    <h3 className="font-lato font-semibold text-grey-900 mb-0.5">
                      {feature.label}
                    </h3>
                    <p className="text-sm text-grey-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default SensorProbe
