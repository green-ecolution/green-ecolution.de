import { ArrowRight, CloudRain, Sun } from 'lucide-react'
import type { RefObject } from 'react'
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
  onSelect: (tree: number | null) => void
}

export function TreeList({ rows, selected, onSelect }: TreeListProps) {
  const t = useT()

  return (
    <ul className="grid gap-1">
      {rows.map((row) => (
        <li key={row.id}>
          <button
            type="button"
            aria-pressed={selected === row.index}
            onClick={() => onSelect(row.index)}
            onFocus={() => onSelect(row.index)}
            onBlur={() => onSelect(null)}
            onPointerEnter={(event) => event.pointerType === 'mouse' && onSelect(row.index)}
            onPointerLeave={(event) => event.pointerType === 'mouse' && onSelect(null)}
            data-state={row.state}
            className="flex w-full items-center gap-2.5 rounded-xl border border-grey-900/10 bg-white px-3 py-1.5 text-left text-sm transition-colors hover:border-green-dark-900/40 aria-pressed:ring-2 aria-pressed:ring-green-dark-900 data-[state=dry]:border-red-500/40"
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

interface TourControlsProps {
  phase: DayPhase
  canPlan: boolean
  canSkip: boolean
  status: string
  /** The stops in order, shown when no scene plays the tour. */
  stops: string[] | null
  tank: number
  tankRef: RefObject<HTMLDivElement | null>
  onPlan: () => void
  onSkip: () => void
  onReset: () => void
}

const primary =
  'press-spring inline-flex items-center gap-3 rounded-2xl bg-green-dark-900 px-5 py-2 font-semibold text-white transition-all hover:bg-green-light-900 disabled:pointer-events-none disabled:opacity-40'
const quiet =
  'rounded-2xl px-3 py-2 text-sm font-semibold text-green-dark-900 underline decoration-2 underline-offset-2 hover:decoration-4'

export function TourControls({
  phase,
  canPlan,
  canSkip,
  status,
  stops,
  tank,
  tankRef,
  onPlan,
  onSkip,
  onReset,
}: TourControlsProps) {
  const t = useT()

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {phase === 'done' ? (
          <button type="button" className={primary} onClick={onReset}>
            {t('day.tour.again')}
          </button>
        ) : (
          <button type="button" className={primary} onClick={onPlan} disabled={!canPlan}>
            {t('day.tour.plan')}
            <ArrowRight aria-hidden="true" className="h-5 w-5" />
          </button>
        )}
        {canSkip && (
          <button type="button" className={quiet} onClick={onSkip}>
            {t('day.tour.skip')}
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3 text-xs text-grey-900/60">
        <span>{t('day.tour.tank')}</span>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-blue-400/20">
          {/* The scene writes this transform every frame while the tour runs. */}
          <div
            ref={tankRef}
            className="h-full origin-left rounded-full bg-blue-400"
            style={{ transform: `scaleX(${tank})` }}
          />
        </div>
      </div>

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
