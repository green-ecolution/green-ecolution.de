import { Cpu, LifeBuoy, MonitorSmartphone } from 'lucide-react'
import type { ComponentType } from 'react'

type Icon = ComponentType<{ className?: string }>

export type ProductScopeColumnId = 'software' | 'hardware' | 'services'

interface ProductScopeColumn {
  id: ProductScopeColumnId
  icon: Icon
}

export const productScopeColumns: ProductScopeColumn[] = [
  { id: 'software', icon: MonitorSmartphone },
  { id: 'hardware', icon: Cpu },
  { id: 'services', icon: LifeBuoy },
]
