import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { DEPOT_SITE, START_DAYS, townTrees, treeOfSite } from '../../../data/productTown'
import { useReducedMotion } from '../../../hooks/useReducedMotion'
import { TranslationProvider } from '../../../i18n/TranslationProvider'
import { useT } from '../../../i18n/useT'
import { supportsWebgl } from '../../../lib/webgl'
import {
  StepHeading,
  TankGauge,
  TourButton,
  TourControls,
  TreeList,
  WeatherSlider,
} from './DayPanel'
import {
  NOT_STARTED,
  NOT_WATERED,
  NO_ORDER,
  dayStatus,
  finished,
  planDay,
  tankShare,
  treeRows,
  wateredAfter,
  type DayPhase,
  type PlannedDay,
} from './dayModel'
import type { DayEvents, DayLive, TourProgress } from './shared'

interface Poster {
  src: string
  width: number
  height: number
}

interface Props {
  strings: Record<string, string>
  poster?: Poster
}

interface Tour extends PlannedDay {
  /** Latched at plan time: whether a scene drives this tour or it ends at once. */
  played: boolean
}

const WateringDayScene3D = lazy(() => import('./WateringDayScene3D'))

// The fixed page header is 84 px high on a phone; the stage sits just below it.
const HEADER_CLEARANCE = 96

function setTank(node: HTMLElement | null, share: number) {
  node?.style.setProperty('--day-tank', String(share))
}

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

// A scene that cannot be fetched or started leaves the panel working on its own.
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

const labelBase =
  'pointer-events-none absolute left-0 top-0 whitespace-nowrap opacity-0 transition-opacity duration-300 data-[shown=true]:opacity-100'
const tagLabel = `${labelBase} rounded-full bg-white/95 px-2.5 py-1 font-lato text-xs font-semibold text-grey-900 shadow-sm ring-1 ring-green-dark-900/10`
const numberLabel = `${labelBase} flex h-5 w-5 items-center justify-center rounded-full bg-grey-900 text-[11px] font-bold text-white`

