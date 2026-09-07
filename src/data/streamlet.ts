import {
  Boxes,
  Clock,
  Container,
  Droplets,
  Fuel,
  GitBranch,
  Layers,
  MapPin,
  Repeat,
  Scale,
  ServerCog,
  Truck,
  Warehouse,
} from 'lucide-react'
import type { ComponentType } from 'react'

type Icon = ComponentType<{ className?: string }>

export const streamletLinks = {
  repo: 'https://github.com/green-ecolution/streamlet',
  readme: 'https://github.com/green-ecolution/streamlet#readme',
  issues: 'https://github.com/green-ecolution/streamlet/issues',
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

export type SolveFlowStepId = 'send' | 'solve' | 'receive'

interface SolveFlowStep {
  id: SolveFlowStepId
  step: string
}

export const solveFlowSteps: SolveFlowStep[] = [
  { id: 'send', step: '01' },
  { id: 'solve', step: '02' },
  { id: 'receive', step: '03' },
]

export type ApiEndpointId = 'solve' | 'health' | 'openapi'

interface ApiEndpoint {
  id: ApiEndpointId
  method: string
  path: string
}

export const apiEndpoints: ApiEndpoint[] = [
  { id: 'solve', method: 'POST', path: '/v1/solve' },
  { id: 'health', method: 'GET', path: '/health' },
  { id: 'openapi', method: 'GET', path: '/api-docs/openapi.json' },
]

export type SolverStageId = 'construction' | 'localSearch'

interface SolverStage {
  id: SolverStageId
  icon: Icon
}

export const solverStages: SolverStage[] = [
  { id: 'construction', icon: Boxes },
  { id: 'localSearch', icon: GitBranch },
]

export const solverMoveEvaluationIcon: Icon = Layers

interface Benchmark {
  instance: string
  gap: number
}

export const solverBenchmarks: Benchmark[] = [
  { instance: 'c101', gap: 3.1 },
  { instance: 'r101', gap: 1.9 },
  { instance: 'rc101', gap: 1.5 },
]

export type TileChangesetId = 'construction' | 'allowedPaths'

export interface TileChangeset {
  id: TileChangesetId
  name: string
  status: 'available' | 'inProgress'
}

export const tileChangesets: TileChangeset[] = [
  { id: 'construction', name: 'construction', status: 'available' },
  { id: 'allowedPaths', name: 'allowed-paths', status: 'inProgress' },
]

export type OperationsFactId = 'stateless' | 'swappableEngine' | 'separateCrate' | 'license'

interface OperationsFact {
  id: OperationsFactId
  icon: Icon
}

export const operationsFacts: OperationsFact[] = [
  { id: 'stateless', icon: ServerCog },
  { id: 'swappableEngine', icon: Repeat },
  { id: 'separateCrate', icon: Layers },
  { id: 'license', icon: Scale },
]

export type StreamletLimitationId = 'geometry' | 'depots' | 'missingFeatures'

export const streamletLimitations: StreamletLimitationId[] = [
  'geometry',
  'depots',
  'missingFeatures',
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

export type TechSectionId = 'api' | 'solver' | 'tiles' | 'operations'

export const techSections: TechSectionId[] = ['api', 'solver', 'tiles', 'operations']
