import { Clock, Container, Droplets, Fuel, MapPin, Repeat, Truck, Warehouse } from 'lucide-react'
import type { ComponentType } from 'react'

type Icon = ComponentType<{ className?: string }>

export const streamletLinks = {
  repo: 'https://github.com/green-ecolution/streamlet',
} as const

export type FitCriterionId =
  'tankCapacity' | 'timeWindows' | 'midTourRefill' | 'multipleStations' | 'depotReturn'

interface FitCriterion {
  id: FitCriterionId
  icon: Icon
}

export const fitCriteria: FitCriterion[] = [
  { id: 'tankCapacity', icon: Container },
  { id: 'timeWindows', icon: Clock },
  { id: 'midTourRefill', icon: Fuel },
  { id: 'multipleStations', icon: Repeat },
  { id: 'depotReturn', icon: Warehouse },
]

export type BenefitNeedId = 'stops' | 'fleet' | 'refill'

interface BenefitNeed {
  id: BenefitNeedId
  icon: Icon
}

export const benefitNeeds: BenefitNeed[] = [
  { id: 'stops', icon: MapPin },
  { id: 'fleet', icon: Truck },
  { id: 'refill', icon: Droplets },
]
