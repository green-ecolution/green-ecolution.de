import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail } from 'lucide-react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface ContactProps {
  spacingTop?: boolean
}

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

function WateringAnimation({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="relative w-full h-full overflow-hidden" aria-hidden="true">
      {/* Parallax clouds - slow movement */}
      <div
        className={`absolute top-2 ${reducedMotion ? '' : 'animate-[cloudMove_20s_linear_infinite]'}`}
        style={{ left: reducedMotion ? '60%' : '0%' }}
      >
        <svg className="w-12 h-6 opacity-30" viewBox="0 0 48 24">
          <ellipse cx="24" cy="14" rx="20" ry="10" fill="white" />
          <ellipse cx="14" cy="12" rx="10" ry="8" fill="white" />
          <ellipse cx="34" cy="12" rx="12" ry="8" fill="white" />
        </svg>
      </div>
      <div
        className={`absolute top-6 ${reducedMotion ? '' : 'animate-[cloudMove_25s_linear_infinite]'}`}
        style={{ left: reducedMotion ? '20%' : '-20%', animationDelay: '-8s' }}
      >
        <svg className="w-8 h-4 opacity-20" viewBox="0 0 48 24">
          <ellipse cx="24" cy="14" rx="18" ry="8" fill="white" />
          <ellipse cx="16" cy="12" rx="8" ry="6" fill="white" />
        </svg>
      </div>

      {/* Ground with grass texture */}
      <div className="absolute bottom-4 left-0 right-0 h-1.5 bg-white/25 rounded-full" />
      <div className="absolute bottom-5 left-0 right-0 flex justify-around opacity-20">
        {Array.from({ length: 12 }, (_, i) => `grass-${i}`).map((id) => (
          <div key={id} className="w-0.5 h-2 bg-white/40 rounded-full" />
        ))}
      </div>

      {/* Trees - using project colors */}
      {/* Large tree (right) - dark green */}
      <svg className="absolute bottom-4 right-4 w-16 h-28" viewBox="0 0 64 112">
        <rect x="28" y="70" width="8" height="38" fill="#6B4423" rx="2" />
        <ellipse cx="32" cy="45" rx="26" ry="40" fill="#4C7741" />
        <ellipse cx="32" cy="38" rx="18" ry="30" fill="#3D5F35" />
      </svg>

      {/* Medium tree (middle) - middle green */}
      <svg className="absolute bottom-4 right-24 w-12 h-20" viewBox="0 0 64 80">
        <rect x="28" y="48" width="8" height="40" fill="#5D4E37" rx="2" />
        <ellipse cx="32" cy="30" rx="22" ry="28" fill="#7B9F35" />
        <ellipse cx="32" cy="26" rx="15" ry="20" fill="#6B8E4E" />
      </svg>

      {/* Small tree (left) - light green */}
      <svg className="absolute bottom-4 right-40 w-10 h-16 opacity-80" viewBox="0 0 64 96">
        <rect x="28" y="62" width="8" height="30" fill="#8B5A2B" rx="2" />
        <ellipse cx="32" cy="48" rx="18" ry="28" fill="#ACB63B" />
        <ellipse cx="32" cy="44" rx="12" ry="20" fill="#9AAF35" />
      </svg>

      {/* Watering truck - simple style with enhanced features */}
      <div
        className={`absolute bottom-2 ${reducedMotion ? '' : 'animate-[drive_10s_ease-in-out_infinite]'}`}
        style={{ left: reducedMotion ? '50%' : '-30%' }}
      >
        <svg className="w-32 h-16" viewBox="0 0 128 64">
          {/* Shadow */}
          <ellipse cx="64" cy="58" rx="52" ry="4" fill="rgba(0,0,0,0.15)" />

          {/* Tank body - simple rectangular style */}
          <rect x="10" y="18" width="58" height="28" rx="8" fill="#5B9BD5" />
          <rect x="12" y="20" width="54" height="24" rx="6" fill="#7BB3E0" />
          <rect x="16" y="26" width="46" height="12" rx="4" fill="#4A8BC2" />

          {/* Cabin - simple style */}
          <rect x="68" y="20" width="34" height="26" rx="4" fill="#E8E8E8" />
          <rect x="82" y="24" width="16" height="12" rx="2" fill="#87CEEB" />

          {/* Headlight */}
          <circle cx="104" cy="38" r="3" fill="#FFD700" />

          {/* Wheels with spinning animation */}
          <g
            className={reducedMotion ? '' : 'animate-[spin_0.5s_linear_infinite]'}
            style={{ transformOrigin: '30px 52px' }}
          >
            <circle cx="30" cy="52" r="9" fill="#333" />
            <circle cx="30" cy="52" r="5" fill="#555" />
            <circle cx="30" cy="52" r="2" fill="#777" />
            <line x1="30" y1="45" x2="30" y2="59" stroke="#444" strokeWidth="2" />
            <line x1="23" y1="52" x2="37" y2="52" stroke="#444" strokeWidth="2" />
          </g>
          <g
            className={reducedMotion ? '' : 'animate-[spin_0.5s_linear_infinite]'}
            style={{ transformOrigin: '88px 52px' }}
          >
            <circle cx="88" cy="52" r="9" fill="#333" />
            <circle cx="88" cy="52" r="5" fill="#555" />
            <circle cx="88" cy="52" r="2" fill="#777" />
            <line x1="88" y1="45" x2="88" y2="59" stroke="#444" strokeWidth="2" />
            <line x1="81" y1="52" x2="95" y2="52" stroke="#444" strokeWidth="2" />
          </g>

          {/* Hose at back */}
          <rect x="2" y="34" width="10" height="5" rx="2" fill="#666" />

          {/* Water drops - animated */}
          <g
            className={
              reducedMotion ? 'opacity-100' : 'animate-[waterSpray_10s_ease-in-out_infinite]'
            }
          >
            <ellipse cx="0" cy="42" rx="2.5" ry="4" fill="#5B9BD5" />
            <ellipse cx="-5" cy="46" rx="2" ry="3" fill="#7BB3E0" />
            <ellipse cx="3" cy="48" rx="2" ry="3" fill="#5B9BD5" />
            <ellipse cx="-2" cy="44" rx="1.5" ry="2.5" fill="#7BB3E0" />
          </g>
        </svg>
      </div>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes drive {
          0% { left: -35%; }
          35%, 55% { left: 50%; }
          100% { left: 110%; }
        }
        @keyframes waterSpray {
          0%, 30% { opacity: 0; transform: scale(0.5); }
          40%, 50% { opacity: 1; transform: scale(1); }
          60%, 100% { opacity: 0; transform: scale(0.5); }
        }
        @keyframes cloudMove {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

const Contact: React.FC<ContactProps> = ({ spacingTop = true }) => {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  const { ref, isVisible } = useIntersectionObserver()

  return (
    <section
      ref={ref}
      className={`px-4 max-w-screen-lg mx-auto mb-20 md:px-6 lg:mb-28 xl:max-w-screen-xl xl:mb-36
            ${spacingTop ? 'mt-20 lg:mt-28 xl:mt-36' : ''}`}
    >
      {/* Section Label */}
      <div
        className={`inline-block mb-6 lg:mb-8 transition-all ${reducedMotion ? '' : 'duration-700'} ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <span className="text-xs font-semibold tracking-widest text-green-light-900 uppercase">
          {t('sections.contact.label')}
        </span>
        <div className="h-0.5 w-12 bg-gradient-to-r from-green-light-900 to-transparent mt-1" />
      </div>

      {/* CTA Card */}
      <div
        className={`relative bg-gradient-to-br from-green-dark-900 via-green-dark-900 to-green-middle-900 rounded-2xl lg:rounded-3xl p-6 md:p-10 lg:p-12 shadow-xl overflow-hidden transition-all ${reducedMotion ? '' : 'duration-1000'} ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{ transitionDelay: reducedMotion ? '0ms' : '200ms' }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-light-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-middle-900/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:gap-12">
          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left">
            <h2
              className={`font-lato font-bold text-2xl mb-4 lg:text-3xl xl:text-4xl text-white transition-all ${reducedMotion ? '' : 'duration-700'} ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: reducedMotion ? '0ms' : '400ms' }}
            >
              {t('sections.contact.title')}
            </h2>
            <p
              className={`text-white/80 mb-8 max-w-xl lg:max-w-none leading-relaxed transition-all ${reducedMotion ? '' : 'duration-700'} ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: reducedMotion ? '0ms' : '550ms' }}
            >
              {t('sections.contact.description')}
            </p>

            <div
              className={`transition-all ${reducedMotion ? '' : 'duration-700'} ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: reducedMotion ? '0ms' : '700ms' }}
            >
              <a
                href="mailto:info@green-ecolution.de"
                aria-label={t('sections.contact.emailAriaLabel')}
                className="group inline-flex items-center justify-center gap-x-3 rounded-xl font-semibold px-8 py-4 bg-white text-green-dark-900 transition-all duration-300 hover:bg-green-light-100 hover:shadow-lg hover:shadow-black/20 hover:scale-105 active:scale-100"
              >
                <Mail className="w-5 h-5 transition-transform group-hover:-rotate-12" />
                <span>{t('sections.contact.emailLabel')}</span>
              </a>
            </div>
          </div>

          {/* Watering Animation */}
          <div
            className={`hidden lg:block flex-shrink-0 w-80 h-40 xl:w-96 xl:h-48 transition-all ${reducedMotion ? '' : 'duration-1000'} ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
            style={{ transitionDelay: reducedMotion ? '0ms' : '600ms' }}
          >
            <WateringAnimation reducedMotion={reducedMotion} />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact
