import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { useReducedMotion } from '../../../hooks/useReducedMotion'
import { supportsWebgl } from '../../../lib/webgl'
import type { StorySource } from './shared'

const StoryScene3D = lazy(() => import('./StoryScene3D'))

let webgl: boolean | undefined

// The server has no canvas to ask, so the answer only exists after hydration.
function hasWebgl() {
  webgl ??= supportsWebgl()
  return webgl
}

function subscribeToNothing() {
  return () => undefined
}

// The 3d view of the story. It only draws: the script in howItWorks.ts writes
// the progress to [data-story-root], and this reads it there.
export default function StoryIsland() {
  const host = useRef<HTMLDivElement>(null)
  const source = useRef<StorySource>({ target: 0, still: null, onChange: null })
  const prefersReducedMotion = useReducedMotion()
  const canRenderModel = useSyncExternalStore(subscribeToNothing, hasWebgl, () => false)
  const [isActive, setIsActive] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const markReady = useCallback(() => setIsReady(true), [])

  useEffect(() => {
    const root = host.current?.closest<HTMLElement>('[data-story-root]')
    if (!root) return

    root.dataset.storyView = canRenderModel ? 'model' : 'poster'
    if (!canRenderModel) return

    let onScreen = true

    const read = () => {
      const progress = Number.parseFloat(root.style.getPropertyValue('--story'))
      if (Number.isFinite(progress)) source.current.target = progress
      const still = root.dataset.storyStill
      source.current.still = still === undefined ? null : Number(still)
      source.current.onChange?.()
      setIsActive(onScreen)
    }

    const attributes = new MutationObserver(read)
    attributes.observe(root, {
      attributes: true,
      attributeFilter: ['style', 'data-story-still'],
    })

    const viewport = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      read()
    })
    viewport.observe(root)
    read()

    return () => {
      attributes.disconnect()
      viewport.disconnect()
    }
  }, [canRenderModel])

  useEffect(() => {
    host.current
      ?.closest<HTMLElement>('[data-story-root]')
      ?.toggleAttribute('data-model-ready', isReady)
  }, [isReady])

  return (
    <div
      ref={host}
      data-ready={String(isReady)}
      className="absolute inset-0 opacity-0 transition-opacity duration-500 data-[ready=true]:opacity-100"
    >
      {canRenderModel && (
        <Suspense fallback={null}>
          <StoryScene3D
            isStatic={prefersReducedMotion}
            isActive={isActive}
            source={source}
            onReady={markReady}
          />
        </Suspense>
      )}
    </div>
  )
}
