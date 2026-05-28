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

function DatenschutzPage() {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  const { ref, isVisible } = useIntersectionObserver()

  useEffect(() => {
    document.title = t('pages.datenschutz.documentTitle')
  }, [t])

  const heroHeadline = t('pages.datenschutz.hero.headline')
  const heroDescription = t('pages.datenschutz.hero.description')

  const linkClasses =
    'text-green-dark-900 font-semibold underline underline-offset-2 transition-all ease-in-out duration-300 hover:text-green-light-900'

  return (
    <main
      id="main-content"
      className="relative overflow-hidden before:bg-cover before:bg-background-dark-dot before:w-4/5 before:h-[100vh] before:max-h-[45rem] before:absolute before:-right-4 before:-top-16 before:-z-10 before:bg-no-repeat sm:before:-right-10 lg:before:max-h-[55rem] xl:before:w-[70rem] xl:before:-right-40 2xl:before:right-[10%] 2xl:before:bg-contain"
    >
      <BreadcrumbSchema
        items={[
          { name: t('pages.breadcrumbs.home'), path: '/' },
          { name: t('pages.breadcrumbs.datenschutz'), path: '/datenschutz' },
        ]}
      />
      <Hero headline={heroHeadline} description={heroDescription} label={t('pages.legalLabel')} />

      <section
        ref={ref}
        className="px-4 max-w-208 mx-auto md:px-6 lg:max-w-screen-lg xl:max-w-screen-xl mt-16 mb-28 lg:mb-36 xl:mb-52"
      >
        <div className="space-y-12">
          {/* Section 1: Datenschutz auf einen Blick */}
          <div
            className={`
              ${reducedMotion ? '' : 'transition-all duration-700'}
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            <h2 className="font-lato font-bold text-2xl mb-4 lg:text-3xl text-grey-900 pl-4 border-l-4 border-green-light-900">
              {t('pages.datenschutz.overview.title')}
            </h2>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              {t('pages.datenschutz.overview.generalNotesTitle')}
            </h3>
            <p className="mb-4">{t('pages.datenschutz.overview.generalNotesText')}</p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              {t('pages.datenschutz.overview.dataCollectionTitle')}
            </h3>

            <h4 className="font-bold mb-2 text-grey-900">
              {t('pages.datenschutz.overview.responsibleQuestion')}
            </h4>
            <p className="mb-4">{t('pages.datenschutz.overview.responsibleAnswer')}</p>

            <h4 className="font-bold mb-2 text-grey-900">
              {t('pages.datenschutz.overview.howCollectQuestion')}
            </h4>
            <p className="mb-4">{t('pages.datenschutz.overview.howCollectAnswer')}</p>

            <h4 className="font-bold mb-2 text-grey-900">
              {t('pages.datenschutz.overview.dataUseQuestion')}
            </h4>
            <p className="mb-4">{t('pages.datenschutz.overview.dataUseAnswer')}</p>

            <h4 className="font-bold mb-2 text-grey-900">
              {t('pages.datenschutz.overview.rightsQuestion')}
            </h4>
            <p>{t('pages.datenschutz.overview.rightsAnswer')}</p>
          </div>

          {/* Section 2: Hosting */}
          <div
            className={`
              ${reducedMotion ? '' : 'transition-all duration-700'}
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
            style={{ transitionDelay: reducedMotion ? '0ms' : '100ms' }}
          >
            <h2 className="font-lato font-bold text-2xl mb-4 lg:text-3xl text-grey-900 pl-4 border-l-4 border-green-light-900">
              {t('pages.datenschutz.hosting.title')}
            </h2>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              {t('pages.datenschutz.hosting.externalTitle')}
            </h3>
            <p className="mb-4">{t('pages.datenschutz.hosting.paragraph1')}</p>
            <p className="mb-4">{t('pages.datenschutz.hosting.paragraph2')}</p>
            <p className="mb-4">{t('pages.datenschutz.hosting.paragraph3')}</p>
            <p className="font-bold">{t('pages.datenschutz.hosting.providerIntro')}</p>
            <address className="not-italic mt-2 bg-grey-100/50 rounded-xl p-6 border border-grey-200/50">
              <p>Digitalocean LLC</p>
              <p>101 Avenue of the Americas</p>
              <p>10th Floor New York, NY 10013</p>
              <p>United States</p>
            </address>
          </div>

          {/* Section 3: Allgemeine Hinweise und Pflichtinformationen */}
          <div
            className={`
              ${reducedMotion ? '' : 'transition-all duration-700'}
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
            style={{ transitionDelay: reducedMotion ? '0ms' : '200ms' }}
          >
            <h2 className="font-lato font-bold text-2xl mb-4 lg:text-3xl text-grey-900 pl-4 border-l-4 border-green-light-900">
              {t('pages.datenschutz.general.title')}
            </h2>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              {t('pages.datenschutz.general.privacyTitle')}
            </h3>
            <p className="mb-4">{t('pages.datenschutz.general.privacyParagraph1')}</p>
            <p className="mb-4">{t('pages.datenschutz.general.privacyParagraph2')}</p>
            <p>{t('pages.datenschutz.general.privacyParagraph3')}</p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              {t('pages.datenschutz.general.responsibleTitle')}
            </h3>
            <p className="mb-4">{t('pages.datenschutz.general.responsibleIntro')}</p>
            <address className="not-italic mb-4 bg-grey-100/50 rounded-xl p-6 border border-grey-200/50">
              <p className="font-bold">PROGEEK GmbH</p>
              <p>Lise-Meitner-Str. 2</p>
              <p>24941 Flensburg</p>
              <p className="mt-2">
                {t('pages.datenschutz.general.emailLabel')}{' '}
                <a href="mailto:info@progeek.de" className={linkClasses}>
                  info@progeek.de
                </a>
              </p>
            </address>
            <p>{t('pages.datenschutz.general.responsibleDefinition')}</p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              {t('pages.datenschutz.general.storageDurationTitle')}
            </h3>
            <p>{t('pages.datenschutz.general.storageDurationText')}</p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              {t('pages.datenschutz.general.legalBasisTitle')}
            </h3>
            <p>{t('pages.datenschutz.general.legalBasisText')}</p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              {t('pages.datenschutz.general.revocationTitle')}
            </h3>
            <p>{t('pages.datenschutz.general.revocationText')}</p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              {t('pages.datenschutz.general.objectionTitle')}
            </h3>
            <p className="mb-4 p-4 bg-green-light-100 rounded-lg">
              {t('pages.datenschutz.general.objectionParagraph1')}
            </p>
            <p className="p-4 bg-green-light-100 rounded-lg">
              {t('pages.datenschutz.general.objectionParagraph2')}
            </p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              {t('pages.datenschutz.general.complaintTitle')}
            </h3>
            <p>{t('pages.datenschutz.general.complaintText')}</p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              {t('pages.datenschutz.general.dataPortabilityTitle')}
            </h3>
            <p>{t('pages.datenschutz.general.dataPortabilityText')}</p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              {t('pages.datenschutz.general.encryptionTitle')}
            </h3>
            <p>{t('pages.datenschutz.general.encryptionText')}</p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              {t('pages.datenschutz.general.informationDeletionCorrectionTitle')}
            </h3>
            <p>{t('pages.datenschutz.general.informationDeletionCorrectionText')}</p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              {t('pages.datenschutz.general.restrictionTitle')}
            </h3>
            <p className="mb-4">{t('pages.datenschutz.general.restrictionIntro')}</p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>{t('pages.datenschutz.general.restrictionItems.accuracy')}</li>
              <li>{t('pages.datenschutz.general.restrictionItems.unlawful')}</li>
              <li>{t('pages.datenschutz.general.restrictionItems.legalClaims')}</li>
              <li>{t('pages.datenschutz.general.restrictionItems.objection')}</li>
            </ul>
            <p>{t('pages.datenschutz.general.restrictionOutro')}</p>
          </div>

          {/* Section 4: Datenerfassung auf dieser Website */}
          <div
            className={`
              ${reducedMotion ? '' : 'transition-all duration-700'}
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
            style={{ transitionDelay: reducedMotion ? '0ms' : '300ms' }}
          >
            <h2 className="font-lato font-bold text-2xl mb-4 lg:text-3xl text-grey-900 pl-4 border-l-4 border-green-light-900">
              {t('pages.datenschutz.dataCollection.title')}
            </h2>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              {t('pages.datenschutz.dataCollection.cookiesTitle')}
            </h3>
            <p className="mb-4">{t('pages.datenschutz.dataCollection.cookiesParagraph1')}</p>
            <p className="mb-4">{t('pages.datenschutz.dataCollection.cookiesParagraph2')}</p>
            <p className="mb-4">{t('pages.datenschutz.dataCollection.cookiesParagraph3')}</p>
            <p className="mb-4">{t('pages.datenschutz.dataCollection.cookiesParagraph4')}</p>
            <p>{t('pages.datenschutz.dataCollection.cookiesParagraph5')}</p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              {t('pages.datenschutz.dataCollection.serverLogsTitle')}
            </h3>
            <p className="mb-4">{t('pages.datenschutz.dataCollection.serverLogsIntro')}</p>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>{t('pages.datenschutz.dataCollection.serverLogItems.browser')}</li>
              <li>{t('pages.datenschutz.dataCollection.serverLogItems.operatingSystem')}</li>
              <li>{t('pages.datenschutz.dataCollection.serverLogItems.referrerUrl')}</li>
              <li>{t('pages.datenschutz.dataCollection.serverLogItems.hostName')}</li>
              <li>{t('pages.datenschutz.dataCollection.serverLogItems.requestTime')}</li>
              <li>{t('pages.datenschutz.dataCollection.serverLogItems.ipAddress')}</li>
            </ul>
            <p>{t('pages.datenschutz.dataCollection.serverLogsText')}</p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              {t('pages.datenschutz.dataCollection.contactFormTitle')}
            </h3>
            <p className="mb-4">{t('pages.datenschutz.dataCollection.contactFormParagraph1')}</p>
            <p className="mb-4">{t('pages.datenschutz.dataCollection.contactFormParagraph2')}</p>
            <p>{t('pages.datenschutz.dataCollection.contactFormParagraph3')}</p>
          </div>

          <p className="text-sm text-grey-900/60 mt-8">
            {t('pages.datenschutz.sourceLabel')}{' '}
            <a
              href="https://www.e-recht24.de/"
              target="_blank"
              rel="noreferrer noopener"
              className={linkClasses}
            >
              eRecht24
            </a>
          </p>
        </div>
      </section>
    </main>
  )
}

export default DatenschutzPage
