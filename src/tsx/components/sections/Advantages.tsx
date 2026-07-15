import AdvantageCard from '../cards/AdvantageCard'

const advantages = [
  {
    label: 'Offene Lösung für alle',
    icon: '/assets/svg/general/people.svg',
    description:
      'Skalierbare Open-Source-Lösung für Kommunen zur Förderung von Weiterentwicklungen und Transparenz',
    accentColor: 'dark' as const,
  },
  {
    label: 'Optimierte Routen',
    icon: '/assets/svg/general/map.svg',
    description: 'Individuelle Einsatzplanung zur effizienteren Bewässerung',
    accentColor: 'middle' as const,
  },
  {
    label: 'Weniger ist mehr',
    icon: '/assets/svg/general/reduce.svg',
    description: 'Gezielte Bewässerung, weniger Wasserverbrauch',
    accentColor: 'dark' as const,
  },
]

function Advantages() {
  return (
    <section
      id="vorteile"
      className="px-4 max-w-208 mx-auto my-20 md:px-6 lg:my-28 lg:max-w-screen-lg xl:my-36 xl:max-w-screen-xl"
    >
      <div className="md:grid md:grid-cols-2 md:gap-6 lg:gap-8">
        {/* Header */}
        <article className="mb-8 md:mb-0">
          <div className="inline-block mb-4">
            <span className="text-xs font-semibold tracking-widest text-green-light-900 uppercase">
              Vorteile
            </span>
            <div className="h-0.5 w-12 bg-gradient-to-r from-green-light-900 to-transparent mt-1" />
          </div>
          <h2 className="font-lato font-bold text-2xl mb-4 lg:text-3xl text-grey-900">
            Alle weiteren Funktionen und Vorteile
          </h2>
          <p className="text-grey-600 leading-relaxed">
            Das Projekt ist öffentlich einsehbar und hat als Ziel, den Wasserverbrauch für die
            Bewässerung zu verringern sowie eine variable Einsatzplanung zu ermöglichen.
          </p>
        </article>

        {/* Advantage Cards */}
        {advantages.map((advantage) => (
          <article key={advantage.label} className="mb-4 last:mb-0 md:mb-0">
            <AdvantageCard
              label={advantage.label}
              icon={advantage.icon}
              description={advantage.description}
              accentColor={advantage.accentColor}
            />
          </article>
        ))}
      </div>
    </section>
  )
}

export default Advantages
