import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { ArrowUpRight } from 'lucide-react'

const links = [
  {
    label: 'Software für die Stadt Flensburg',
    subLabel:
      'Dies ist die Software, die für die Stadt Flensburg entwickelt und aufgesetzt wurde. Diese Software wird primär vom Technischen Betriebszentrum Flensburg genutzt.',
    url: 'https://app.green-ecolution.de/',
  },
  {
    label: 'Organisation auf GitHub',
    subLabel:
      'Dort finden Sie alle Code-Repositories, die mit dem Projekt in Verbindung stehen, wie z. B. Backend und Frontend der Software',
    url: 'https://github.com/green-ecolution',
  },
  {
    label: 'Blog-Beitrag der HS Flensburg',
    subLabel:
      'Auch auf der Website der HS Flensburg wurde ein Beitrag zum Forschungsprojekt veröffentlicht.',
    url: 'https://hs-flensburg.de/studium/master/ai/abgeschlossene-arbeiten/green-ecolution-smartes-gruenflaechenmanagement-fuer-die',
  },
  {
    label: 'Instagram-Beitrag der HS Flensburg',
    subLabel:
      'Nicht nur auf der Website, sondern auch auf Instagram wurde Green Ecolution erwähnt.',
    url: 'https://www.instagram.com/hochschuleflensburg/p/DA3aCgaPqoq/',
  },
  {
    label: 'Teil des DigitalHub.SH 2025',
    subLabel:
      'Green Ecolution wurde als eines der Open-Source-Projekte im Rahmen des DigitalHub.SH 2025 vorgestellt und finanziert.',
    url: 'https://www.schleswig-holstein.de/DE/landesregierung/ministerien-behoerden/I/Presse/PI/2025/cds/251014_cds_open-source-projekte?nn=a3865cbf-b1fb-4b2f-bc47-f7ac05f3f7b5',
  },
  {
    label: 'Pressemitteilung der Stadt Flensburg',
    subLabel:
      'Auch die Stadt Flensburg berichtete über Green Ecolution und die Bedeutung des Projekts für ein nachhaltiges Stadtmanagement.',
    url: 'https://www.presse-service.de/data.aspx/static/1200128.html',
  },
  {
    label: 'Live Demo',
    subLabel:
      'Die öffentlich zugängliche Demo-Instanz zeigt den aktuellen Funktionsumfang: Kartenansicht mit Ampelsystem, Dashboard mit Sensordaten und automatisierte Routenberechnung.',
    url: 'https://demo.green-ecolution.de/',
  },
]

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

function FurtherLinks() {
  const reducedMotion = useReducedMotion()
  const { ref, isVisible } = useIntersectionObserver()

  return (
    <section
      ref={ref}
      className="px-4 max-w-208 mx-auto my-20 md:px-6 lg:my-28 lg:max-w-screen-lg xl:my-36 xl:max-w-screen-xl"
    >
      {/* Header */}
      <article
        className={`mb-8 lg:mb-12 lg:text-center transition-all ${reducedMotion ? '' : 'duration-700'} ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="inline-block mb-4 lg:mx-auto">
          <span className="text-xs font-semibold tracking-widest text-green-light-900 uppercase">
            Ressourcen
          </span>
          <div className="h-0.5 w-12 bg-gradient-to-r from-green-light-900 to-transparent mt-1" />
        </div>
        <h2 className="font-lato font-bold text-2xl lg:text-3xl text-grey-900">
          Weiterführende Links & Erwähnungen
        </h2>
      </article>

      {/* Links Grid */}
      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {links.map((link, index) => (
          <li
            key={link.label}
            className={`transition-all ${reducedMotion ? '' : 'duration-700'} ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{
              transitionDelay: reducedMotion ? '0ms' : `${index * 100}ms`,
            }}
          >
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block h-full bg-green-light-100 border border-green-dark-900/20
                rounded-2xl p-5 lg:p-6 shadow-xs hover:shadow-sm
                transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-lato font-semibold text-lg text-grey-900 mb-2 group-hover:text-green-dark-900 transition-colors">
                    {link.label}
                  </h3>
                  <p className="text-grey-600 text-sm leading-relaxed">{link.subLabel}</p>
                </div>
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-dark-900/10 flex items-center justify-center group-hover:bg-green-dark-900 transition-colors">
                  <ArrowUpRight className="w-5 h-5 text-green-dark-900 group-hover:text-white transition-colors" />
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default FurtherLinks
