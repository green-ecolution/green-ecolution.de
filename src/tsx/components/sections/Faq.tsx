import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Accordion from '../Accordion'
import { useReducedMotion } from '../../hooks/useReducedMotion'

function useIntersectionObserver(threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)

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

function Faq() {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  const { ref, isVisible } = useIntersectionObserver()
  const faqData = [
    {
      question: t('sections.faq.items.behind.question'),
      answer: t('sections.faq.items.behind.schemaAnswer'),
    },
    {
      question: t('sections.faq.items.value.question'),
      answer: t('sections.faq.items.value.schemaAnswer'),
    },
    {
      question: t('sections.faq.items.public.question'),
      answer: t('sections.faq.items.public.schemaAnswer'),
    },
    {
      question: t('sections.faq.items.sensors.question'),
      answer: t('sections.faq.items.sensors.schemaAnswer'),
    },
    {
      question: t('sections.faq.items.progress.question'),
      answer: t('sections.faq.items.progress.schemaAnswer'),
    },
  ]
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqData.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <section
      ref={ref}
      className="px-4 max-w-208 mx-auto my-20 md:px-6 lg:my-28 xl:my-36 xl:max-w-screen-lg"
    >
      <script
        type="application/ld+json"
        // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Section Label */}
      <div
        className={`
          mb-6 lg:mb-8 flex justify-center
          ${reducedMotion ? '' : 'transition-all duration-700'}
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
      >
        <div className="inline-block">
          <span className="text-xs font-semibold tracking-widest text-green-light-900 uppercase">
            {t('sections.faq.label')}
          </span>
          <div className="h-0.5 w-12 bg-gradient-to-r from-green-light-900 to-transparent mt-1 mx-auto" />
        </div>
      </div>

      <h2
        className={`
          font-lato font-bold text-center text-2xl mb-8 text-grey-900 lg:mb-12 lg:text-3xl
          ${reducedMotion ? '' : 'transition-all duration-700'}
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
        style={{ transitionDelay: reducedMotion ? '0ms' : '100ms' }}
      >
        {t('sections.faq.title')}
      </h2>

      <ul className="flex flex-col gap-y-4 md:gap-y-5">
        <div
          className={`
            ${reducedMotion ? '' : 'transition-all duration-500'}
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{ transitionDelay: reducedMotion ? '0ms' : '200ms' }}
        >
          <Accordion label={t('sections.faq.items.behind.question')}>
            <p>
              {t('sections.faq.items.behind.answer.beforeHs')}&nbsp;
              <a
                href="https://hs-flensburg.de/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-dark-900 font-semibold underline underline-offset-2 transition-all ease-in-out duration-300 hover:text-green-light-900"
              >
                Hochschule Flensburg
              </a>
              &nbsp;{t('sections.faq.items.behind.answer.beforeProgeek')}&nbsp;
              <a
                href="https://progeek.de/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-dark-900 font-semibold underline underline-offset-2 transition-all ease-in-out duration-300 hover:text-green-light-900"
              >
                PROGEEK
              </a>
              &nbsp;{t('sections.faq.items.behind.answer.beforeSmarteGrenzregion')}&nbsp;
              <a
                href="https://smarte-grenzregion.de/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-dark-900 font-semibold underline underline-offset-2 transition-all ease-in-out duration-300 hover:text-green-light-900"
              >
                Smarten Grenzregion
              </a>
              &nbsp;{t('sections.faq.items.behind.answer.beforeStadtFlensburg')}&nbsp;
              <a
                href="https://www.flensburg.de/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-dark-900 font-semibold underline underline-offset-2 transition-all ease-in-out duration-300 hover:text-green-light-900"
              >
                Stadt Flensburg
              </a>
              .
            </p>
          </Accordion>
        </div>
        <div
          className={`
            ${reducedMotion ? '' : 'transition-all duration-500'}
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{ transitionDelay: reducedMotion ? '0ms' : '300ms' }}
        >
          <Accordion label={t('sections.faq.items.value.question')}>
            <p className="mb-4">{t('sections.faq.items.value.answer.primary')}</p>
            <p>{t('sections.faq.items.value.answer.secondary')}</p>
          </Accordion>
        </div>
        <div
          className={`
            ${reducedMotion ? '' : 'transition-all duration-500'}
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{ transitionDelay: reducedMotion ? '0ms' : '400ms' }}
        >
          <Accordion label={t('sections.faq.items.public.question')}>
            <p className="mb-4">
              {t('sections.faq.items.public.answer.beforeGithub')}&nbsp;
              <a
                href="https://github.com/green-ecolution"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-dark-900 font-semibold underline underline-offset-2 transition-all ease-in-out duration-300 hover:text-green-light-900"
              >
                GitHub-Repository
              </a>
              &nbsp;{t('sections.faq.items.public.answer.afterGithub')}
            </p>
            <p>
              {t('sections.faq.items.public.answer.beforeOpenData')}&nbsp;
              <a
                href="https://opendata.schleswig-holstein.de/dataset"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-dark-900 font-semibold underline underline-offset-2 transition-all ease-in-out duration-300 hover:text-green-light-900"
              >
                Open-Data-Portal
              </a>
              &nbsp;{t('sections.faq.items.public.answer.afterOpenData')}
            </p>
          </Accordion>
        </div>
        <div
          className={`
            ${reducedMotion ? '' : 'transition-all duration-500'}
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{ transitionDelay: reducedMotion ? '0ms' : '500ms' }}
        >
          <Accordion label={t('sections.faq.items.sensors.question')}>
            <p className="mb-4">{t('sections.faq.items.sensors.answer.intro')}</p>
            <ul className="list-disc pl-4">
              <li>
                {t('sections.faq.items.sensors.answer.watermarkPrefix')}&nbsp;
                <a
                  href="https://www.irrometer.com/pdf/403.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-dark-900 font-semibold underline underline-offset-2 transition-all ease-in-out duration-300 hover:text-green-light-900"
                >
                  Watermark-Sensor
                </a>
              </li>
              <li>
                {t('sections.faq.items.sensors.answer.smt100Prefix')}&nbsp;
                <a
                  href="https://www.truebner.de/de/smt100.php"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-dark-900 font-semibold underline underline-offset-2 transition-all ease-in-out duration-300 hover:text-green-light-900"
                >
                  SMT100-Sensor
                </a>
              </li>
            </ul>
            <p className="mt-4">{t('sections.faq.items.sensors.answer.outlook')}</p>
          </Accordion>
        </div>
        <div
          className={`
            ${reducedMotion ? '' : 'transition-all duration-500'}
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{ transitionDelay: reducedMotion ? '0ms' : '600ms' }}
        >
          <Accordion label={t('sections.faq.items.progress.question')}>
            <p>
              {t('sections.faq.items.progress.answer.beforeHs')}&nbsp;
              <a
                href="https://hs-flensburg.de/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-dark-900 font-semibold underline underline-offset-2 transition-all ease-in-out duration-300 hover:text-green-light-900"
              >
                Hochschule Flensburg
              </a>
              &nbsp;{t('sections.faq.items.progress.answer.afterHs')}
            </p>
            <p className="mt-4">
              {t('sections.faq.items.progress.answer.beforeDigitalHub')}&nbsp;
              <strong>DigitalHub Call for Concepts</strong>&nbsp;
              {t('sections.faq.items.progress.answer.beforeOpenSourceProgram')}&nbsp;
              <strong>„Offene Innovation – Open Source made in Schleswig-Holstein“</strong>
              &nbsp;{t('sections.faq.items.progress.answer.afterDigitalHub')}
            </p>
            <p className="mt-4">
              {t('sections.faq.items.progress.answer.beforeProgeek')}&nbsp;
              <a
                href="https://progeek.de/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-dark-900 font-semibold underline underline-offset-2 transition-all ease-in-out duration-300 hover:text-green-light-900"
              >
                PROGEEK
              </a>
              ,&nbsp;{t('sections.faq.items.progress.answer.beforeStadtFlensburg')}&nbsp;
              <a
                href="https://www.flensburg.de/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-dark-900 font-semibold underline underline-offset-2 transition-all ease-in-out duration-300 hover:text-green-light-900"
              >
                Stadt Flensburg
              </a>
              &nbsp;{t('sections.faq.items.progress.answer.beforeSmarteGrenzregion')}&nbsp;
              <a
                href="https://smarte-grenzregion.de/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-dark-900 font-semibold underline underline-offset-2 transition-all ease-in-out duration-300 hover:text-green-light-900"
              >
                Smarte Grenzregion
              </a>
              &nbsp;{t('sections.faq.items.progress.answer.afterSmarteGrenzregion')}
            </p>
          </Accordion>
        </div>
      </ul>
    </section>
  )
}

export default Faq
