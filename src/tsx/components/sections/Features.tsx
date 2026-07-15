import {
  TreeDeciduous,
  Truck,
  ClipboardList,
  LayoutDashboard,
  Users,
  BarChart3,
} from 'lucide-react'
import { ReactNode } from 'react'

interface Feature {
  label: string
  icon: ReactNode
  description: string
  color: 'green-light' | 'green-dark' | 'green-middle'
  size?: 'default' | 'large'
}

const colorClasses = {
  'green-light': 'bg-green-light-900/10 hover:bg-green-light-900/15',
  'green-dark': 'bg-green-dark-900/10 hover:bg-green-dark-900/15',
  'green-middle': 'bg-green-middle-900/10 hover:bg-green-middle-900/15',
}

const borderClasses = {
  'green-light': 'border-green-light-900/20 hover:border-green-light-900/40',
  'green-dark': 'border-green-dark-900/20 hover:border-green-dark-900/40',
  'green-middle': 'border-green-middle-900/20 hover:border-green-middle-900/40',
}

const iconColorClasses = {
  'green-light': 'bg-green-light-900/20 text-green-light-900',
  'green-dark': 'bg-green-dark-900/20 text-green-dark-900',
  'green-middle': 'bg-green-middle-900/20 text-green-middle-900',
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div
      className={`
        group h-full rounded-xl p-4 md:rounded-2xl md:p-6 lg:p-8
        border ${borderClasses[feature.color]}
        transition-all duration-300
        hover:shadow-lg hover:-translate-y-0.5
        ${colorClasses[feature.color]}
      `}
    >
      <figure
        className={`
          w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl
          flex items-center justify-center mb-3 md:mb-4
          transition-all duration-300
          group-hover:scale-105
          ${iconColorClasses[feature.color]}
        `}
      >
        <span className="[&>svg]:w-5 [&>svg]:h-5 md:[&>svg]:w-6 md:[&>svg]:h-6 lg:[&>svg]:w-8 lg:[&>svg]:h-8">
          {feature.icon}
        </span>
      </figure>
      <h3 className="font-lato font-bold text-base md:text-xl mb-1 md:mb-2 text-grey-900">
        {feature.label}
      </h3>
      <p className="text-grey-900/70 text-sm md:text-base leading-relaxed">{feature.description}</p>
    </div>
  )
}

function Features() {
  const features: Feature[] = [
    {
      label: 'Echtzeit-Dashboard',
      icon: <LayoutDashboard />,
      description:
        'Alle wichtigen KPIs auf einen Blick: Bodenfeuchtewerte, anstehende Touren, Teamverfügbarkeit und Fahrzeugstatus in einem zentralen Dashboard.',
      color: 'green-dark',
      size: 'large',
    },
    {
      label: 'Intelligente Gruppierung',
      icon: <TreeDeciduous />,
      description:
        'Fasse Bäume zu Bewässerungs\u00ADeinheiten zusammen. Automatische Berechnung des Wasserbedarfs pro Cluster.',
      color: 'green-light',
    },
    {
      label: 'Fleet Management',
      icon: <Truck />,
      description:
        'Verwalte Transporter und Anhänger mit Wasserkapazitäten. Automatische Nachfüllstopps in der Routenplanung.',
      color: 'green-middle',
    },
    {
      label: 'Tour-Planung',
      icon: <ClipboardList />,
      description:
        'Optimierte Bewässerungspläne mit Echtzeit-Status: Von „geplant“ über „aktiv“ bis „abgeschlossen“.',
      color: 'green-middle',
    },
    {
      label: 'Teamverwaltung',
      icon: <Users />,
      description:
        'Verwalte Fahrer mit Führerscheinklassen und Verfügbarkeit. Optimiere die Einsatzplanung.',
      color: 'green-light',
    },
    {
      label: 'Nachanalyse',
      icon: <BarChart3 />,
      description:
        'Dokumentiere den tatsächlichen Wasserverbrauch pro Cluster und Tour. Analysiere Trends und optimiere zukünftige Planungen datenbasiert.',
      color: 'green-dark',
      size: 'large',
    },
  ]

  return (
    <section
      id="features"
      className="max-w-208 mx-auto my-20 px-4 md:px-6 lg:my-28 lg:max-w-screen-lg xl:my-36 xl:max-w-screen-xl"
    >
      {/* Section Label */}
      <div className="text-center mb-6 lg:mb-8">
        <div className="inline-block">
          <span className="text-xs font-semibold tracking-widest text-green-light-900 uppercase">
            Features
          </span>
          <div className="h-0.5 w-12 bg-gradient-to-r from-green-light-900 to-transparent mt-1 mx-auto" />
        </div>
      </div>

      <article className="mb-8 lg:mb-14 text-center">
        <h2 className="font-lato font-bold text-2xl mb-4 text-grey-900 lg:text-3xl">
          Green Ecolution im Überblick
        </h2>
        <p className="text-grey-900/70 max-w-2xl mx-auto leading-relaxed">
          Von der Sensorerfassung über die intelligente Routenplanung bis zur detaillierten
          Auswertung: alle Funktionen für ein effizientes und nachhaltiges Grünflächenmanagement
        </p>
      </article>

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4 lg:grid-rows-2">
        {features.map((feature, index) => (
          <div
            key={feature.label}
            className={`${feature.size === 'large' ? 'col-span-2' : ''} ${index === 0 ? 'lg:row-span-1' : ''}`}
          >
            <FeatureCard feature={feature} />
          </div>
        ))}
      </div>
    </section>
  )
}

export default Features
