import { Splide, SplideSlide } from '@splidejs/react-splide'
import { ExternalLink } from 'lucide-react'
import '@splidejs/react-splide/css'

export interface StakeholderEntry {
  id: string
  label: string
  role: string
  description: string
  url: string
  image: string
  logoAlt: string
}

interface Props {
  entries: StakeholderEntry[]
  ariaLabel: string
  visitLabel: string
  sliderTranslations: Record<string, string>
  hasDesktopList?: boolean
}

// An island because splide is a runtime library. Everything it renders arrives
// already translated, so no provider and no catalog travel with it.
export default function StakeholderSlider({
  entries,
  ariaLabel,
  visitLabel,
  sliderTranslations,
  hasDesktopList = false,
}: Props) {
  return (
    <Splide
      options={{
        rewind: true,
        arrows: false,
        i18n: sliderTranslations,
        mediaQuery: 'min',
        // On the contact page splide destroys itself from 1024px up, so the
        // desktop view is a plain list rather than a carousel.
        ...(hasDesktopList && { breakpoints: { 1024: { destroy: true } } }),
        reducedMotion: { speed: 0, rewindSpeed: 0 },
      }}
      aria-label={ariaLabel}
    >
      {entries.map((company) => (
        <SplideSlide key={company.id} className="pb-10 px-4 md:px-6">
          <figure className="group h-full">
            <div
              className={`h-full bg-white shadow-md hover:shadow-lg rounded-2xl p-6 border border-grey-100 hover:border-green-light-900/40 md:p-8 md:grid md:grid-cols-[12rem_auto] md:gap-x-10 md:items-center transition-all duration-300 hover:-translate-y-0.5 ${
                hasDesktopList ? 'lg:cursor-default' : ''
              }`}
            >
              <div className="relative flex items-center justify-center p-4 md:p-6">
                <img
                  src={company.image}
                  className="object-contain max-w-48 h-24 md:max-w-full md:h-28"
                  alt={company.logoAlt}
                  loading="lazy"
                />
              </div>

              <figcaption className="mt-8 md:mt-0">
                <h3 className="font-lato font-bold text-lg text-grey-900 md:text-xl">
                  {company.label}
                </h3>
                {company.role && (
                  <span className="inline-block mt-1 text-xs font-semibold tracking-wider uppercase text-green-dark-900">
                    {company.role}
                  </span>
                )}

                <p className="my-4 md:my-5 text-grey-900/80 leading-relaxed">
                  {company.description}
                </p>

                <a
                  href={company.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-green-dark-900 font-semibold group/link cursor-pointer transition-all duration-300 hover:gap-3"
                >
                  <span className="transition-colors duration-300 group-hover/link:text-green-middle-900">
                    {visitLabel}
                  </span>
                  <ExternalLink className="w-4 h-4 transition-all duration-300 group-hover/link:text-green-middle-900 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                </a>
              </figcaption>
            </div>
          </figure>
        </SplideSlide>
      ))}
    </Splide>
  )
}
