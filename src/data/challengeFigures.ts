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
      'Wasser werden pro mittelgroße Kommune jährlich ausgebracht, ohne Datengrundlage, ohne bedarfsgerechte Steuerung.',
  },
  {
    value: '1.700 €',
    unit: 'pro Baum',
    description:
      'kostet ein einzelner Straßenbaum. Ein vermeidbarer Totalverlust durch fehlende bedarfsgerechte Bewässerung finanziert Jahre Sensorbetrieb.',
  },
  {
    value: 'bis 60.000 €',
    unit: 'pro Beet',
    description:
      'kann ein komplettes Straßenbeet kosten, inklusive Tiefbau, Substrat und Infrastruktur.',
  },
]
