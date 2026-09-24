import { describe, expect, it } from 'vitest'
import { STEP_ORDER } from './showcase'
import { SPOT_SECONDS, spotScenes } from './showcaseSpot'
import { totalDurationMs } from '../lib/showcase/timeline'
import de from '../i18n/locales/de/showcase.json'
import en from '../i18n/locales/en/showcase.json'

// The shortest recording the booth ever gets, per docs/showcase-booth.md. A
// scene that would run past the end of its clip has to seek less far in.
const SHORTEST_CLIP_SECONDS = 12

const catalogs = { de, en } as Record<string, { scenes: Record<string, Record<string, string>> }>

describe('spotScenes', () => {
  it('läuft exakt die Länge, die die Werbewand bekommt', () => {
    expect(totalDurationMs(spotScenes)).toBe(SPOT_SECONDS * 1000)
  })

  it('gibt jeder Szene mindestens vier Sekunden zum Lesen', () => {
    for (const scene of spotScenes) {
      expect(scene.seconds).toBeGreaterThanOrEqual(4)
    }
  })

  it('durchläuft die drei Schritte in ihrer Reihenfolge', () => {
    const steps = spotScenes.flatMap((scene) => (scene.step ? [scene.step] : []))
    expect(steps).toEqual(STEP_ORDER)
  })

  it('hält jeden Clip-Ausschnitt innerhalb der Aufnahme', () => {
    for (const scene of spotScenes) {
      if (scene.visual.kind !== 'video') continue
      const startAt = scene.visual.startAt ?? 0
      expect(startAt).toBeGreaterThanOrEqual(0)
      expect(startAt + scene.seconds).toBeLessThanOrEqual(SHORTEST_CLIP_SECONDS)
    }
  })

  it('endet auf einer Karte mit Adressen statt auf einem Schnitt', () => {
    const last = spotScenes[spotScenes.length - 1]
    expect(last.layout).toBe('closing')
    expect(last.contacts?.length).toBeGreaterThan(0)
  })
})

describe('Texte der Spot-Szenen', () => {
  // The layouts print statement and body unconditionally: a key the catalog
  // does not carry would show up on the wall as the resolver's '??' marker.
  for (const [language, catalog] of Object.entries(catalogs)) {
    it(`sind auf ${language} für jede Szene vorhanden`, () => {
      for (const scene of spotScenes) {
        const texts = catalog.scenes[scene.id]
        expect(texts, `${scene.id} fehlt im ${language}-Katalog`).toBeDefined()
        expect(texts.statement?.length).toBeGreaterThan(0)
        expect(texts.body?.length).toBeGreaterThan(0)
        if (scene.opensStep) expect(texts.eyebrow?.length).toBeGreaterThan(0)
      }
    })

    it(`bleiben auf ${language} kurz genug für die Vorbeigehenden`, () => {
      for (const scene of spotScenes) {
        const { statement, body } = catalog.scenes[scene.id]
        expect(statement.split(/\s+/).length, `${scene.id}: statement`).toBeLessThanOrEqual(8)
        expect(body.split(/\s+/).length, `${scene.id}: body`).toBeLessThanOrEqual(14)
      }
    })
  }
})
