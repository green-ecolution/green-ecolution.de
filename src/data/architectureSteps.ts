import { Radio, Wifi, Server, LayoutDashboard } from 'lucide-react'
import { ComponentType } from 'react'

interface ArchitectureStep {
  label: string
  description: string
  icon: ComponentType<{ className?: string }>
  color: 'green-light' | 'green-middle' | 'green-dark'
}

export const architectureSteps: ArchitectureStep[] = [
  {
    label: 'data.architectureSteps.sensor.label',
    description: 'data.architectureSteps.sensor.description',
    icon: Radio,
    color: 'green-dark',
  },
  {
    label: 'data.architectureSteps.gateway.label',
    description: 'data.architectureSteps.gateway.description',
    icon: Wifi,
    color: 'green-light',
  },
  {
    label: 'data.architectureSteps.backend.label',
    description: 'data.architectureSteps.backend.description',
    icon: Server,
    color: 'green-middle',
  },
  {
    label: 'data.architectureSteps.dashboard.label',
    description: 'data.architectureSteps.dashboard.description',
    icon: LayoutDashboard,
    color: 'green-dark',
  },
]
