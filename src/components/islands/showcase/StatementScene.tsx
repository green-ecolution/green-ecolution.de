import type { ReactNode } from 'react'
import { useT } from '../../../i18n/useT'
import type { Scene } from '../../../data/showcase'
import { optionalText } from '../../../lib/showcase/text'
import { delay } from '../../../lib/showcase/delay'

// How long the scene's visual gets to build before the type starts. Matches the
// four staggered partner marks, the only visual this layout carries.
const LEAD_MS = 620

interface Props {
  scene: Scene
  dark: boolean
  children?: ReactNode
}

export default function StatementScene({ scene, dark, children }: Props) {
  const t = useT()
  const body = optionalText(t(`scenes.${scene.id}.body`))
  const source = optionalText(t(`scenes.${scene.id}.source`))

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-40 text-center">
      {children}
      {/* The visual above builds first, so the sentence waits for it rather
          than racing the marks it is the caption to. */}
      <p
        className="showcase-rise font-lato text-[4.5rem] leading-[1.05] font-light tracking-[-0.022em]"
        style={{ ...delay(LEAD_MS), color: dark ? '#E8EBCC' : '#2D4A27' }}
      >
        {t(`scenes.${scene.id}.statement`)}
      </p>
      <div
        className="showcase-rise mt-8 h-px w-12"
        style={{ ...delay(LEAD_MS + 100), backgroundColor: dark ? '#E8EBCC66' : '#8B735566' }}
      />
      {body && (
        <p
          className="showcase-rise mt-8 max-w-[52ch] font-nunito-sans text-2xl leading-relaxed"
          style={{ ...delay(LEAD_MS + 200), color: dark ? '#E8EBCCB0' : '#1F1F1F' }}
        >
          {body}
        </p>
      )}
      {source && (
        <p
          className="showcase-rise mt-6 font-nunito-sans text-base"
          style={{ ...delay(LEAD_MS + 300), color: dark ? '#E8EBCC70' : '#8B7355' }}
        >
          {source}
        </p>
      )}
    </div>
  )
}
