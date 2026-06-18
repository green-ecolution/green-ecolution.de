interface RoadmapItem {
  title: string
  description: string
  status: 'planned' | 'in-progress' | 'completed'
}

export const roadmapItems: RoadmapItem[] = [
  {
    title: 'data.roadmapItems.mobileApp.title',
    description: 'data.roadmapItems.mobileApp.description',
    status: 'in-progress',
  },
  {
    title: 'data.roadmapItems.sensorFirmware.title',
    description: 'data.roadmapItems.sensorFirmware.description',
    status: 'planned',
  },
  {
    title: 'data.roadmapItems.roles.title',
    description: 'data.roadmapItems.roles.description',
    status: 'planned',
  },
  {
    title: 'data.roadmapItems.openData.title',
    description: 'data.roadmapItems.openData.description',
    status: 'planned',
  },
  {
    title: 'data.roadmapItems.greenSpaceTypes.title',
    description: 'data.roadmapItems.greenSpaceTypes.description',
    status: 'planned',
  },
]
