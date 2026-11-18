import { ArrowRight, Check, CloudRain, Droplets, Sun } from 'lucide-react'
import type { FocusEvent } from 'react'
import { useT } from '../../../i18n/useT'
import { MAX_DRY_DAYS } from '../../../lib/dryness'
import type { HoldKind } from '../../../lib/wateringDay'
import { thirstColors, type CardCopy, type DayPhase, type TreeRow } from './dayModel'

// The one small line every step has between its heading and its control.
const stepNote = 'mt-1 text-sm leading-snug text-grey-900/70'

interface StepHeadingProps {
  number: number
  title: string
}

export function StepHeading({ number, title }: StepHeadingProps) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-dark-900 font-lato text-xs font-bold text-white">
        {number}
      </span>
      <h3 className="font-lato text-lg font-bold leading-snug text-grey-900">{title}</h3>
    </div>
  )
}

interface WeatherSliderProps {
  days: number
  onChange: (days: number) => void
}

export function WeatherSlider({ days, onChange }: WeatherSliderProps) {
  const t = useT()
  const text = days === 1 ? t('day.weather.valueOne') : t('day.weather.value', { days })

  return (
    <>
      <p className={stepNote}>
        <span className="font-semibold text-grey-900">{text}</span> · {t('day.weather.hint')}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <CloudRain aria-hidden="true" className="h-5 w-5 shrink-0 text-grey-900/50" />
        <input
          type="range"
          min={0}
          max={MAX_DRY_DAYS}
          step={1}
          value={days}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label={t('day.weather.label')}
          aria-valuetext={text}
          className="h-8 w-full cursor-pointer accent-green-dark-900"
        />
        <Sun aria-hidden="true" className="h-5 w-5 shrink-0 text-grey-900/50" />
      </div>
    </>
  )
}

const LEGEND = ['dry', 'soon', 'ok'] as const

interface TreeListProps {
  rows: TreeRow[]
  selected: number | null
  /** A click flies the camera to the tree; a second click lets it go. */
  onSelect: (tree: number | null) => void
  /** Hover and focus only name the tree in the scene. */
  onHighlight: (tree: number | null) => void
}

