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
    category: 'data.governancePillars.license.category',
    title: 'data.governancePillars.license.title',
    description: 'data.governancePillars.license.description',
    icon: Shield,
  },
  {
    category: 'data.governancePillars.sovereignty.category',
    title: 'data.governancePillars.sovereignty.title',
    description: 'data.governancePillars.sovereignty.description',
    icon: Lock,
  },
  {
    category: 'data.governancePillars.modularity.category',
    title: 'data.governancePillars.modularity.title',
    description: 'data.governancePillars.modularity.description',
    icon: Puzzle,
  },
  {
    category: 'data.governancePillars.integration.category',
    title: 'data.governancePillars.integration.title',
    description: 'data.governancePillars.integration.description',
    icon: Plug,
  },
  {
    category: 'data.governancePillars.community.category',
    title: 'data.governancePillars.community.title',
    description: 'data.governancePillars.community.description',
    icon: Users,
  },
  {
    category: 'data.governancePillars.efficiency.category',
    title: 'data.governancePillars.efficiency.title',
    description: 'data.governancePillars.efficiency.description',
    icon: PiggyBank,
  },
]
