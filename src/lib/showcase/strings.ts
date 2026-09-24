import type { Scene } from '../../data/showcase'
import type { TranslationKey } from '../../i18n/t'

const SCENE_FIELDS = ['statement', 'body', 'source', 'eyebrow'] as const

const CHROME_KEYS = [
  'steps.messen',
  'steps.verstehen',
  'steps.handeln',
  'demo.label',
  'demo.url',
  'tooSmall.eyebrow',
  'tooSmall.statement',
  'tooSmall.body',
  'tooSmall.viewport',
  'tooSmall.continue',
  'gauge.tankLabel',
  ...['website', 'instagram'].flatMap((link) => [`links.${link}.label`, `links.${link}.value`]),
  ...['website', 'email', 'github', 'demo', 'instagram'].flatMap((contact) => [
    `contact.${contact}.label`,
    `contact.${contact}.value`,
  ]),
]

/**
 * Every key a run might read, whether or not each scene defines it: a missing
 * key renders as a visible marker rather than throwing, and the catalog decides
 * which fields actually exist.
 *
 * Shared by the booth board and the 30-second spot, which carry different
 * scenes but the same persistent elements.
 */
export function showcaseStringKeys(scenes: Scene[]): TranslationKey<'showcase'>[] {
  return [
    ...scenes.flatMap((scene) => SCENE_FIELDS.map((field) => `scenes.${scene.id}.${field}`)),
    ...CHROME_KEYS,
  ] as TranslationKey<'showcase'>[]
}
