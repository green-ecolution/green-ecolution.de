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
  { value: '3', label: 'Messtiefen' },
  { value: 'LoRaWAN', label: 'Funknetz' },
  { value: '3+', label: 'Jahre Batterie' },
]

export const sensorFeatures: SensorFeature[] = [
  {
    label: 'Bodenfeuchte',
    description: 'Volumetrische Messung der Bodenfeuchtigkeit in mehreren Tiefen',
    icon: Droplets,
  },
  {
    label: 'Temperatur',
    description: 'Erfassung der Bodentemperatur für präzise Bewässerungsempfehlungen',
    icon: Thermometer,
  },
  {
    label: 'Bodenwasserspannung',
    description: 'Messung der Saugspannung zur Bestimmung der Wasserverfügbarkeit',
    icon: Gauge,
  },
]
