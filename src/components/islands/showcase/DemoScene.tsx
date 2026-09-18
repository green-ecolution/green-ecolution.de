import { useT } from '../../../i18n/useT'
import type { Scene } from '../../../data/showcase'
import { delay } from '../../../lib/showcase/delay'

// The invitation to scan. The code is the exhibit here, so it gets the exhibit
// layout's own proportions and the white card the screencasts stand in, rather
// than sitting in a centred stack where every line weighs the same.
//
// It sits on the right for the same reason the screencasts do, and because the
// corner code the board has carried all run long is fading out underneath it.
export default function DemoScene({ scene }: { scene: Scene }) {
  const t = useT()

  return (
    <div className="flex h-full w-full items-center justify-center gap-32">
      <div className="w-[40rem]">
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
          className="showcase-rise mt-9 max-w-[28ch] font-nunito-sans text-2xl leading-relaxed"
          style={{ ...delay(160), color: '#E8EBCCB0' }}
        >
          {t(`scenes.${scene.id}.body`)}
        </p>
      </div>

      <div className="flex flex-col items-center">
        <div
          className="showcase-rise rounded-[1.5rem] bg-white p-6"
          style={{ ...delay(240), boxShadow: '0 2rem 4.5rem -1.75rem rgba(0,0,0,0.35)' }}
        >
          <img src="/assets/showcase/qr-demo.png" alt="" className="block h-[26rem] w-[26rem]" />
        </div>
        <p
          className="showcase-rise mt-10 font-lato text-5xl font-light tracking-[-0.022em]"
          style={{ ...delay(360), color: '#E8EBCC' }}
        >
          {t('demo.url')}
        </p>
      </div>
    </div>
  )
}
