import { Building2, ClipboardList, Server, Truck } from 'lucide-react'
import type { ComponentType } from 'react'

type Icon = ComponentType<{ className?: string }>

export type TargetGroupId = 'municipality' | 'operations' | 'field' | 'it'

interface TargetGroup {
  id: TargetGroupId
  icon: Icon
}

export const targetGroups: TargetGroup[] = [
  { id: 'municipality', icon: Building2 },
  { id: 'operations', icon: ClipboardList },
  { id: 'field', icon: Truck },
  { id: 'it', icon: Server },
]
