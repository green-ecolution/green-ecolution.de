interface RoadmapItem {
  title: string
  description: string
  status: 'planned' | 'in-progress' | 'completed'
}

export const roadmapItems: RoadmapItem[] = [
  {
    title: 'Mobile App mit QR-Scan',
    description: 'Sensor-Setup per QR-Code und GPS direkt vor Ort am Baum',
    status: 'in-progress',
  },
  {
    title: 'Eigene Sensor-Firmware',
    description: 'Vollständig selbst entwickelte Firmware für maximale Kontrolle und Anpassbarkeit',
    status: 'planned',
  },
  {
    title: 'Benutzer- und Rollenkonzept',
    description:
      'Feingranulare Rechteverwaltung für Mitarbeitende, Dienstleister und Partnerkommunen',
    status: 'planned',
  },
  {
    title: 'Open-Data-Export',
    description: 'Anbindung an das Open-Data-Portal des Landes Schleswig-Holstein',
    status: 'planned',
  },
  {
    title: 'Weitere Grünflächentypen',
    description: 'Erweiterung auf Beete, Stauden und Parks über Bäume hinaus',
    status: 'planned',
  },
]
