import { describe, expect, it } from 'vitest'
import {
  AUTO_STORY_MS,
  autoStoryProgress,
  pinsShown,
  progressAt,
  progressForAct,
  progressForExample,
  stillProgress,
  storyState,
  storyStill,
} from './storyTimeline'

describe('storyState', () => {
  it('beginnt nah am Baum, ohne Sensor und ohne Punkte', () => {
    const state = storyState(0)
    expect(state.act).toBe(0)
    expect(state.camera).toEqual({ from: 'tree', to: 'tree', blend: 1 })
    expect(state.sensorDrop).toBe(0)
    expect(state.pins).toBe(0)
    expect(state.vehicle.shown).toBe(0)
  })

  it('ordnet den Fortschritt den vier Akten nach ihrem Gewicht zu', () => {
    expect(storyState(progressAt(0, 0.5)).act).toBe(0)
    expect(storyState(progressAt(1, 0.01)).act).toBe(1)
    expect(storyState(progressAt(2, 0.01)).act).toBe(2)
    expect(storyState(progressAt(3, 0.01)).act).toBe(3)
    expect(storyState(1)).toMatchObject({ act: 3, actProgress: 1 })
  })

  it('hat den Sensor am Ende des ersten Akts gesetzt und auf Sendung', () => {
    const state = storyState(progressAt(0, 0.9))
    expect(state.sensorDrop).toBe(1)
    expect(state.signal).toBe(1)
  })

  it('fährt im zweiten Akt zurück und zeigt dann die Punkte, unseren zuletzt', () => {
    expect(storyState(progressAt(1, 0.5)).camera).toEqual({ from: 'tree', to: 'town', blend: 1 })
    expect(storyState(progressAt(1, 0.3)).pins).toBe(0)
    const end = storyState(progressAt(1, 0.9))
    expect(end.pins).toBe(1)
    expect(end.alert).toBe(true)
  })

  it('zeichnet im dritten Akt erst die Tour und lässt dann das Fahrzeug fahren', () => {
    const middle = storyState(progressAt(2, 0.5))
    expect(middle.route).toBe(1)
    expect(middle.drive).toBeGreaterThan(0)
    expect(middle.drive).toBeLessThan(1)
    expect(middle.vehicle).toMatchObject({ route: 'tour', shown: 1 })
  })

  it('hat am Ende des dritten Akts gegossen und den Baum erholt', () => {
    const end = storyState(progressAt(2, 0.999))
    expect(end.drive).toBe(1)
    expect(end.watering).toBe(1)
    expect(end.health).toBeGreaterThan(0.99)
    expect(end.alert).toBe(false)
    expect(end.camera.to).toBe('watering')
  })

  it('nimmt nichts zurück, was einmal passiert ist', () => {
    const keys = ['sensorDrop', 'pins', 'route', 'drive', 'health'] as const
    let previous = storyState(0)
    for (let step = 1; step <= 100; step++) {
      const state = storyState(step / 100)
      for (const key of keys) expect(state[key]).toBeGreaterThanOrEqual(previous[key])
      previous = state
    }
  })

  it('besucht im Finale die Beispiele nacheinander', () => {
    const state = storyState(progressForExample(1))
    expect(state.activeExample).toBe(1)
    expect(state.camera.to).toBe('winter')
    expect(state.examples[0].resolved).toBe(true)
    expect(state.examples[1]).toMatchObject({ alert: true, resolved: false })
    expect(state.examples[2]).toEqual({ signal: 0, alert: false, resolved: false })
    expect(state.vehicle.route).toBe(1)
  })

  it('endet auf der ganzen Stadt mit der Einladung', () => {
    const state = storyState(1)
    expect(state.activeExample).toBeNull()
    expect(state.examples.every((example) => example.resolved)).toBe(true)
    expect(state.camera).toEqual({ from: 'rain', to: 'town', blend: 1 })
    expect(state.invite).toBe(1)
    expect(state.vehicle.shown).toBe(0)
  })
})

describe('Sprungziele', () => {
  it('landen im jeweiligen Akt', () => {
    for (const act of [0, 1, 2, 3]) expect(storyState(progressForAct(act)).act).toBe(act)
  })

  it('landen beim jeweiligen Beispiel, wenn es Alarm zeigt', () => {
    for (const example of [0, 1, 2]) {
      const state = storyState(progressForExample(example))
      expect(state.activeExample).toBe(example)
      expect(state.examples[example].alert).toBe(true)
    }
  })
})

describe('storyStill', () => {
  it('zeigt je Akt dessen Endzustand', () => {
    expect(storyStill(0).sensorDrop).toBe(1)
    expect(storyStill(1).pins).toBe(1)
    expect(storyStill(2).health).toBeGreaterThan(0.99)
    expect(storyState(stillProgress(2)).act).toBe(2)
  })

  it('zeigt im Finale alle drei Beispiele zugleich im Alarm', () => {
    const still = storyStill(3)
    expect(still.camera).toEqual({ from: 'rain', to: 'town', blend: 1 })
    expect(still.examples).toEqual([
      { signal: 1, alert: true, resolved: false },
      { signal: 1, alert: true, resolved: false },
      { signal: 1, alert: true, resolved: false },
    ])
  })
})

describe('pinsShown', () => {
  it('zählt die sichtbaren Punkte', () => {
    expect(pinsShown(0, 8)).toBe(0)
    expect(pinsShown(0.5, 8)).toBe(4)
    expect(pinsShown(1, 8)).toBe(8)
  })
})

describe('autoStoryProgress', () => {
  it('läuft linear durch und bleibt am Ende stehen', () => {
    expect(autoStoryProgress(0)).toBe(0)
    expect(autoStoryProgress(AUTO_STORY_MS / 2)).toBe(0.5)
    expect(autoStoryProgress(AUTO_STORY_MS * 3)).toBe(1)
  })
})
