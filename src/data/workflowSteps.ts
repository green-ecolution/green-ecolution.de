import { Droplets, Eye, Route } from 'lucide-react'
import { ComponentType } from 'react'

interface WorkflowStep {
  number: string
  category: string
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
}

export const workflowSteps: WorkflowStep[] = [
  {
    number: '01',
    category: 'Erfassen',
    title: 'Messen',
    description:
      'Bodenfeuchtesensoren erfassen Parameter wie Bodenfeuchte, Temperatur und Bodenwasserspannung in mehreren Tiefen (30/60/90 cm). Die Daten werden energieeffizient über LoRaWAN übertragen.',
    icon: Droplets,
  },
  {
    number: '02',
    category: 'Analysieren',
    title: 'Verstehen',
    description:
      'Ein Ampelsystem zeigt auf einer Karte den aktuellen Bewässerungsbedarf. Mitarbeiter erkennen auf einen Blick, welche Grünflächen Wasser brauchen. Zeitverläufe ermöglichen detaillierte Analysen.',
    icon: Eye,
  },
  {
    number: '03',
    category: 'Ausführen',
    title: 'Handeln',
    description:
      'Automatisierte Einsatz- und Routenplanung erzeugt optimierte Bewässerungstouren unter Berücksichtigung von Wasserkapazität, Fahrzeuggröße und Straßenrestriktionen.',
    icon: Route,
  },
]
