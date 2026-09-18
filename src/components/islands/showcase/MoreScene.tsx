import { useT } from '../../../i18n/useT'
import type { Scene } from '../../../data/showcase'
import { delay } from '../../../lib/showcase/delay'

const LINKS = ['website', 'instagram'] as const

// The two places to follow the project, on the demo slide's proportions: text
// on the left, the scan targets on the right. Two codes rather than a list of
// addresses, because nobody types a URL off a board they walk past.
export default function MoreScene({ scene }: { scene: Scene }) {
  const t = useT()

  return (
    <div className="flex h-full w-full items-center justify-center gap-28">
      <div className="w-[36rem]">
        <p
          className="showcase-rise font-lato text-[4rem] leading-[1.06] font-light tracking-[-0.022em]"
          style={{ color: '#E8EBCC' }}
        >
          {t(`scenes.${scene.id}.statement`)}
        </p>
        <div
          className="showcase-rise mt-9 h-px w-12"
          style={{ ...delay(80), backgroundColor: '#E8EBCC66' }}
        />
        <p
          className="showcase-rise mt-9 max-w-[30ch] font-nunito-sans text-2xl leading-relaxed"
          style={{ ...delay(160), color: '#E8EBCCB0' }}
        >
          {t(`scenes.${scene.id}.body`)}
        </p>
      </div>

      <div className="flex items-start gap-16">
        {LINKS.map((link, index) => (
          <div key={link} className="flex w-[21rem] flex-col items-center">
            <div
              className="showcase-rise rounded-[1.5rem] bg-white p-5"
              style={{
                ...delay(240 + index * 120),
                boxShadow: '0 2rem 4.5rem -1.75rem rgba(0,0,0,0.35)',
              }}
            >
              <img
                src={`/assets/showcase/qr-${link}.png`}
                alt=""
                className="block h-[17rem] w-[17rem]"
              />
            </div>
            <span
              className="showcase-rise mt-8 font-lato text-sm font-bold tracking-[0.2em] uppercase"
              style={{ ...delay(320 + index * 120), color: '#E8EBCC70' }}
            >
              {t(`links.${link}.label`)}
            </span>
            <span
              className="showcase-rise mt-3 font-nunito-sans text-2xl"
              style={{ ...delay(380 + index * 120), color: '#E8EBCC' }}
            >
              {t(`links.${link}.value`)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
