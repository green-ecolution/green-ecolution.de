import { Cpu, LifeBuoy, MonitorSmartphone, Puzzle, Route, Wrench } from 'lucide-react'
import type { ComponentType } from 'react'

type Icon = ComponentType<{ className?: string }>

export type ServiceScopeItemId =
  'software' | 'sensors' | 'setup' | 'operation' | 'extension' | 'tourOptimization'

interface ServiceScopeItem {
  id: ServiceScopeItemId
  icon: Icon
  // Language-free path; the component prefixes the language.
  path?: string
}

export const serviceScopeItems: ServiceScopeItem[] = [
  { id: 'software', icon: MonitorSmartphone },
  { id: 'sensors', icon: Cpu },
  { id: 'setup', icon: Wrench },
  { id: 'operation', icon: LifeBuoy },
  { id: 'extension', icon: Puzzle },
  { id: 'tourOptimization', icon: Route, path: '/streamlet' },
]
