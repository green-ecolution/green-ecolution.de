import { useT } from '../../../i18n/useT'
import { Suspense, lazy, useRef, useState, type CSSProperties } from 'react'
import Arrow from '../Arrow'
import StreamletTankGauge from './StreamletTankGauge'
import StreamletTourSketch from './StreamletTourSketch'
import { staticTankLevel, tourProjectedSize } from '../../../data/streamletTour'
import { useReducedMotion } from '../../../hooks/useReducedMotion'
import { supportsWebgl } from '../../../lib/webgl'
import { splitSlot } from '../../../lib/slotText'

const StreamletTour3D = lazy(() => import('./StreamletTour3D'))

function StreamletHero({ language }: { language: string }) {
  const t = useT()
  const prefersReducedMotion = useReducedMotion()
  const [canRenderModel] = useState(supportsWebgl)
  const tankLevel = useRef<HTMLDivElement>(null)
  const origin = splitSlot(t('hero.originRich'), 'project')

  return (
    <section className="px-4 max-w-208 mx-auto pt-28 pb-14 md:px-6 lg:pt-36 lg:pb-24 lg:max-w-screen-lg xl:pt-44 xl:max-w-screen-xl">
      <div className="lg:grid lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-x-10 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:gap-x-14">
        <div className="lg:col-start-1 lg:row-start-1">
          <div className="inline-block mb-6">
            <span className="text-xs font-semibold tracking-widest text-green-light-900 uppercase">
              {t('hero.sectionLabel')}
            </span>
            <div className="h-0.5 w-12 bg-gradient-to-r from-green-light-900 to-transparent mt-1" />
          </div>

          <h1 className="font-lato font-bold tracking-tight text-grey-900 text-[2.75rem] leading-[1.05] mb-5 md:text-[3.25rem] lg:text-[3.5rem] xl:text-[4.25rem]">
            {t('hero.title')}
          </h1>

          <p className="font-lato text-xl text-grey-900 leading-snug lg:text-2xl">
            {t('hero.tagline')}
          </p>
        </div>

        <figure
          role="img"
          aria-label={t('hero.tourAriaLabel')}
          // the aspect ratio rides on a custom property so the desktop rule can
          // drop it and let the model fill the height of the text column instead
          style={
            {
              '--tour-aspect': `${tourProjectedSize.width} / ${tourProjectedSize.height}`,
            } as CSSProperties
          }
          className="my-10 flex items-stretch gap-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:my-0 lg:min-h-0 lg:gap-6"
        >
          <StreamletTankGauge levelRef={tankLevel} level={staticTankLevel} />

          <div className="flex aspect-[var(--tour-aspect)] min-w-0 flex-1 items-center self-start lg:aspect-auto lg:h-full lg:self-stretch">
            {canRenderModel ? (
              <Suspense fallback={<StreamletTourSketch />}>
                <StreamletTour3D isStatic={prefersReducedMotion} levelRef={tankLevel} />
              </Suspense>
            ) : (
              <StreamletTourSketch />
            )}
          </div>
        </figure>

        <div className="lg:col-start-1 lg:row-start-2 lg:mt-5 lg:self-start">
          <p className="text-grey-900/70 leading-relaxed mb-4">{t('hero.lead')}</p>

          <p className="text-grey-900/60 leading-relaxed mb-8">
            {origin.before}
            <a
              href={`/${language}/project`}
              className="font-semibold text-green-dark-900 underline decoration-green-dark-900 decoration-2 underline-offset-2 transition-all hover:decoration-4"
            >
              {origin.inner}
            </a>
            {origin.after}
          </p>

          <div className="flex flex-wrap gap-4">
            <a
              href={`/${language}/contact`}
              aria-label={t('hero.contactAriaLabel')}
              className="flex items-center justify-center gap-x-4 rounded-2xl w-max font-semibold px-5 py-2 group cursor-pointer transition-all ease-in-out duration-300 text-white bg-green-dark-900 hover:bg-green-light-900 hover:shadow-lg hover:shadow-green-light-900/40 hover:-translate-y-0.5"
            >
              <span className="whitespace-nowrap">{t('hero.contact')}</span>
              <Arrow classes="w-6 transition-all ease-in-out duration-300 group-hover:translate-x-2" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default StreamletHero