export function TreeList({ rows, selected, onSelect, onHighlight }: TreeListProps) {
  const t = useT()

  return (
    <>
      <ul aria-hidden="true" className={`${stepNote} flex flex-wrap gap-x-4 gap-y-1`}>
        {LEGEND.map((state) => (
          <li key={state} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: thirstColors[state] }}
            />
            {t(`day.states.${state}`)}
          </li>
        ))}
      </ul>
      {/* Two columns where the panel is wide enough for the longest name, filled
          column by column so the driest stand top left. The rows re-sort as trees
          get watered; a row as scroll anchor would drag the page along. */}
      <ul className="-mx-2 mt-2 grid auto-cols-fr gap-x-3 gap-y-0.5 [overflow-anchor:none] @[22rem]:grid-flow-col @[22rem]:grid-rows-6">
        {rows.map((row) => (
          <li key={row.id} className="min-w-0">
            <button
              type="button"
              data-selected={selected === row.index}
              onClick={() => onSelect(selected === row.index ? null : row.index)}
              onFocus={() => onHighlight(row.index)}
              onBlur={() => onHighlight(null)}
              onPointerEnter={(event) => event.pointerType === 'mouse' && onHighlight(row.index)}
              onPointerLeave={(event) => event.pointerType === 'mouse' && onHighlight(null)}
              data-state={row.state}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-sm text-grey-900 transition-colors hover:bg-green-light-100/70 data-[selected=true]:bg-green-light-100/70 data-[selected=true]:ring-2 data-[selected=true]:ring-green-dark-900"
            >
              {row.watered ? (
                <Check
                  aria-hidden="true"
                  strokeWidth={3}
                  className="h-3 w-3 shrink-0 text-green-dark-900"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: thirstColors[row.state] }}
                />
              )}
              {row.order > 0 && (
                <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-grey-900 text-[10px] font-bold text-white">
                  {row.order}
                </span>
              )}
              <span className="truncate">{t(`day.trees.${row.id}`)}</span>
              <span className="sr-only">
                {t(row.watered ? 'day.states.watered' : `day.states.${row.state}`)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

interface TourButtonProps {
  phase: DayPhase
  canPlan: boolean
  onPlan: () => void
  onSkip: () => void
  onReset: () => void
  className?: string
}

// One node for all three roles: a button that went away or got disabled while
// focused would drop keyboard focus to the page.
export function TourButton({
  phase,
  canPlan,
  onPlan,
  onSkip,
  onReset,
  className = '',
}: TourButtonProps) {
  const t = useT()
  const isUnavailable = phase === 'idle' && !canPlan
  const act = { idle: onPlan, touring: onSkip, done: onReset }[phase]
  const label = { idle: 'day.tour.plan', touring: 'day.tour.skip', done: 'day.tour.again' }[phase]

  return (
    <button
      type="button"
      data-day-tour-button
      aria-disabled={isUnavailable || undefined}
      onClick={() => {
        if (!isUnavailable) act()
      }}
      className={`press-spring inline-flex shrink-0 items-center justify-center gap-3 rounded-2xl bg-green-dark-900 px-5 py-2 font-semibold text-white transition-all hover:bg-green-light-900 aria-disabled:pointer-events-none aria-disabled:opacity-40 ${className}`}
    >
      {t(label)}
      {phase === 'idle' && <ArrowRight aria-hidden="true" className="h-5 w-5" />}
    </button>
  )
}

const tankFill = { transform: 'scaleX(var(--day-tank, 1))' }

/** Reads the tank from `--day-tank`, which the scene sets on the island's root every frame. */
export function TankGauge({ className = '' }: { className?: string }) {
  const t = useT()

  return (
    <div className={`flex items-center gap-2 text-xs text-grey-900/60 ${className}`}>
      <Droplets aria-hidden="true" className="h-4 w-4 shrink-0 text-blue-400" />
      <span className="max-sm:hidden">{t('day.tour.tank')}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-blue-400/20">
        <div className="h-full origin-left rounded-full bg-blue-400" style={tankFill} />
      </div>
    </div>
  )
}

interface TourHudProps {
  status: string
  isShown: boolean
}

/**
 * What is happening and how full the tank is, over the top of the stage while
 * the scene plays. The panel's live region announces the status; this is for the eyes.
 */
export function TourHud({ status, isShown }: TourHudProps) {
  return (
    <div
      data-day-hud
      data-shown={String(isShown)}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-2 top-2 flex items-center gap-3 rounded-2xl bg-white/90 px-3 py-2 opacity-0 shadow-sm ring-1 ring-green-dark-900/10 backdrop-blur-sm transition-opacity duration-300 data-[shown=true]:opacity-100 sm:inset-x-3 sm:top-3 sm:gap-4 sm:px-4"
    >
      <p className="min-w-0 flex-1 text-xs font-semibold leading-snug text-grey-900 sm:text-sm">
        {status}
      </p>
      <TankGauge className="w-20 shrink-0 sm:w-48" />
    </div>
  )
}

interface TourControlsProps extends TourButtonProps {
  status: string
  /** The stage shows the status itself while the scene plays; it stays here for screen readers. */
  isStatusOnStage: boolean
  /** The stops in order, shown when no scene plays the tour. */
  stops: string[] | null
}

export function TourControls({ status, isStatusOnStage, stops, ...button }: TourControlsProps) {
  const t = useT()

  return (
    <div>
      {/* Keeps its height while the status is on the stage: the stage is as tall as the panel. */}
      <div className={`${stepNote} min-h-10`}>
        <p role="status" aria-live="polite" className={isStatusOnStage ? 'sr-only' : undefined}>
          {status}
        </p>
      </div>
      <TourButton {...button} className="mt-3 w-full @xl:w-auto" />

      {stops && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-green-dark-900">
            {t('day.tour.stops')}
          </p>
          <ol className="mt-1 list-decimal pl-5 text-sm text-grey-900/80">
            {stops.map((stop, index) => (
              <li key={`${stop}-${stops.slice(0, index).filter((other) => other === stop).length}`}>
                {stop}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

const holdLeft = { transform: 'scaleX(var(--day-hold, 1))' }

interface HoldCardProps {
  kind: HoldKind
  copy: CardCopy
  onNext: () => void
  /** The pointer is over the card or the focus inside it, or no longer. */
  onReading: (via: 'pointer' | 'focus', isReading: boolean) => void
  /** Set where the card stays mounted and fades; left out where it comes and goes. */
  isShown?: boolean
  className?: string
}

/** Explains a close-up while it holds, with the time left and a way on. */
export function HoldCard({
  kind,
  copy,
  onNext,
  onReading,
  isShown,
  className = '',
}: HoldCardProps) {
  const t = useT()
  const leave = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) onReading('focus', false)
  }

  return (
    <div
      data-day-card={kind}
      data-shown={isShown === undefined ? undefined : String(isShown)}
      // A finger on a phone only passes by. A mouse counts once it moves here:
      // one that merely rests where the card appears is not reading, nor is one
      // that crosses the card as it fades out.
      onPointerMove={(event) => {
        if (event.pointerType === 'mouse' && isShown !== false) onReading('pointer', true)
      }}
      onPointerLeave={() => onReading('pointer', false)}
      onFocus={() => onReading('focus', true)}
      onBlur={leave}
      className={className}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-green-dark-900">
        {t(copy.label)}
      </p>
      <p className="mt-1 font-lato font-bold leading-snug text-grey-900">{t(copy.title)}</p>
      <p className="mt-1 text-sm leading-snug text-grey-900/70">
        {t(copy.text.key, copy.text.vars)}
      </p>
      <div
        aria-hidden="true"
        className="mt-3 h-1 overflow-hidden rounded-full bg-green-dark-900/10"
      >
        <div
          data-day-hold-bar
          className="h-full origin-left rounded-full bg-green-dark-900"
          style={holdLeft}
        />
      </div>
      <button
        type="button"
        onClick={onNext}
        className="mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold text-green-dark-900 ring-1 ring-green-dark-900/30 transition-colors hover:bg-green-dark-900 hover:text-white"
      >
        {t(copy.next)}
        {kind !== 'result' && <ArrowRight aria-hidden="true" className="h-4 w-4" />}
      </button>
    </div>
  )
}
