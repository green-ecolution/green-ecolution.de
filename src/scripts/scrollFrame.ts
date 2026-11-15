// Scroll-driven scripts read the layout and then write styles. Each on its own
// animation frame, the writes of one make the reads of the next force another
// style and layout pass, several times per scrolled frame. Here every read of
// a frame runs before the first write, so a frame costs a single pass.

export interface FrameTask {
  /** Layout reads only: rects, offsets, scroll positions. */
  read?: () => void
  /** Style, class and attribute writes only. */
  write: () => void
}

interface BoundTask extends FrameTask {
  isDue: boolean
}

const tasks = new Set<BoundTask>()
let frame = 0
let listeners: AbortController | null = null

function run() {
  frame = 0
  const due = [...tasks].filter((task) => task.isDue)
  for (const task of due) task.isDue = false
  for (const task of due) task.read?.()
  for (const task of due) task.write()
}

function request() {
  if (frame === 0) frame = window.requestAnimationFrame(run)
}

function requestAll() {
  for (const task of tasks) task.isDue = true
  request()
}

/**
 * Runs `task` on every scrolled or resized frame until `signal` aborts.
 * Returns a function that asks for one more run on the next frame.
 */
export function bindScrollFrame(task: FrameTask, signal: AbortSignal): () => void {
  const bound: BoundTask = { ...task, isDue: false }
  tasks.add(bound)

  if (!listeners) {
    listeners = new AbortController()
    window.addEventListener('scroll', requestAll, { passive: true, signal: listeners.signal })
    window.addEventListener('resize', requestAll, { signal: listeners.signal })
  }

  signal.addEventListener('abort', () => {
    tasks.delete(bound)
    if (tasks.size > 0) return
    listeners?.abort()
    listeners = null
    if (frame !== 0) window.cancelAnimationFrame(frame)
    frame = 0
  })

  return () => {
    bound.isDue = true
    request()
  }
}
