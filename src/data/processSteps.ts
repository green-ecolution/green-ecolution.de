import { Radio, Activity, LayoutDashboard, Route, Droplets } from 'lucide-react'
import { ComponentType } from 'react'

interface ProcessStep {
  label: string
  shortName: string
  description: string
  icon: ComponentType<{ className?: string }>
  color: 'green-light' | 'green-middle' | 'green-dark'
}

export const steps: ProcessStep[] = [
  {
    label: 'data.processSteps.installSensors.label',
    shortName: 'data.processSteps.installSensors.shortName',
    description: 'data.processSteps.installSensors.description',
    icon: Radio,
    color: 'green-dark',
  },
  {
    label: 'data.processSteps.collectRealtimeData.label',
    shortName: 'data.processSteps.collectRealtimeData.shortName',
    description: 'data.processSteps.collectRealtimeData.description',
    icon: Activity,
    color: 'green-light',
  },
  {
    label: 'data.processSteps.detectWateringNeed.label',
    shortName: 'data.processSteps.detectWateringNeed.shortName',
    description: 'data.processSteps.detectWateringNeed.description',
    icon: LayoutDashboard,
    color: 'green-middle',
  },
  {
    label: 'data.processSteps.planOptimizedRoutes.label',
    shortName: 'data.processSteps.planOptimizedRoutes.shortName',
    description: 'data.processSteps.planOptimizedRoutes.description',
    icon: Route,
    color: 'green-light',
  },
  {
    label: 'data.processSteps.waterAndEvaluate.label',
    shortName: 'data.processSteps.waterAndEvaluate.shortName',
    description: 'data.processSteps.waterAndEvaluate.description',
    icon: Droplets,
    color: 'green-dark',
  },
]
