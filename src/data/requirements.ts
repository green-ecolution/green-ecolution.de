import { Database, Radio, Server, Truck } from 'lucide-react'
import type { ComponentType } from 'react'

type Icon = ComponentType<{ className?: string }>

export type RequirementId = 'treeData' | 'fleet' | 'network' | 'hosting'

interface RequirementItem {
  id: RequirementId
  icon: Icon
}

export const requirementItems: RequirementItem[] = [
  { id: 'treeData', icon: Database },
  { id: 'fleet', icon: Truck },
  { id: 'network', icon: Radio },
  { id: 'hosting', icon: Server },
]
