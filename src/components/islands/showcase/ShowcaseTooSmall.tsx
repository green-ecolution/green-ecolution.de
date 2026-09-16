import { useEffect, useState } from 'react'
import { ArrowUpRight, MonitorPlay } from 'lucide-react'
import logoWhite from '../../../assets/press/green-ecolution-logo-white.svg'
import { useT } from '../../../i18n/useT'
import { delay } from '../../../lib/showcase/delay'

const CREAM = '#E8EBCC'

// The one screen in this directory that is not the booth board: it stands in
// front of the loop on anything too small to read it, so unlike the scenes it
// carries breakpoints and may scroll.
export default function ShowcaseTooSmall({ onContinue }: { onContinue: () => void }) {
  const t = useT()
  const [size, setSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))

  useEffect(() => {
    const measure = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const lines = t('tooSmall.statement').split('\n')

  return (
    <div className="h-full w-full overflow-y-auto bg-[#2D4A27]">
      <div className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
        <span
          className="showcase-hint-rise flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10"
          aria-hidden="true"
        >
          <MonitorPlay className="h-8 w-8" style={{ color: CREAM }} />
        </span>

        <p
          className="showcase-hint-rise mt-8 font-lato text-xs font-bold tracking-[0.2em] uppercase"
          style={{ ...delay(80), color: `${CREAM}99` }}
        >
          {t('tooSmall.eyebrow')}
        </p>

        <h1
          className="showcase-hint-rise mt-4 font-lato text-[2rem] leading-[1.1] font-light tracking-[-0.022em] sm:text-[2.75rem]"
          style={{ ...delay(160), color: CREAM }}
        >
          {lines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h1>

        <div
          className="showcase-hint-rise mt-8 h-px w-12"
          style={{ ...delay(240), backgroundColor: `${CREAM}66` }}
        />

        <p
          className="showcase-hint-rise mt-8 font-nunito-sans text-base leading-relaxed sm:text-lg"
          style={{ ...delay(320), color: `${CREAM}B0` }}
        >
          {t('tooSmall.body')}
        </p>

        <p
          className="showcase-hint-rise mt-6 rounded-full border px-4 py-1.5 font-nunito-sans text-sm"
          style={{ ...delay(400), borderColor: `${CREAM}33`, color: `${CREAM}70` }}
        >
          {t('tooSmall.viewport', { width: size.width, height: size.height })}
        </p>

        <button
          type="button"
          onClick={onContinue}
          className="showcase-hint-rise mt-10 rounded-xl px-6 py-3 font-nunito-sans font-semibold text-[#2D4A27] transition-transform duration-300 hover:-translate-y-0.5"
          style={{ ...delay(480), backgroundColor: CREAM }}
        >
          {t('tooSmall.continue')}
        </button>

        <a
          href={`https://${t('demo.url')}`}
          className="showcase-hint-rise group mt-6 inline-flex items-center gap-2 font-nunito-sans text-sm transition-colors duration-300"
          style={{ ...delay(560), color: `${CREAM}B0` }}
        >
          {t('demo.label')}
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>

        <img
          src={logoWhite.src}
          alt=""
          className="showcase-hint-rise mt-16 h-10 w-auto opacity-60 sm:h-12"
          style={delay(640)}
        />
      </div>
    </div>
  )
}
