type TreeVariant = 'light' | 'middle' | 'dark'

interface TreeIdentity {
  name: string
  speciesKey: string
  emoji: string
}

export interface AdoptionData {
  tree: TreeIdentity
  factKey: string
  certNumber: string
  plantedYear: number
  treeVariant: TreeVariant
}

const treeNames: TreeIdentity[] = [
  { name: 'Bernd', speciesKey: 'adoptTreeData.species.birch', emoji: '🌿' },
  { name: 'Frieda', speciesKey: 'adoptTreeData.species.spruce', emoji: '🌲' },
  { name: 'Olaf', speciesKey: 'adoptTreeData.species.oak', emoji: '🌳' },
  { name: 'Gertrude', speciesKey: 'adoptTreeData.species.beech', emoji: '🍃' },
  { name: 'Horst', speciesKey: 'adoptTreeData.species.chestnut', emoji: '🌰' },
  { name: 'Lieselotte', speciesKey: 'adoptTreeData.species.linden', emoji: '🌱' },
  { name: 'Günther', speciesKey: 'adoptTreeData.species.maple', emoji: '🍁' },
  { name: 'Bärbel', speciesKey: 'adoptTreeData.species.ash', emoji: '🌿' },
  { name: 'Helmut', speciesKey: 'adoptTreeData.species.elm', emoji: '🌳' },
  { name: 'Rosemarie', speciesKey: 'adoptTreeData.species.plane', emoji: '🍂' },
  { name: 'Siegfried', speciesKey: 'adoptTreeData.species.fir', emoji: '🌲' },
  { name: 'Hildegard', speciesKey: 'adoptTreeData.species.willow', emoji: '🌾' },
  { name: 'Klaus-Dieter', speciesKey: 'adoptTreeData.species.robinia', emoji: '🌳' },
  { name: 'Brunhilde', speciesKey: 'adoptTreeData.species.alder', emoji: '🌿' },
  { name: 'Detlef', speciesKey: 'adoptTreeData.species.poplar', emoji: '🍃' },
]

const funFactKeys: string[] = [
  'adoptTreeData.funFacts.cooling',
  'adoptTreeData.funFacts.oxygen',
  'adoptTreeData.funFacts.dust',
  'adoptTreeData.funFacts.roots',
  'adoptTreeData.funFacts.co2',
  'adoptTreeData.funFacts.woodWideWeb',
  'adoptTreeData.funFacts.lifetime',
  'adoptTreeData.funFacts.noise',
  'adoptTreeData.funFacts.water',
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
    factKey: pickRandom(funFactKeys),
    certNumber: `GE-${prefix}-${num}`,
    plantedYear: 2010 + Math.floor(Math.random() * 16),
    treeVariant,
  }
}
