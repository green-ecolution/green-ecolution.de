import logoAnimation from '../../json/logoAnimation.json'
import LottiePlayer from './LottiePlayer'
import { useReducedMotion } from '../../hooks/useReducedMotion'

// The static logo shows until the animation is loaded, which also covers
// visitors without javascript and those who asked for reduced motion. The
// animation plays once: the header is always in sight, so a loop would redraw
// the bar under its backdrop filter for as long as the page is open.
export default function HeaderLogo() {
  const reducedMotion = useReducedMotion()

  if (reducedMotion) {
    return <img src="/assets/svg/logo/logo-large-color.svg" alt="" />
  }

  return (
    <LottiePlayer
      animationData={logoAnimation}
      autoplay
      loop={false}
      fallback={<img src="/assets/svg/logo/logo-large-color.svg" alt="" />}
    />
  )
}
