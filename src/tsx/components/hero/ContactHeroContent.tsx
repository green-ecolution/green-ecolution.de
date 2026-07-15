import { Mail, ExternalLink, Leaf, ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

function FloatingLeaf({
  className,
  delay,
  reducedMotion,
}: {
  className: string
  delay: string
  reducedMotion: boolean
}) {
  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{
        animation: reducedMotion ? 'none' : `float 6s ease-in-out infinite`,
        animationDelay: delay,
      }}
    >
      <Leaf className="w-6 h-6 text-green-light-900/20 rotate-45" />
    </div>
  )
}

function ContactCard({
  href,
  icon: Icon,
  title,
  description,
  cta,
  isExternal,
  accentColor,
}: {
  href: string
  icon: LucideIcon | string
  title: string
  description: string
  cta: string
  isExternal?: boolean
  accentColor: 'light' | 'middle' | 'dark'
}) {
  const colors = {
    light: {
      bg: 'from-green-light-900/10 to-green-light-100',
      border: 'border-green-light-900/20',
      icon: 'bg-green-light-900',
      hover: 'hover:border-green-light-900/40 hover:shadow-green-light-900/10',
    },
    middle: {
      bg: 'from-green-middle-900/10 to-green-light-100',
      border: 'border-green-middle-900/20',
      icon: 'bg-green-middle-900',
      hover: 'hover:border-green-middle-900/40 hover:shadow-green-middle-900/10',
    },
    dark: {
      bg: 'from-green-dark-900/10 to-green-light-100',
      border: 'border-green-dark-900/20',
      icon: 'bg-green-dark-900',
      hover: 'hover:border-green-dark-900/40 hover:shadow-green-dark-900/10',
    },
  }

  const colorSet = colors[accentColor]
  const isImageIcon = typeof Icon === 'string'

  return (
    <div>
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className={`
          group relative flex flex-col items-center text-center p-6 md:p-8 h-full
          bg-gradient-to-br ${colorSet.bg}
          border-2 ${colorSet.border}
          rounded-3xl
          transition-all duration-300
          ${colorSet.hover}
          hover:shadow-xl hover:-translate-y-1
        `}
      >
        {/* Decorative corner leaf */}
        <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div
            className={`w-8 h-8 ${colorSet.icon} rounded-full flex items-center justify-center shadow-lg`}
          >
            <Leaf className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Icon */}
        <div
          className={`
            w-14 h-14 md:w-16 md:h-16 rounded-2xl ${colorSet.icon}
            flex items-center justify-center mb-6
            shadow-lg group-hover:scale-110 transition-transform duration-300
          `}
        >
          {isImageIcon ? (
            <img
              src={Icon}
              className="w-7 h-7 md:w-8 md:h-8 brightness-0 invert"
              alt=""
              loading="lazy"
            />
          ) : (
            <Icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
          )}
        </div>

        {/* Content */}
        <h3 className="font-lato font-bold text-xl md:text-2xl text-grey-900 mb-2">{title}</h3>
        <p className="text-grey-900/80 text-sm md:text-base leading-relaxed mb-6 flex-grow">
          {description}
        </p>

        {/* CTA */}
        <div className="flex items-center justify-center gap-2 text-green-dark-900 font-semibold group-hover:gap-3 transition-all duration-300">
          <span>{cta}</span>
          {isExternal ? (
            <ExternalLink className="w-4 h-4" />
          ) : (
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          )}
        </div>

        {/* Organic shape overlay on hover */}
        <div
          className={`
            absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100
            transition-opacity duration-300 pointer-events-none
            bg-gradient-to-tr from-transparent via-white/5 to-white/20
          `}
        />
      </a>
    </div>
  )
}

function ContactHeroContent() {
  const reducedMotion = useReducedMotion()

  return (
    <div className="relative mt-12 lg:mt-16">
      {/* Floating decorative leaves */}
      <FloatingLeaf
        className="top-0 left-[10%] hidden md:block"
        delay="0s"
        reducedMotion={reducedMotion}
      />
      <FloatingLeaf
        className="top-1/2 right-[5%] hidden lg:block"
        delay="2s"
        reducedMotion={reducedMotion}
      />
      <FloatingLeaf
        className="bottom-0 left-[20%] hidden md:block"
        delay="4s"
        reducedMotion={reducedMotion}
      />

      {/* Section intro */}
      <div className="text-center mb-10 lg:mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-light-100 rounded-full mb-4">
          <div className="w-2 h-2 bg-green-light-900 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-green-dark-900 tracking-wide uppercase">
            Wir freuen uns auf dich
          </span>
        </div>
      </div>

      {/* Contact cards grid */}
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        <ContactCard
          href="mailto:info@green-ecolution.de"
          icon={Mail}
          title="Schreib uns"
          description="Hast du Fragen zum Projekt oder möchtest du mehr erfahren? Wir melden uns zeitnah bei dir zurück."
          cta="E-Mail senden"
          accentColor="dark"
        />

        <ContactCard
          href="https://github.com/green-ecolution"
          icon="/assets/svg/socials/github.svg"
          title="Open Source"
          description="Entdecke unseren Code, trage zur Entwicklung bei oder nutze Green Ecolution für deine Kommune."
          cta="Auf GitHub ansehen"
          isExternal
          accentColor="middle"
        />
      </div>

      {/* Bottom decorative element */}
      <div className="flex justify-center mt-12 lg:mt-16">
        <div className="flex items-center gap-4">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-green-light-900/30" />
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-green-dark-900/30 rounded-full" />
            <div className="w-1.5 h-1.5 bg-green-middle-900/30 rounded-full" />
            <div className="w-1.5 h-1.5 bg-green-light-900/30 rounded-full" />
          </div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-green-light-900/30" />
        </div>
      </div>

      {/* CSS for floating animation */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(45deg);
          }
          50% {
            transform: translateY(-15px) rotate(55deg);
          }
        }
      `}</style>
    </div>
  )
}

export default ContactHeroContent
