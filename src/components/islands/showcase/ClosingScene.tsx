import logoWhite from '../../../assets/press/green-ecolution-logo-white.svg'
import { useT } from '../../../i18n/useT'
import type { ContactId, Scene } from '../../../data/showcase'
import { delay } from '../../../lib/showcase/delay'

// Five addresses, five kinds of address: the labels say which is which, because
// three of the five are green-ecolution.de with something in front of it.
const CONTACTS: ContactId[] = ['website', 'email', 'github', 'demo', 'instagram']

const RULE = '#E8EBCC33'

// The bracket frame is the deck's mark for a slide that closes something. It
// appears on this one slide and nowhere else in the run, so it reads as the
// end rather than as a border the board happens to have.
function CornerFrame() {
  return (
    <>
      <div
        className="showcase-rise absolute top-16 left-16 h-28 w-28 border-t border-l"
        style={{ ...delay(700), borderColor: RULE }}
      />
      <div
        className="showcase-rise absolute right-16 bottom-16 h-28 w-28 border-r border-b"
        style={{ ...delay(700), borderColor: RULE }}
      />
    </>
  )
}

// The board opened with the wordmark rising and the headline unmasking on the
// pale plate. It closes on the same two moves, so the loop comes back to where
// it started instead of just stopping.
export default function ClosingScene({ scene }: { scene: Scene }) {
  const t = useT()
  const contacts = scene.contacts ?? CONTACTS

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center">
      <CornerFrame />

      <img src={logoWhite.src} alt="" className="showcase-rise h-24 w-auto" />

      <span className="mt-14 block overflow-hidden pb-[0.08em]">
        <span
          className="showcase-unmask block font-lato text-[4.5rem] leading-[1.06] font-light tracking-[-0.022em]"
          style={{ ...delay(220), color: '#E8EBCC' }}
        >
          {t(`scenes.${scene.id}.statement`)}
        </span>
      </span>

      <p
        className="showcase-rise mt-6 font-nunito-sans text-2xl"
        style={{ ...delay(400), color: '#E8EBCCA0' }}
      >
        {t(`scenes.${scene.id}.body`)}
      </p>

      {/* Even gaps, not even columns: the five addresses differ in width by half
          again, and a five-column grid turns that into five different gaps. */}
      <div className="mt-20 flex items-start justify-center gap-20">
        {contacts.map((contact, index) => (
          <div
            key={contact}
            className="showcase-rise flex flex-col items-center gap-3"
            style={delay(520 + index * 90)}
          >
            <span
              className="font-lato text-sm font-bold tracking-[0.2em] uppercase"
              style={{ color: '#E8EBCC70' }}
            >
              {t(`contact.${contact}.label`)}
            </span>
            <span className="font-nunito-sans text-xl" style={{ color: '#E8EBCC' }}>
              {t(`contact.${contact}.value`)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
