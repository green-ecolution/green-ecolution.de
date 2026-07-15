import { workflowSteps } from '../../../data/workflowSteps'

const stepDetails: string[][] = [
  [
    'Bodenfeuchtesensoren in 30, 60 und 90 cm Tiefe',
    'Erfassung von Bodenfeuchte, Temperatur und Bodenwasserspannung',
    'Energieeffiziente Übertragung über LoRaWAN',
    'Bodenbündige Installation, kein Einfluss auf Pflegearbeiten',
  ],
  [
    'Ampelsystem zeigt Bewässerungsbedarf auf einer Karte',
    'Priorisierung nach Dringlichkeit bei begrenzten Kapazitäten',
    'Zeitverläufe für Bodenfeuchte, Temperatur und Wasserspannung',
    'Echtzeit-Dashboard mit allen relevanten KPIs',
  ],
  [
    'Automatisierte Einsatz- und Routenplanung',
    'Berücksichtigung von Wasserkapazität und Fahrzeuggröße',
    'Straßen- und Zufahrtsrestriktionen einbezogen',
    'Export der Routen auf Navigationsgeräte',
  ],
]

function Process() {
  return (
    <section
      id="process"
      className="max-w-208 mx-auto my-20 px-4 md:px-6 lg:my-28 lg:max-w-screen-lg xl:my-36 xl:max-w-screen-xl"
    >
      {/* Header */}
      <div className="mb-10 lg:mb-16">
        <div className="inline-block mb-6">
          <span className="text-xs font-semibold tracking-widest text-green-light-900 uppercase">
            Prozess
          </span>
          <div className="h-0.5 w-12 bg-gradient-to-r from-green-light-900 to-transparent mt-1" />
        </div>

        <h2 className="font-lato font-bold text-2xl text-grey-900 mb-4 lg:text-3xl xl:text-4xl">
          Messen. Verstehen. Handeln.
        </h2>

        <p className="text-grey-900/70 leading-relaxed max-w-2xl">
          Von der Bodenfeuchte zur optimierten Bewässerungsroute, in einem durchgängigen digitalen
          Workflow.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-12 lg:space-y-0">
        {workflowSteps.map((step, index) => {
          const Icon = step.icon
          const details = stepDetails[index]
          const isEven = index % 2 === 0

          return (
            <div
              key={step.title}
              className={`lg:grid lg:grid-cols-2 lg:gap-12 xl:gap-16 lg:items-start ${
                !isEven ? 'lg:direction-rtl' : ''
              } ${index > 0 ? 'lg:pt-12 lg:border-t lg:border-grey-900/10' : ''}`}
            >
              {/* Text side */}
              <div className={`mb-8 lg:mb-0 ${!isEven ? 'lg:order-2 lg:text-left' : ''}`}>
                <div className="flex items-center gap-3 mb-4">
                  <Icon className="w-6 h-6 text-green-dark-900/50" />
                  <span className="text-xs font-semibold tracking-widest uppercase text-green-dark-900/60">
                    {step.number} · {step.category}
                  </span>
                </div>

                <h3 className="font-lato font-bold text-2xl text-grey-900 mb-3 lg:text-3xl">
                  {step.title}
                </h3>

                <p className="text-grey-900/70 leading-relaxed mb-6 lg:text-lg">
                  {step.description}
                </p>
              </div>

              {/* Details side */}
              <div className={`${!isEven ? 'lg:order-1' : ''}`}>
                <div className="bg-green-light-100/50 rounded-2xl p-5 md:p-6 lg:p-8">
                  <ul className="space-y-3">
                    {details.map((detail) => (
                      <li key={detail} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-dark-900/40 mt-2 flex-shrink-0" />
                        <span className="text-sm text-grey-900/70 leading-relaxed">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default Process
