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
import { SHOWER_LEVEL } from '../../../lib/soakLevel'
import { supportsWebgl } from '../../../lib/webgl'
import type { SoakSource } from './SoilProbe3D'

const SoilProbe3D = lazy(() => import('./SoilProbe3D'))

let webgl: boolean | undefined

// The server has no canvas to ask, so the answer only exists after hydration.
function hasWebgl() {
  webgl ??= supportsWebgl()
  return webgl
}

function subscribeToNothing() {
  return () => undefined
}

interface Props {
  zones: string[]
}

// The 3d view of the probe. It only draws: the buttons and the pinned scroll
// keep writing the water level to [data-soak-root], and this reads it there.
export default function SoilProbeIsland({ zones }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const labels = useRef<(HTMLElement | null)[]>([])
  const source = useRef<SoakSource>({
    target: SHOWER_LEVEL,
    scrollDriven: false,
    onChange: null,
  })
  const prefersReducedMotion = useReducedMotion()
  const canRenderModel = useSyncExternalStore(subscribeToNothing, hasWebgl, () => false)
  const [isActive, setIsActive] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const markReady = useCallback(() => setIsReady(true), [])

  useEffect(() => {
    const root = host.current?.closest<HTMLElement>('[data-soak-root]')
    if (!root) return

    root.dataset.probeView = canRenderModel ? 'model' : 'sketch'
    if (!canRenderModel) return

    const chapter = root.closest<HTMLElement>('[data-chapter]')
    let onScreen = true

    const read = () => {
      const scrollDriven = root.hasAttribute('data-scroll-driven')
      const level = Number.parseFloat(root.style.getPropertyValue('--soak-level'))
      const pressed = root.dataset.soak === 'soak' ? 1 : SHOWER_LEVEL

      source.current.scrollDriven = scrollDriven
      source.current.target = scrollDriven && Number.isFinite(level) ? level : pressed
      source.current.onChange?.()
      setIsActive(onScreen && chapter?.dataset.active !== 'false')
    }

    const attributes = new MutationObserver(read)
    attributes.observe(root, {
      attributes: true,
      attributeFilter: ['style', 'data-soak', 'data-scroll-driven'],
    })
    if (chapter) {
      attributes.observe(chapter, { attributes: true, attributeFilter: ['data-active'] })
    }

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

  return (
    <div
      ref={host}
      aria-hidden="true"
      data-ready={String(isReady)}
      className="absolute inset-0 opacity-0 transition-opacity duration-500 data-[ready=true]:opacity-100"
    >
      {canRenderModel && (
        <>
          <Suspense fallback={null}>
            <SoilProbe3D
              isStatic={prefersReducedMotion}
              isActive={isActive}
              source={source}
              labels={labels}
              onReady={markReady}
            />
          </Suspense>

          {zones.map((zone, index) => (
            <span
              key={zone}
              ref={(label) => {
                labels.current[index] = label
              }}
              data-reached="false"
              className="group pointer-events-none absolute left-0 top-0 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/90 py-1 pl-2 pr-2.5 font-lato text-xs font-semibold text-green-dark-900 shadow-sm ring-1 ring-green-dark-900/10"
            >
              <span className="h-2 w-2 rounded-full bg-green-dark-900/20 transition-colors duration-300 group-data-[reached=true]:bg-[#3B6E8F]" />
              {zone}
            </span>
          ))}
        </>
      )}
    </div>
  )
}
