type TreeVariant = 'light' | 'middle' | 'dark'

interface TreeIdentity {
  name: string
  species: string
  emoji: string
}

export interface AdoptionData {
  tree: TreeIdentity
  fact: string
  certNumber: string
  plantedYear: number
  treeVariant: TreeVariant
}

const treeNames: TreeIdentity[] = [
  { name: 'Bernd', species: 'Birke', emoji: '🌿' },
  { name: 'Frieda', species: 'Fichte', emoji: '🌲' },
  { name: 'Olaf', species: 'Eiche', emoji: '🌳' },
  { name: 'Gertrude', species: 'Buche', emoji: '🍃' },
  { name: 'Horst', species: 'Kastanie', emoji: '🌰' },
  { name: 'Lieselotte', species: 'Linde', emoji: '🌱' },
  { name: 'Günther', species: 'Ahorn', emoji: '🍁' },
  { name: 'Bärbel', species: 'Esche', emoji: '🌿' },
  { name: 'Helmut', species: 'Ulme', emoji: '🌳' },
  { name: 'Rosemarie', species: 'Platane', emoji: '🍂' },
  { name: 'Siegfried', species: 'Tanne', emoji: '🌲' },
  { name: 'Hildegard', species: 'Weide', emoji: '🌾' },
  { name: 'Klaus-Dieter', species: 'Robinie', emoji: '🌳' },
  { name: 'Brunhilde', species: 'Erle', emoji: '🌿' },
  { name: 'Detlef', species: 'Pappel', emoji: '🍃' },
]

const funFacts: string[] = [
  'Ein großer Stadtbaum kann bis zu 400 Liter Wasser am Tag verdunsten und so die Umgebung um bis zu 3°C kühlen.',
  'Eine einzige Buche produziert genug Sauerstoff für 10 Menschen pro Jahr.',
  'Stadtbäume filtern bis zu 70% des Feinstaubs aus der Luft in ihrer unmittelbaren Umgebung.',
  'Die Wurzeln eines Straßenbaums erstrecken sich oft über das Dreifache der Kronenfläche.',
  'Ein 100-jähriger Baum hat in seinem Leben etwa 5 Tonnen CO₂ gebunden.',
  'Bäume kommunizieren über unterirdische Pilznetzwerke — das sogenannte „Wood Wide Web".',
  'Straßenbäume leben im Durchschnitt nur 60 Jahre — auf dem Land werden sie dreimal so alt.',
  'Ein einzelner Baum kann den Lärmpegel um bis zu 10 Dezibel senken.',
  'Flensburg hat über 30.000 Stadtbäume, die alle regelmäßig gepflegt werden müssen.',
  'In heißen Sommern braucht ein Stadtbaum bis zu 200 Liter Wasser pro Woche zusätzlich.',
]

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateAdoptionData(treeVariant: TreeVariant): AdoptionData {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const prefix = letters[Math.floor(Math.random() * 26)] + letters[Math.floor(Math.random() * 26)]
  const num = String(Math.floor(Math.random() * 9000) + 1000)

  return {
    tree: pickRandom(treeNames),
    fact: pickRandom(funFacts),
    certNumber: `GE-${prefix}-${num}`,
    plantedYear: 1970 + Math.floor(Math.random() * 50),
    treeVariant,
  }
}
