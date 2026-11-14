import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
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

interface BoundaryProps {
  onError: () => void
  children: ReactNode
}

// A scene that cannot be fetched or started leaves the stills standing.
class SceneBoundary extends Component<BoundaryProps, { hasFailed: boolean }> {
  state = { hasFailed: false }

  static getDerivedStateFromError() {
    return { hasFailed: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    return this.state.hasFailed ? null : this.props.children
  }
}

interface Props {
  labels: string[]
}

// The 3d view of the story. It only draws: the script in howItWorks.ts writes
// the progress to [data-story-root], and this reads it there.
export default function StoryIsland({ labels }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const labelNodes = useRef<(HTMLElement | null)[]>([])
  const source = useRef<StorySource>({ target: 0, still: null, onChange: null })
  const prefersReducedMotion = useReducedMotion()
  const canRenderModel = useSyncExternalStore(subscribeToNothing, hasWebgl, () => false)
  const [isActive, setIsActive] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const [hasFailed, setHasFailed] = useState(false)
  const markReady = useCallback(() => setIsReady(true), [])
  const markFailed = useCallback(() => setHasFailed(true), [])

  useEffect(() => {
    const root = host.current?.closest<HTMLElement>('[data-story-root]')
    if (!root || !canRenderModel) return

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
    const root = host.current?.closest<HTMLElement>('[data-story-root]')
    root?.toggleAttribute('data-model-ready', isReady)
    root?.toggleAttribute('data-model-failed', hasFailed)
  }, [isReady, hasFailed])

  return (
    <div
      ref={host}
      data-ready={String(isReady)}
      className="absolute inset-0 opacity-0 transition-opacity duration-500 data-[ready=true]:opacity-100"
    >
      {canRenderModel && (
        <>
          <SceneBoundary onError={markFailed}>
            <Suspense fallback={null}>
              <StoryScene3D
                isStatic={prefersReducedMotion}
                isActive={isActive}
                source={source}
                labels={labelNodes}
                onReady={markReady}
              />
            </Suspense>
          </SceneBoundary>

          {labels.map((label, index) => (
            <span
              key={label}
              ref={(node) => {
                labelNodes.current[index] = node
              }}
              data-story-label
              data-shown="false"
              className="pointer-events-none absolute left-0 top-0 whitespace-nowrap rounded-full bg-white/95 px-2.5 py-1 font-lato text-xs font-semibold text-grey-900 opacity-0 shadow-sm ring-1 ring-green-dark-900/10 transition-opacity duration-300 data-[shown=true]:opacity-100"
            >
              {label}
            </span>
          ))}
        </>
      )}
    </div>
  )
}
