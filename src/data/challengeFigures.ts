interface ChallengeFigure {
  value: string
  unit: string
  description: string
}

export const challengeFigures: ChallengeFigure[] = [
  {
    value: '50.000',
    unit: 'Liter / Jahr',
    description:
      'Wasser verbraucht eine mittelgroße Kommune für die Bewässerung, oft ohne Datengrundlage und ohne bedarfsgerechte Steuerung.',
  },
  {
    value: '1.700 €',
    unit: 'pro Baum',
    description:
      'kostet ein einzelner Straßenbaum. Geht er durch fehlende Bewässerung verloren, deckt allein dieser Schaden die Sensorkosten für mehrere Jahre.',
  },
  {
    value: 'bis 60.000 €',
    unit: 'pro Beet',
    description:
      'kann ein komplettes Straßenbeet kosten, inklusive Tiefbau, Substrat und Infrastruktur.',
  },
]
