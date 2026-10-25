import { Shield, Lock, Users, PiggyBank } from 'lucide-react'
import type { ComponentType } from 'react'

export type GovernancePillarId = 'license' | 'sovereignty' | 'community' | 'costEfficiency'

interface GovernancePillar {
  id: GovernancePillarId
  icon: ComponentType<{ className?: string }>
}

export const governancePillars: GovernancePillar[] = [
  { id: 'license', icon: Shield },
  { id: 'sovereignty', icon: Lock },
  { id: 'community', icon: Users },
  { id: 'costEfficiency', icon: PiggyBank },
]
