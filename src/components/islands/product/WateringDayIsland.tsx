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
  HoldCard,
  StepHeading,
  TourButton,
  TourControls,
  TourHud,
  TreeList,
  WeatherSlider,
} from './DayPanel'
import {
  NOT_STARTED,
  NOT_WATERED,
  NO_ORDER,
  dayStatus,
  finished,
  holdCopy,
  planDay,
  tankShare,
  treeRows,
  wateredAfter,
  type DayPhase,
  type PlannedDay,
} from './dayModel'
import { afterHold, type HoldKind } from '../../../lib/wateringDay'
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

// Air between the fixed page header and the stage once it is scrolled into place.
const HEADER_AIR = 12
const FALLBACK_HEADER_HEIGHT = 84

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
// Large stages only; below lg the card's content stands in the strip under the stage.
const stageCard =
  'absolute bottom-3 left-3 hidden w-80 rounded-2xl bg-white/95 p-4 shadow-md ring-1 ring-green-dark-900/10 transition-[opacity,visibility] duration-200 lg:block data-[shown=false]:invisible data-[shown=false]:opacity-0'
// Shown while the scene's stage reports the ride.
const caption =
  'pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 font-lato text-xs font-semibold text-grey-900 opacity-0 shadow-sm ring-1 ring-green-dark-900/10 transition-opacity duration-500 group-data-[day-camera=ride]:opacity-100'

