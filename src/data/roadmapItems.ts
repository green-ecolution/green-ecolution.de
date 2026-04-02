interface RoadmapItem {
  title: string
  description: string
  status: 'planned' | 'in-progress' | 'completed'
}

export const roadmapItems: RoadmapItem[] = [
  {
    title: 'Eigene Sensor-Firmware',
    description: 'Vollständig selbst entwickelte Firmware für maximale Kontrolle und Anpassbarkeit',
    status: 'in-progress',
  },
  {
    title: 'Mobile App mit QR-Scan',
    description: 'Sensor-Setup per QR-Code und GPS direkt vor Ort am Baum',
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
