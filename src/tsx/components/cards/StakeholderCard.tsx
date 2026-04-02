import React, { ReactNode } from 'react'
import { ExternalLink } from 'lucide-react'

interface StakeholderCardProps {
  label: string
  role?: string
  url: string
  image: string
  children: ReactNode
  hasDesktopList?: boolean
  index?: number
  isVisible?: boolean
  reducedMotion?: boolean
}

const StakeholderCard: React.FC<StakeholderCardProps> = ({
  label,
  role,
  url,
  image,
  children,
  hasDesktopList = false,
  index = 0,
  isVisible = true,
  reducedMotion = false,
}) => {
  const delay = 400 + index * 100

  return (
    <figure
      className={`
        group h-full
        ${hasDesktopList && isVisible ? 'lg:opacity-100 lg:translate-y-0' : ''}
        ${hasDesktopList && !isVisible && !reducedMotion ? 'lg:opacity-0 lg:translate-y-4' : ''}
      `}
      style={{
        transition: hasDesktopList && !reducedMotion ? `opacity 700ms, transform 700ms` : undefined,
        transitionDelay: hasDesktopList && !reducedMotion ? `${delay}ms` : '0ms',
      }}
    >
      {/* Inner card with hover effects */}
      <div
        className={`
          h-full bg-white
          shadow-md hover:shadow-lg
          rounded-2xl p-6
          border border-grey-100 hover:border-green-light-900/40
          md:p-8 md:grid md:grid-cols-[12rem_auto] md:gap-x-10 md:items-center
          transition-all duration-300
          ${hasDesktopList ? 'lg:cursor-default hover:-translate-y-0.5' : 'hover:-translate-y-0.5'}
        `}
      >
        {/* Logo container */}
        <div className="relative flex items-center justify-center p-4 md:p-6">
          <img
            src={image}
            className="object-contain max-w-48 h-24 md:max-w-full md:h-28"
            alt={`Logo ${label}`}
            loading="lazy"
          />
        </div>

        <figcaption className="mt-8 md:mt-0">
          <h3 className="font-lato font-bold text-lg text-grey-900 md:text-xl">{label}</h3>
          {role && (
            <span className="inline-block mt-1 text-xs font-semibold tracking-wider uppercase text-green-light-900">
              {role}
            </span>
          )}

          {children}

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-green-dark-900 font-semibold group/link cursor-pointer transition-all duration-300 hover:gap-3"
          >
            <span className="transition-colors duration-300 group-hover/link:text-green-middle-900">
              Zur Webseite
            </span>
            <ExternalLink className="w-4 h-4 transition-all duration-300 group-hover/link:text-green-middle-900 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
          </a>
        </figcaption>
      </div>
    </figure>
  )
}

export default StakeholderCard
