import { Droplets, Eye, Route } from 'lucide-react'
import { ComponentType } from 'react'

interface WorkflowStep {
  number: string
  category: string
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
}

export const workflowSteps: WorkflowStep[] = [
  {
    number: '01',
    category: 'data.workflowSteps.measure.category',
    title: 'data.workflowSteps.measure.title',
    description: 'data.workflowSteps.measure.description',
    icon: Droplets,
  },
  {
    number: '02',
    category: 'data.workflowSteps.understand.category',
    title: 'data.workflowSteps.understand.title',
    description: 'data.workflowSteps.understand.description',
    icon: Eye,
  },
  {
    number: '03',
    category: 'data.workflowSteps.act.category',
    title: 'data.workflowSteps.act.title',
    description: 'data.workflowSteps.act.description',
    icon: Route,
  },
]
