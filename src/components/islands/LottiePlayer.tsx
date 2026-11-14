import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type AriaAttributes,
  type ComponentType,
  type CSSProperties,
} from 'react'
import type { LottieComponentProps, LottieRefCurrentProps } from 'lottie-react'

interface Props {
  animationData: unknown
  autoplay?: boolean
  loop?: boolean
  className?: string
  style?: CSSProperties
  'aria-hidden'?: AriaAttributes['aria-hidden']
  /** Shown until the animation is loaded, and to visitors without javascript. */
  fallback?: ReactNode
}

// lottie-web touches document while its module body runs, which crashes the
// server render of any island that imports it at module scope. Loading it inside
// an effect keeps the island renderable on the server. Until it arrives this
// renders nothing.
export default function LottiePlayer({ fallback = null, autoplay = false, ...props }: Props) {
  const [Lottie, setLottie] = useState<ComponentType<LottieComponentProps> | null>(null)
  const player = useRef<LottieRefCurrentProps | null>(null)

  useEffect(() => {
    let cancelled = false

    void import('lottie-react').then((module) => {
      if (!cancelled) {
        setLottie(() => module.default as ComponentType<LottieComponentProps>)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  // lottie-web rewrites its svg on every frame for as long as it plays, in
  // sight or not. So the player starts paused and only runs while it is seen.
  useEffect(() => {
    const container = player.current?.animationContainerRef.current
    if (!Lottie || !autoplay || !container) return

    const viewport = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) player.current?.play()
      else player.current?.pause()
    })
    viewport.observe(container)

    return () => viewport.disconnect()
  }, [Lottie, autoplay])

  if (!Lottie) {
    return <>{fallback}</>
  }

  return <Lottie {...props} autoplay={false} lottieRef={player} />
}
