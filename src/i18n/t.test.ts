import { describe, expect, it } from 'vitest'
import { getTranslations } from './t'
import { MISSING_PREFIX } from './resolve'

describe('getTranslations', () => {
  it('liest einen deutschen Schlüssel aus dem echten Katalog', () => {
    const t = getTranslations('de', 'releases')
    expect(t('overview.title')).toBe('Release Notes')
  })

  it('liefert für dieselbe Stelle einen anderen englischen Text', () => {
    const de = getTranslations('de', 'releases')
    const en = getTranslations('en', 'releases')
    // Not overview.eyebrow: that reads "Releases" in both languages.
    expect(de('overview.currentReleaseLabel')).toBe('Aktuelles Release')
    expect(en('overview.currentReleaseLabel')).not.toBe(de('overview.currentReleaseLabel'))
  })

  it('interpoliert die Version in den Changelog-Kopf', () => {
    const t = getTranslations('de', 'releases')
    expect(t('changelog.fileHeader', { version: '0.5.0' })).toContain('0.5.0')
  })

  it('wählt Singular und Plural über count', () => {
    const t = getTranslations('de', 'releases')
    expect(t('stats.features', { count: 1 })).toBe('1 neue Funktion')
    expect(t('stats.features', { count: 3 })).toBe('3 neue Funktionen')
  })

  it('markiert einen Schlüssel, den es nicht gibt', () => {
    const t = getTranslations('de', 'releases')
    // @ts-expect-error der Schlüssel ist absichtlich nicht Teil des Katalogs
    expect(t('overview.doesNotExist')).toBe(`${MISSING_PREFIX}overview.doesNotExist`)
  })

  it('kennt jeden Namespace, den das Parity-Skript prüft', () => {
    const namespaces = ['common', 'home', 'product', 'streamlet', 'contact', 'releases', 'legal']
    for (const namespace of namespaces) {
      const t = getTranslations('de', namespace as 'common')
      expect(typeof t).toBe('function')
    }
  })
})