function WateringDay({ poster }: { poster?: Poster }) {
  const t = useT()
  const [days, setDays] = useState(START_DAYS)
  const [day, setDay] = useState<Tour | null>(null)
  const [progress, setProgress] = useState<TourProgress>(NOT_STARTED)
  const [selected, setSelected] = useState<number | null>(null)
  const [highlighted, setHighlighted] = useState<number | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const stageNode = useRef<HTMLDivElement>(null)
  const labelNodes = useRef<(HTMLElement | null)[]>([])
  const live = useRef<DayLive>({
    days: START_DAYS,
    watered: NOT_WATERED,
    order: NO_ORDER,
    selected: null,
    highlighted: null,
    script: null,
    elapsed: 0,
    running: false,
    onChange: null,
  })
  const prefersReducedMotion = useReducedMotion()
  const canRenderModel = useSyncExternalStore(subscribeToNothing, hasWebgl, () => false)
  const [isActive, setIsActive] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [hasFailed, setHasFailed] = useState(false)
  const events = useMemo<DayEvents>(
    () => ({
      onReady: () => setIsReady(true),
      onProgress: (next: TourProgress) => setProgress(next),
      onSelect: (tree) => setSelected(tree),
    }),
    [],
  )
  const playsTour = canRenderModel && isReady && !hasFailed && !prefersReducedMotion

  // A tour planned without a scene is over and stays so. One that was played
  // also ends when its scene can no longer play it, since nothing would
  // advance it any more.
  const isUnplayed = day !== null && (!day.played || !playsTour)
  const tour = day && isUnplayed ? finished(day.script) : progress
  const phase: DayPhase = !day ? 'idle' : tour.done ? 'done' : 'touring'
  const watered = useMemo(
    () => (day ? wateredAfter(day.script, tour.served) : NOT_WATERED),
    [day, tour.served],
  )
  const order = day?.order ?? NO_ORDER
  const rows = useMemo(() => treeRows(days, watered, order), [days, watered, order])
  const isSceneShown = canRenderModel && isReady && !hasFailed
  const status = dayStatus(phase, rows, day, tour)

  // The scene reads this ref every frame; a render must not sit in between.
  useEffect(() => {
    Object.assign(live.current, {
      days,
      watered,
      order,
      selected,
      highlighted,
      script: day?.script ?? null,
    })
    live.current.onChange?.()
  }, [days, watered, order, selected, highlighted, day])

  useEffect(() => {
    const node = stageNode.current
    if (!node) return
    const viewport = new IntersectionObserver(([entry]) => {
      setIsActive(entry.isIntersecting)
      live.current.onChange?.()
    })
    viewport.observe(node)
    return () => viewport.disconnect()
  }, [])

  const reset = () => {
    live.current.running = false
    live.current.elapsed = 0
    // The scene wrote the gauge during the tour. React may still hold a full
    // tank from before and would then not write it back.
    setTank(root.current, 1)
    setDay(null)
    setProgress(NOT_STARTED)
  }

  const changeDays = (value: number) => {
    reset()
    setDays(value)
  }

  // Works with the scene off screen too: its clock stands still there, so the
  // end state and the gauge are written here instead of waiting for a frame.
  const finishScene = useCallback((planned: PlannedDay) => {
    live.current.elapsed = planned.script.duration
    live.current.running = false
    setTank(root.current, tankShare(planned, finished(planned.script)))
    live.current.onChange?.()
  }, [])

  const finish = (planned: PlannedDay) => {
    finishScene(planned)
    setProgress(finished(planned.script))
  }

  useEffect(() => {
    if (day && isUnplayed) finishScene(day)
  }, [day, isUnplayed, finishScene])

  const showStage = () => {
    const node = stageNode.current
    if (!node) return
    const { top, bottom, height } = node.getBoundingClientRect()
    const visible = Math.min(bottom, window.innerHeight) - Math.max(top, 0)
    // Not centred: the page's scroll padding would push the stage so far down
    // that on a phone the strip under it falls out of the window.
    if (visible < height * 0.6) {
      window.scrollTo({ top: window.scrollY + top - HEADER_CLEARANCE, behavior: 'smooth' })
    }
  }

  const plan = () => {
    const planned = planDay(days)
    if (!planned) return
    setSelected(null)
    setDay({ ...planned, played: playsTour })
    // Set right away: the clock in the scene must not see the new script with
    // the old time for a frame.
    live.current.script = planned.script
    if (!playsTour) {
      finish(planned)
      return
    }
    live.current.elapsed = 0
    live.current.running = true
    setProgress(NOT_STARTED)
    live.current.onChange?.()
    // On a phone the button sits below the list, out of sight of the stage.
    showStage()
  }

  const skip = () => {
    if (day) finish(day)
  }

  const stops =
    day && isUnplayed
      ? day.script.dwells.map(({ stop }) =>
          stop.kind === 'tree'
            ? t(`day.trees.${townTrees[treeOfSite(stop.site)].id}`)
            : t(stop.site === DEPOT_SITE ? 'day.places.depot' : 'day.places.hydrant'),
        )
      : null

  const statusText = t(status.key, {
    ...status.vars,
    name: status.tree ? t(`day.trees.${status.tree}`) : '',
  })
  const tourButton = {
    phase,
    canPlan: rows.some((row) => row.state === 'dry'),
    onPlan: plan,
    onSkip: skip,
    onReset: reset,
  }

  return (
    <div
      ref={root}
      data-day-root
      style={{ '--day-tank': String(tankShare(day, tour)) } as CSSProperties}
      className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-10"
    >
      <div>
        <StepHeading
          number={1}
          title={t('day.steps.measure.title')}
          description={t('day.steps.measure.description')}
        />
        <div
          ref={stageNode}
          data-day-stage
          role="img"
          aria-label={t('day.stageAriaLabel')}
          className="relative aspect-[3/2] overflow-hidden rounded-3xl bg-green-light-100/60"
        >
          {poster && (
            <img
              data-day-poster
              data-hidden={String(isSceneShown)}
              src={poster.src}
              width={poster.width}
              height={poster.height}
              alt=""
              loading="lazy"
              decoding="async"
              className="pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-500 data-[hidden=true]:opacity-0"
            />
          )}
          {canRenderModel && !hasFailed && (
            <div
              data-ready={String(isReady)}
              className="absolute inset-0 opacity-0 transition-opacity duration-500 data-[ready=true]:opacity-100"
            >
              <SceneBoundary onError={() => setHasFailed(true)}>
                <Suspense fallback={null}>
                  <WateringDayScene3D
                    isStatic={prefersReducedMotion}
                    isActive={isActive}
                    live={live}
                    events={events}
                    labels={labelNodes}
                    tank={root}
                    isReady={isReady}
                  />
                </Suspense>
              </SceneBoundary>

              {townTrees.map((tree, index) => {
                const row = rows.find((candidate) => candidate.index === index)
                const isNamed = !day && (selected === index || highlighted === index)
                return (
                  <span
                    key={tree.id}
                    ref={(node) => {
                      labelNodes.current[index] = node
                    }}
                    data-day-label
                    data-shown="false"
                    className={isNamed ? tagLabel : numberLabel}
                  >
                    {isNamed && row
                      ? `${t(`day.trees.${tree.id}`)} · ${t(`day.states.${row.state}`)}`
                      : order[index] || ''}
                  </span>
                )
              })}
              {(['depot', 'hydrant'] as const).map((place, index) => (
                <span
                  key={place}
                  ref={(node) => {
                    labelNodes.current[townTrees.length + index] = node
                  }}
                  data-day-label
                  data-shown="false"
                  className={tagLabel}
                >
                  {t(`day.places.${place}`)}
                </span>
              ))}
            </div>
          )}
        </div>
        {phase !== 'idle' && (
          <div
            data-day-strip
            className="mt-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-grey-900/10 lg:hidden"
          >
            {/* The panel's live region announces this; here it is only for the eyes. */}
            <p aria-hidden="true" className="min-h-10 text-sm text-grey-900">
              {statusText}
            </p>
            <div className="mt-2 flex items-center gap-4">
              <TankGauge className="flex-1" />
              <TourButton {...tourButton} />
            </div>
          </div>
        )}
        <WeatherSlider days={days} onChange={changeDays} />
      </div>

      <div className="flex flex-col gap-8">
        <div>
          <StepHeading
            number={2}
            title={t('day.steps.understand.title')}
            description={t('day.steps.understand.description')}
          />
          <TreeList
            rows={rows}
            selected={selected}
            onSelect={setSelected}
            onHighlight={setHighlighted}
          />
        </div>
        <div>
          <StepHeading
            number={3}
            title={t('day.steps.act.title')}
            description={t('day.steps.act.description')}
          />
          <TourControls status={statusText} stops={stops} {...tourButton} />
        </div>
      </div>
    </div>
  )
}

// Stage and panel are one island: slider, list, tour and scene share one state,
// and astro cannot nest islands.
export default function WateringDayIsland({ strings, poster }: Props) {
  return (
    <TranslationProvider strings={strings}>
      <WateringDay poster={poster} />
    </TranslationProvider>
  )
}
