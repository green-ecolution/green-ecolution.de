import { ArrowRight, CloudRain, Sun } from 'lucide-react'
import { useT } from '../../../i18n/useT'
import { MAX_DRY_DAYS } from '../../../lib/dryness'
import { thirstColors, type DayPhase, type TreeRow } from './dayModel'

interface StepHeadingProps {
  number: number
  title: string
  description: string
}

export function StepHeading({ number, title, description }: StepHeadingProps) {
  return (
    <div className="mb-3 flex items-start gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-dark-900 font-lato text-xs font-bold text-white">
        {number}
      </span>
      <div>
        <h3 className="font-lato text-lg font-bold leading-snug text-grey-900">{title}</h3>
        <p className="text-sm text-grey-900/70">{description}</p>
      </div>
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
    <div className="mt-4">
      <div className="flex items-center gap-3">
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
      <p className="mt-1 text-center font-semibold text-grey-900">
        {text} <span className="font-normal text-grey-900/60">· {t('day.weather.hint')}</span>
      </p>
    </div>
  )
}

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

  // The rows re-sort as trees get watered; a row as scroll anchor would drag the
  // page along and push the tour button out of view.
  return (
    <ul className="grid gap-1 [overflow-anchor:none]">
      {rows.map((row) => (
        <li key={row.id}>
          <button
            type="button"
            data-selected={selected === row.index}
            onClick={() => onSelect(selected === row.index ? null : row.index)}
            onFocus={() => onHighlight(row.index)}
            onBlur={() => onHighlight(null)}
            onPointerEnter={(event) => event.pointerType === 'mouse' && onHighlight(row.index)}
            onPointerLeave={(event) => event.pointerType === 'mouse' && onHighlight(null)}
            data-state={row.state}
            className="flex w-full items-center gap-2.5 rounded-xl border border-grey-900/10 bg-white px-3 py-1.5 text-left text-sm transition-colors hover:border-green-dark-900/40 data-[selected=true]:ring-2 data-[selected=true]:ring-green-dark-900 data-[state=dry]:border-red-500/40"
          >
            <span
              aria-hidden="true"
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: thirstColors[row.state] }}
            />
            {row.order > 0 && (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-grey-900 text-[11px] font-bold text-white">
                {row.order}
              </span>
            )}
            <span className="text-grey-900">{t(`day.trees.${row.id}`)}</span>
            <span
              className={`ml-auto text-xs ${
                row.state === 'dry' ? 'font-semibold text-red-500' : 'text-grey-900/60'
              }`}
            >
              {t(row.watered ? 'day.states.watered' : `day.states.${row.state}`)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

interface TourButtonProps {
  phase: DayPhase
  canPlan: boolean
  onPlan: () => void
  onSkip: () => void
  onReset: () => void
}

// One node for all three roles: a button that went away or got disabled while
// focused would drop keyboard focus to the page.
export function TourButton({ phase, canPlan, onPlan, onSkip, onReset }: TourButtonProps) {
  const t = useT()
  const isUnavailable = phase === 'idle' && !canPlan
  const act = { idle: onPlan, touring: onSkip, done: onReset }[phase]
  const label = { idle: 'day.tour.plan', touring: 'day.tour.skip', done: 'day.tour.again' }[phase]

  return (
    <button
      type="button"
      aria-disabled={isUnavailable || undefined}
      onClick={() => {
        if (!isUnavailable) act()
      }}
      className="press-spring inline-flex shrink-0 items-center gap-3 rounded-2xl bg-green-dark-900 px-5 py-2 font-semibold text-white transition-all hover:bg-green-light-900 aria-disabled:pointer-events-none aria-disabled:opacity-40"
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
    <div className={`flex items-center gap-3 text-xs text-grey-900/60 ${className}`}>
      <span>{t('day.tour.tank')}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-blue-400/20">
        <div className="h-full origin-left rounded-full bg-blue-400" style={tankFill} />
      </div>
    </div>
  )
}

interface TourControlsProps extends TourButtonProps {
  status: string
  /** The stops in order, shown when no scene plays the tour. */
  stops: string[] | null
}

export function TourControls({ status, stops, ...button }: TourControlsProps) {
  const t = useT()

  return (
    <div>
      <TourButton {...button} />
      <TankGauge className="mt-4" />

      <p role="status" aria-live="polite" className="mt-3 min-h-12 text-grey-900">
        {status}
      </p>

      {stops && (
        <div className="mt-2">
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
