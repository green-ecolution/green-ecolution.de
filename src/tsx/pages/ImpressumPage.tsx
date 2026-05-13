import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Hero from '../components/sections/Hero'
import BreadcrumbSchema from '../components/BreadcrumbSchema'
import { useReducedMotion } from '../hooks/useReducedMotion'

function useIntersectionObserver(threshold = 0) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold, rootMargin: '100px 0px 0px 0px' },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}

function ImpressumPage() {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  const { ref, isVisible } = useIntersectionObserver()

  useEffect(() => {
    document.title = t('pages.impressum.documentTitle')
  }, [t])

  const heroHeadline = t('pages.impressum.hero.headline')
  const heroDescription = t('pages.impressum.hero.description')

  return (
    <main
      id="main-content"
      className="relative overflow-hidden before:bg-cover before:bg-background-dark-dot before:w-4/5 before:h-[100vh] before:max-h-[45rem] before:absolute before:-right-4 before:-top-16 before:-z-10 before:bg-no-repeat sm:before:-right-10 lg:before:max-h-[55rem] xl:before:w-[70rem] xl:before:-right-40 2xl:before:right-[10%] 2xl:before:bg-contain"
    >
      <BreadcrumbSchema
        items={[
          { name: t('pages.breadcrumbs.home'), path: '/' },
          { name: t('pages.breadcrumbs.impressum'), path: '/impressum' },
        ]}
      />
      <Hero headline={heroHeadline} description={heroDescription} label={t('pages.legalLabel')} />

      <section
        ref={ref}
        className="px-4 max-w-208 mx-auto md:px-6 lg:max-w-screen-lg xl:max-w-screen-xl mt-16 mb-28 lg:mb-36 xl:mb-52"
      >
        <div className="space-y-12">
          {/* Kontakt */}
          <div
            className={`
              ${reducedMotion ? '' : 'transition-all duration-700'}
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            <h2 className="font-lato font-bold text-2xl mb-4 lg:text-3xl text-grey-900 pl-4 border-l-4 border-green-light-900">
              {t('pages.impressum.contact.title')}
            </h2>
            <address className="not-italic space-y-1 bg-grey-100/50 rounded-xl p-6 border border-grey-200/50">
              <p className="font-bold">PROGEEK GmbH</p>
              <p>Lise-Meitner-Str. 2</p>
              <p>24941 Flensburg</p>
              <p className="mt-4">
                {t('pages.impressum.contact.phoneLabel')}{' '}
                <a
                  href="tel:+494617933068"
                  className="text-green-dark-900 font-semibold underline underline-offset-2 transition-all ease-in-out duration-300 hover:text-green-light-900"
                >
                  +49 461 793 306 80
                </a>
              </p>
              <p>
                {t('pages.impressum.contact.emailLabel')}{' '}
                <a
                  href="mailto:info@progeek.de"
                  className="text-green-dark-900 font-semibold underline underline-offset-2 transition-all ease-in-out duration-300 hover:text-green-light-900"
                >
                  info@progeek.de
                </a>
              </p>
            </address>
          </div>

          {/* Handelsregister */}
          <div
            className={`
              ${reducedMotion ? '' : 'transition-all duration-700'}
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
            style={{ transitionDelay: reducedMotion ? '0ms' : '100ms' }}
          >
            <h2 className="font-lato font-bold text-2xl mb-4 lg:text-3xl text-grey-900 pl-4 border-l-4 border-green-light-900">
              {t('pages.impressum.commercialRegister.title')}
            </h2>
            <ul className="space-y-1">
              <li>
                <span className="font-bold">
                  {t('pages.impressum.commercialRegister.registerCourtLabel')}
                </span>{' '}
                {t('pages.impressum.commercialRegister.registerCourtValue')}
              </li>
              <li>
                <span className="font-bold">
                  {t('pages.impressum.commercialRegister.registerNumberLabel')}
                </span>{' '}
                HRB 15596 FL
              </li>
              <li>
                <span className="font-bold">
                  {t('pages.impressum.commercialRegister.taxNumberLabel')}
                </span>{' '}
                15/295/02186
              </li>
              <li>
                <span className="font-bold">
                  {t('pages.impressum.commercialRegister.vatIdLabel')}
                </span>{' '}
                DE351061751
              </li>
              <li>
                <span className="font-bold">
                  {t('pages.impressum.commercialRegister.managingDirectorsLabel')}
                </span>{' '}
                Boris Dudelsack und Dmitri Hammernik
              </li>
            </ul>
          </div>

          {/* Haftung für Inhalte */}
          <div
            className={`
              ${reducedMotion ? '' : 'transition-all duration-700'}
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
            style={{ transitionDelay: reducedMotion ? '0ms' : '200ms' }}
          >
            <h2 className="font-lato font-bold text-2xl mb-4 lg:text-3xl text-grey-900 pl-4 border-l-4 border-green-light-900">
              {t('pages.impressum.contentLiability.title')}
            </h2>
            <p className="mb-4">{t('pages.impressum.contentLiability.paragraph1')}</p>
            <p>{t('pages.impressum.contentLiability.paragraph2')}</p>
          </div>

          {/* Haftung für Links */}
          <div
            className={`
              ${reducedMotion ? '' : 'transition-all duration-700'}
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
            style={{ transitionDelay: reducedMotion ? '0ms' : '300ms' }}
          >
            <h2 className="font-lato font-bold text-2xl mb-4 lg:text-3xl text-grey-900 pl-4 border-l-4 border-green-light-900">
              {t('pages.impressum.linkLiability.title')}
            </h2>
            <p className="mb-4">{t('pages.impressum.linkLiability.paragraph1')}</p>
            <p>{t('pages.impressum.linkLiability.paragraph2')}</p>
          </div>

          {/* Urheberrecht */}
          <div
            className={`
              ${reducedMotion ? '' : 'transition-all duration-700'}
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
            style={{ transitionDelay: reducedMotion ? '0ms' : '400ms' }}
          >
            <h2 className="font-lato font-bold text-2xl mb-4 lg:text-3xl text-grey-900 pl-4 border-l-4 border-green-light-900">
              {t('pages.impressum.copyright.title')}
            </h2>
            <p className="mb-4">{t('pages.impressum.copyright.paragraph1')}</p>
            <p>{t('pages.impressum.copyright.paragraph2')}</p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default ImpressumPage
