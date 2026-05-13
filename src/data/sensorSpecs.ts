import { Droplets, Thermometer, Gauge } from 'lucide-react'
import { ComponentType } from 'react'

interface SensorSpec {
  value: string
  label: string
}

interface SensorFeature {
  label: string
  description: string
  icon: ComponentType<{ className?: string }>
}

export const sensorSpecs: SensorSpec[] = [
  { value: '3', label: 'data.sensorSpecs.specs.depths' },
  { value: 'LoRaWAN', label: 'data.sensorSpecs.specs.network' },
  { value: '3+', label: 'data.sensorSpecs.specs.battery' },
]

export const sensorFeatures: SensorFeature[] = [
  {
    label: 'data.sensorSpecs.features.soilMoisture.label',
    description: 'data.sensorSpecs.features.soilMoisture.description',
    icon: Droplets,
  },
  {
    label: 'data.sensorSpecs.features.temperature.label',
    description: 'data.sensorSpecs.features.temperature.description',
    icon: Thermometer,
  },
  {
    label: 'data.sensorSpecs.features.waterTension.label',
    description: 'data.sensorSpecs.features.waterTension.description',
    icon: Gauge,
  },
]
