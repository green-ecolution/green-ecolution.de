import { Droplets, Thermometer } from 'lucide-react'
import type { ComponentType } from 'react'

export type SensorSpecId = 'depths' | 'network' | 'batteryLife'
export type SensorFeatureId = 'soilMoisture' | 'temperature'

interface SensorFeature {
  id: SensorFeatureId
  icon: ComponentType<{ className?: string }>
}

export const sensorSpecs: SensorSpecId[] = ['depths', 'network', 'batteryLife']

export const sensorFeatures: SensorFeature[] = [
  { id: 'soilMoisture', icon: Droplets },
  { id: 'temperature', icon: Thermometer },
]