function WateringDay({ poster }: { poster?: Poster }) {
  const t = useT()
  const [days, setDays] = useState(START_DAYS)
  const [day, setDay] = useState<Tour | null>(null)
  const [progress, setProgress] = useState<TourProgress>(NOT_STARTED)
  const [selected, setSelected] = useState<number | null>(null)
  const [highlighted, setHighlighted] = useState<number | null>(null)
  const [hold, setHold] = useState<HoldKind | null>(null)
  // What the card in the stage shows: the coming close-up's text, kept while it fades out.
  const [lastHold, setLastHold] = useState<HoldKind>('watering')
  // The day the cards count, kept after a reset so a card fading out keeps its numbers.
  const [lastDay, setLastDay] = useState<PlannedDay | null>(null)
  const reading = useRef({ pointer: false, focus: false })
  const root = useRef<HTMLDivElement>(null)
  const stageNode = useRef<HTMLDivElement>(null)
  const pictureNode = useRef<HTMLDivElement>(null)
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
    isReading: false,
    onChange: null,
  })
  const prefersReducedMotion = useReducedMotion()
  const canRenderModel = useSyncExternalStore(subscribeToNothing, hasWebgl, () => false)
  const [isActive, setIsActive] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [hasFailed, setHasFailed] = useState(false)
  // Every way a hold can end comes through here: a flag left set would freeze the next hold.
  const stopReading = useCallback(() => {
    reading.current = { pointer: false, focus: false }
    live.current.isReading = false
  }, [])
  const events = useMemo<DayEvents>(
    () => ({
      onReady: () => setIsReady(true),
      onProgress: (next: TourProgress) => setProgress(next),
      onSelect: (tree) => setSelected(tree),
      onHold: (kind) => {
        stopReading()
        setHold(kind)
        if (kind) setLastHold(kind)
      },
      onCloseUp: (kind) => setLastHold(kind),
    }),
    [stopReading],
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
  // The stops get their numbers when the route draws, after the map has shown who needs water.
  const order = day && tour.routed ? day.order : NO_ORDER
  const rows = useMemo(() => treeRows(days, watered, order), [days, watered, order])
  const isSceneShown = canRenderModel && isReady && !hasFailed
  // A scene that went away mid-hold never reports its end; the tour state does.
  const shownHold = phase === 'touring' && !isUnplayed ? hold : null
  const status = dayStatus(phase, rows, day, tour, shownHold)

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
    stopReading()
    live.current.running = false
    live.current.elapsed = 0
    // The scene wrote the gauge during the tour. React may still hold a full
    // tank from before and would then not write it back.
    setTank(root.current, 1)
    // Cleared here: a scene off screen draws no frame that would report it.
    setHold(null)
    setDay(null)
    setProgress(NOT_STARTED)
  }

  const changeDays = (value: number) => {
    reset()
    setDays(value)
  }

  // Works with the scene off screen too: its clock stands still there, so the
  // end state and the gauge are written here instead of waiting for a frame.
  const finishScene = useCallback(
    (planned: PlannedDay) => {
      stopReading()
      live.current.elapsed = planned.script.duration
      live.current.running = false
      setTank(root.current, tankShare(planned, finished(planned.script)))
      live.current.onChange?.()
    },
    [stopReading],
  )

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
    const { top, bottom } = node.getBoundingClientRect()
    const headerBottom =
      document.getElementById('site-header')?.getBoundingClientRect().bottom ??
      FALLBACK_HEADER_HEIGHT
    // The button stands at the foot of the panel, level with the stage's foot:
    // in a low window the header cuts the stage's top while the button is in reach.
    // Not centred: the page's scroll padding would push the stage so far down
    // that on a phone the strip under it falls out of the window.
    if (top < headerBottom || bottom > window.innerHeight) {
      window.scrollTo({ top: window.scrollY + top - headerBottom - HEADER_AIR, behavior: 'smooth' })
    }
  }

  const plan = () => {
    const planned = planDay(days)
    if (!planned) return
    stopReading()
    setSelected(null)
    setDay({ ...planned, played: playsTour })
    setLastDay(planned)
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

  const markReading = (via: 'pointer' | 'focus', isReading: boolean) => {
    reading.current[via] = isReading
    live.current.isReading = reading.current.pointer || reading.current.focus
  }

  // The card goes away. The tour's button would now skip the whole tour on a
  // repeated Enter, so the keyboard waits at the picture instead.
  const leaveCard = () => {
    if (document.activeElement?.closest('[data-day-card]')) pictureNode.current?.focus()
  }

  const moveOn = () => {
    const { script } = live.current
    if (!script) return
    stopReading()
    live.current.elapsed = afterHold(script, live.current.elapsed)
    live.current.onChange?.()
    leaveCard()
  }

  // The result's card offers the day once more, as the tour button does at the end.
  const onCardButton = (kind: HoldKind) => () => {
    if (kind !== 'result') {
      moveOn()
      return
    }
    leaveCard()
    reset()
  }
  const shownCopy = shownHold && holdCopy(shownHold, lastDay)

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
  // The scene plays the tour: status and tank stand over the stage.
  const isOnStage = phase === 'touring' && !isUnplayed
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
      className="grid gap-6 lg:grid-cols-[1.45fr_1fr] lg:gap-8"
    >
      <div className="flex flex-col">
        {/* From lg the panel sets the height and the stage fills it. */}
        <div
          ref={stageNode}
          data-day-stage
          className="group relative aspect-[3/2] overflow-hidden rounded-3xl bg-green-light-100/60 lg:aspect-auto lg:flex-1"
        >
          {/* An image's children are flattened for assistive technology, so the
              card with its button stands beside the picture, not in it. */}
          <div
            ref={pictureNode}
            role="img"
            aria-label={t('day.stageAriaLabel')}
            tabIndex={-1}
            className="absolute inset-0 rounded-3xl focus-visible:-outline-offset-4!"
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
              </div>
            )}
          </div>

          {canRenderModel && !hasFailed && (
            <>
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
              <TourHud status={statusText} isShown={isOnStage} />
              <span data-day-caption aria-hidden="true" className={caption}>
                {t('day.ride.caption')}
              </span>
              <HoldCard
                kind={lastHold}
                copy={holdCopy(lastHold, lastDay)}
                onNext={onCardButton(lastHold)}
                onReading={markReading}
                isShown={shownHold !== null}
                className={stageCard}
              />
            </>
          )}
        </div>
        {phase !== 'idle' && (
          <div
            data-day-strip
            className="mt-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-grey-900/10 lg:hidden"
          >
            {shownHold && shownCopy ? (
              <HoldCard
                kind={shownHold}
                copy={shownCopy}
                onNext={onCardButton(shownHold)}
                onReading={markReading}
                className="opacity-100 transition-opacity duration-200 starting:opacity-0"
              />
            ) : (
              // While the scene plays, the stage says what happens. The panel's
              // live region announces this; here it is only for the eyes.
              !isOnStage && (
                <p aria-hidden="true" className="min-h-10 text-sm text-grey-900">
                  {statusText}
                </p>
              )
            )}
            <div className="mt-2 flex justify-end">
              <TourButton {...tourButton} />
            </div>
          </div>
        )}
      </div>

      {/* The cards are not live themselves: one region announces either of them once. */}
      <p aria-live="polite" className="sr-only">
        {shownCopy &&
          (shownCopy.announcesText
            ? `${t(shownCopy.title)} ${t(shownCopy.text.key, shownCopy.text.vars)}`
            : t(shownCopy.title))}
      </p>

      <div
        data-day-panel
        className="@container divide-y divide-green-dark-900/10 rounded-3xl bg-white ring-1 ring-green-dark-900/10 *:p-5"
      >
        <div>
          <StepHeading number={1} title={t('day.steps.measure.title')} />
          <WeatherSlider days={days} onChange={changeDays} />
        </div>
        <div>
          <StepHeading number={2} title={t('day.steps.understand.title')} />
          <TreeList
            rows={rows}
            selected={selected}
            onSelect={setSelected}
            onHighlight={setHighlighted}
          />
        </div>
        <div>
          <StepHeading number={3} title={t('day.steps.act.title')} />
          <TourControls
            status={statusText}
            isStatusOnStage={isOnStage}
            stops={stops}
            {...tourButton}
          />
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
