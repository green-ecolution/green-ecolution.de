export type RoadmapItemId = 'dataPlatforms' | 'driverApp' | 'greenSpaceTypes' | 'modules'
export type RecentItemId = 'mobileApp' | 'userRoles'

interface RoadmapItem {
  id: RoadmapItemId
  status: 'planned' | 'in-progress'
}

// From the core outwards: the nearer a ring, the sooner it comes.
export const roadmapItems: RoadmapItem[] = [
  { id: 'dataPlatforms', status: 'in-progress' },
  { id: 'driverApp', status: 'planned' },
  { id: 'greenSpaceTypes', status: 'planned' },
  { id: 'modules', status: 'planned' },
]

export const recentItems: RecentItemId[] = ['mobileApp', 'userRoles']
