import type { Language } from '../i18n/languages'

export type LogoVariantId = 'logoColor' | 'logoWhite' | 'iconColor' | 'iconWhite'

export interface PressDownload {
  format: 'svg' | 'png'
  label: string
  path: string
}

export interface LogoVariant {
  id: LogoVariantId
  file: string
  // White artwork needs a dark plate to be visible in the preview.
  onDark: boolean
  downloads: PressDownload[]
}

export const PNG_WIDTHS = [1024, 2048] as const

const LOGO_DIR = 'press/logos'

function logoVariant(id: LogoVariantId, file: string, onDark: boolean): LogoVariant {
  return {
    id,
    file,
    onDark,
    downloads: [
      { format: 'svg', label: 'SVG', path: `${LOGO_DIR}/${file}.svg` },
      ...PNG_WIDTHS.map((width) => ({
        format: 'png' as const,
        label: `PNG ${width} px`,
        path: `${LOGO_DIR}/${file}-${width}.png`,
      })),
    ],
  }
}

export const LOGO_VARIANTS: LogoVariant[] = [
  logoVariant('logoColor', 'green-ecolution-logo-color', false),
  logoVariant('logoWhite', 'green-ecolution-logo-white', true),
  logoVariant('iconColor', 'green-ecolution-icon-color', false),
  logoVariant('iconWhite', 'green-ecolution-icon-white', true),
]

export const LOGO_ZIP_PATH = `${LOGO_DIR}/green-ecolution-logos.zip`

export type PressImageId = 'fieldWork' | 'watering' | 'sensorInstall' | 'treePit' | 'team'

export interface PressImage {
  id: PressImageId
  file: string
  width: number
  height: number
  bytes: number
}

const IMAGE_DIR = 'press/images'

// Dimensions and sizes describe the originals in the bucket, not the previews
// bundled with the page. Replacing a photo means updating both.
export const PRESS_IMAGES: PressImage[] = [
  {
    id: 'fieldWork',
    file: 'green-ecolution-jungbaum-tablet.jpg',
    width: 6421,
    height: 4281,
    bytes: 27417470,
  },
  {
    id: 'watering',
    file: 'green-ecolution-bewaesserung-jungbaum.jpg',
    width: 6720,
    height: 4480,
    bytes: 23965702,
  },
  {
    id: 'sensorInstall',
    file: 'green-ecolution-sensoreinbau.jpg',
    width: 5472,
    height: 3648,
    bytes: 18291198,
  },
  {
    id: 'treePit',
    file: 'green-ecolution-baumscheibe-bagger.jpg',
    width: 5472,
    height: 3648,
    bytes: 17287517,
  },
  { id: 'team', file: 'green-ecolution-team.jpg', width: 6720, height: 4480, bytes: 18613344 },
]

export function pressImagePath(image: PressImage): string {
  return `${IMAGE_DIR}/${image.file}`
}

export const IMAGE_ZIP_PATH = `${IMAGE_DIR}/green-ecolution-pressebilder.zip`

export const IMAGE_ZIP_BYTES = PRESS_IMAGES.reduce((total, image) => total + image.bytes, 0)

const NUMBER_LOCALES: Record<Language, string> = { de: 'de-DE', en: 'en-GB' }

export function formatFileSize(bytes: number, language: Language): string {
  const megabytes = bytes / 1024 / 1024
  const rounded = megabytes >= 10 ? Math.round(megabytes) : Math.round(megabytes * 10) / 10
  return `${rounded.toLocaleString(NUMBER_LOCALES[language])} MB`
}

// Pixel counts are written without digit grouping, the way image editors and
// picture desks write them.
export function formatDimensions(image: PressImage): string {
  return `${image.width} × ${image.height} px`
}

export const PITCH_DECK_PATH = 'press/pitch-deck/green-ecolution-pitch-deck.pdf'

export function pressAssetUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${path}`
}
