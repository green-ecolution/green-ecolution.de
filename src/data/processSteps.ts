import { Radio, Activity, LayoutDashboard, Route, Droplets } from 'lucide-react'
import { ComponentType } from 'react'

interface ProcessStep {
  label: string
  shortName: string
  description: string
  icon: ComponentType<{ className?: string }>
  color: 'green-light' | 'green-middle' | 'green-dark'
}

export const steps: ProcessStep[] = [
  {
    label: 'Sensoren installieren',
    shortName: 'Installation',
    description:
      'Bodenfeuchtesensoren werden an ausgewählten Bäumen angebracht. Das ist schnell, unkompliziert und wartungsarm.',
    icon: Radio,
    color: 'green-dark',
  },
  {
    label: 'Echtzeitdaten erfassen',
    shortName: 'Daten',
    description:
      'Die Sensoren messen kontinuierlich die Bodenfeuchtigkeit und übertragen die Werte automatisch ins System.',
    icon: Activity,
    color: 'green-light',
  },
  {
    label: 'Bewässerungsbedarf erkennen',
    shortName: 'Analyse',
    description:
      'Das Dashboard zeigt dir auf einen Blick, welche Bäume Wasser brauchen, priorisiert nach Dringlichkeit.',
    icon: LayoutDashboard,
    color: 'green-middle',
  },
  {
    label: 'Optimierte Routen planen',
    shortName: 'Planung',
    description:
      'Green Ecolution berechnet die effizienteste Tour für dein Team: weniger Fahrzeit, mehr Bewässerung.',
    icon: Route,
    color: 'green-light',
  },
  {
    label: 'Bewässern und auswerten',
    shortName: 'Umsetzung',
    description:
      'Dein Team fährt die optimierte Route. Danach siehst du genau, wie viel Wasser wo eingesetzt wurde.',
    icon: Droplets,
    color: 'green-dark',
  },
]
