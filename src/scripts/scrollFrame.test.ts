// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { bindScrollFrame } from './scrollFrame'

describe('bindScrollFrame', () => {
  let frames: FrameRequestCallback[] = []
  const nextFrame = () => {
    const due = frames
    frames = []
    due.forEach((callback) => callback(0))
  }

  beforeEach(() => {
    frames = []
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.push(callback)
      return frames.length
    })
    vi.stubGlobal('cancelAnimationFrame', () => {
      frames = []
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('runs every read of a frame before the first write', () => {
    const page = new AbortController()
    const order: string[] = []
    for (const name of ['a', 'b']) {
      bindScrollFrame(
        { read: () => order.push(`read ${name}`), write: () => order.push(`write ${name}`) },
        page.signal,
      )
    }

    window.dispatchEvent(new Event('scroll'))
    nextFrame()

    expect(order).toEqual(['read a', 'read b', 'write a', 'write b'])
    page.abort()
  })

  test('asks for a single frame however many scroll events arrive', () => {
    const page = new AbortController()
    const write = vi.fn()
    bindScrollFrame({ write }, page.signal)

    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('resize'))

    expect(frames).toHaveLength(1)
    nextFrame()
    expect(write).toHaveBeenCalledTimes(1)
    page.abort()
  })

  test('runs only the task that asked for a frame itself', () => {
    const page = new AbortController()
    const asked = vi.fn()
    const other = vi.fn()
    const schedule = bindScrollFrame({ write: asked }, page.signal)
    bindScrollFrame({ write: other }, page.signal)

    schedule()
    nextFrame()

    expect(asked).toHaveBeenCalledTimes(1)
    expect(other).not.toHaveBeenCalled()
    page.abort()
  })

  test('stops running a task once its page is gone', () => {
    const page = new AbortController()
    const write = vi.fn()
    bindScrollFrame({ write }, page.signal)

    window.dispatchEvent(new Event('scroll'))
    page.abort()
    nextFrame()
    window.dispatchEvent(new Event('scroll'))
    nextFrame()

    expect(write).not.toHaveBeenCalled()
  })
})
