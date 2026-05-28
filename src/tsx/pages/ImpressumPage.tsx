import { useEffect, useRef, useState } from 'react'
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
  const reducedMotion = useReducedMotion()
  const { ref, isVisible } = useIntersectionObserver()

  useEffect(() => {
    document.title = 'Impressum | Green Ecolution | Smartes Grünflächenmanagement'
  }, [])

  const heroHeadline = 'Impressum'
  const heroDescription = 'Angaben gemäß § 5 TMG'

  return (
    <main
      id="main-content"
      className="relative overflow-hidden before:bg-cover before:bg-background-dark-dot before:w-4/5 before:h-[100vh] before:max-h-[45rem] before:absolute before:-right-4 before:-top-16 before:-z-10 before:bg-no-repeat sm:before:-right-10 lg:before:max-h-[55rem] xl:before:w-[70rem] xl:before:-right-40 2xl:before:right-[10%] 2xl:before:bg-contain"
    >
      <BreadcrumbSchema
        items={[
          { name: 'Startseite', path: '/' },
          { name: 'Impressum', path: '/impressum' },
        ]}
      />
      <Hero headline={heroHeadline} description={heroDescription} label="Rechtliches" />

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
              Kontakt
            </h2>
            <address className="not-italic space-y-1 bg-grey-100/50 rounded-xl p-6 border border-grey-200/50">
              <p className="font-bold">PROGEEK GmbH</p>
              <p>Lise-Meitner-Str. 2</p>
              <p>24941 Flensburg</p>
              <p className="mt-4">
                Telefon:{' '}
                <a
                  href="tel:+494617933068"
                  className="text-green-dark-900 font-semibold underline underline-offset-2 transition-all ease-in-out duration-300 hover:text-green-light-900"
                >
                  +49 461 793 306 80
                </a>
              </p>
              <p>
                E-Mail:{' '}
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
              Handelsregister
            </h2>
            <ul className="space-y-1">
              <li>
                <span className="font-bold">Registergericht:</span> Amtsgericht Flensburg
              </li>
              <li>
                <span className="font-bold">Registernummer:</span> HRB 15596 FL
              </li>
              <li>
                <span className="font-bold">Steuernummer:</span> 15/295/02186
              </li>
              <li>
                <span className="font-bold">USt-IdNr.:</span> DE351061751
              </li>
              <li>
                <span className="font-bold">Geschäftsführer:</span> Boris Dudelsack und Dmitri
                Hammernik
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
              Haftung für Inhalte
            </h2>
            <p className="mb-4">
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten
              nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
              Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
              Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
              rechtswidrige Tätigkeit hinweisen.
            </p>
            <p>
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
              allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch
              erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
              Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend
              entfernen.
            </p>
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
              Haftung für Links
            </h2>
            <p className="mb-4">
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
              Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr
              übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter
              oder Betreiber der Seiten verantwortlich.
            </p>
            <p>
              Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße
              überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
              Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete
              Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von
              Rechtsverletzungen werden wir derartige Links umgehend entfernen.
            </p>
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
              Urheberrecht
            </h2>
            <p className="mb-4">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
              unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung
              und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der
              schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
            <p>
              Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen
              Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt
              wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter
              als solche gekennzeichnet.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default ImpressumPage
