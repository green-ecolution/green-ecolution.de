import { Shield, Lock, Puzzle, Plug, Users, PiggyBank } from 'lucide-react'
import { ComponentType } from 'react'

interface GovernancePillar {
  category: string
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
}

export const governancePillars: GovernancePillar[] = [
  {
    category: 'Lizenz',
    title: 'AGPL-3.0-only',
    description:
      'Lizenziert unter der AGPL. Finanziert im Rahmen des Landesprogramms „Offene Innovation" des DigitalHub.SH Schleswig-Holstein.',
    icon: Shield,
  },
  {
    category: 'Souveränität',
    title: 'Digitale Souveränität',
    description:
      'Keine Abhängigkeit von proprietären Plattformen. Kommunen behalten die Kontrolle über ihre Daten und Infrastruktur. Kein Vendor-Lock-in.',
    icon: Lock,
  },
  {
    category: 'Modularität',
    title: 'Plugin-System',
    description:
      'Modulare Erweiterungen für kommunenspezifische Anpassungen ohne Änderung der Kernsoftware. Import-Plugins für Baumkataster, CSV, Datenbanken.',
    icon: Puzzle,
  },
  {
    category: 'Integration',
    title: 'API-first',
    description:
      'Offene Schnittstellen für Integration in kommunale IT-Landschaften. Anbindung an IoT-Hubs und Open-Data-Portale.',
    icon: Plug,
  },
  {
    category: 'Community',
    title: 'Nachnutzung & Community',
    description:
      'Quellcode und Dokumentation öffentlich auf GitHub. Andere Kommunen können die Lösung nachnutzen und anpassen.',
    icon: Users,
  },
  {
    category: 'Wirtschaftlichkeit',
    title: 'Kosteneffizienz',
    description:
      'Keine Lizenzkosten. Geschäftsmodell basiert auf Dienstleistungen: Hosting, Anpassung, Sensorvertrieb. Regionale Wertschöpfung in SH.',
    icon: PiggyBank,
  },
]
