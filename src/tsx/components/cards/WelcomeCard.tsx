import { useState, useEffect } from 'react'
import Arrow from '../../icons/Arrow'
import Lottie from 'lottie-react'
import logoAnimation from '../../../json/logoAnimation.json'
import { useOutsideClick } from '../../hooks/useOutsideClick'
import { isInitialLoad } from '../../helper/storage'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface WelcomeCardProps {
  onClose: () => void
  handleStartAnmiation: () => void
  delay: number
  isOverlayVisible: boolean
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({
  onClose,
  handleStartAnmiation,
  delay,
  isOverlayVisible,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const reducedMotion = useReducedMotion()

  const ref = useOutsideClick(() => {
    if (isVisible) {
      onClose()
      setIsVisible(false)
    }
  })

  const handleHideWelcomeCard = () => {
    setIsVisible(false)
    handleStartAnmiation()
  }

  useEffect(() => {
    if (isInitialLoad() && isOverlayVisible) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, delay + 200)
      return () => clearTimeout(timer)
    }
  }, [isOverlayVisible, delay])

  return (
    <article
      ref={ref}
      className={`absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 transition-all ease-out duration-500
                ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
    >
      <div className="relative">
        {/* Subtle glow effect */}
        <div
          className="absolute -inset-4 bg-green-light-900/15 rounded-3xl blur-2xl"
          style={{ transform: 'scale(0.85)' }}
        />

        {/* Main card */}
        <div
          className="relative text-center bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl px-10 py-8 border border-green-light-900/10 w-[28rem]"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <figure className="w-28 h-20 mx-auto flex items-center justify-center">
            <Lottie
              animationData={logoAnimation}
              autoplay={!reducedMotion}
              style={{ width: '100%', height: 'auto' }}
            />
          </figure>

          <h2 className="font-lato font-bold text-2xl mb-2 text-grey-900">
            Willkommen bei
            <span className="text-green-dark-900"> Green Ecolution</span>
          </h2>

          <p className="text-sm text-green-dark-900 font-medium mb-4">
            Smartes Grünflächenmanagement
          </p>

          <p className="text-base text-grey-900/80 leading-relaxed mb-6">
            Erfahre, wie wir mit smarter Sensorik und datengestützten Analysen die Bewässerung
            städtischer Grünflächen optimieren, für gesündere Bäume, Beete und Parks bei effizientem
            Ressourceneinsatz.
          </p>

          <button
            type="button"
            className="mx-auto flex items-center justify-center gap-x-3 rounded-xl w-full font-semibold px-6 py-3 group cursor-pointer bg-gradient-to-r from-green-dark-900 to-green-middle-900 text-white shadow-lg shadow-green-dark-900/20 transition-all duration-300 hover:shadow-xl hover:shadow-green-dark-900/30 hover:gap-x-4"
            onClick={handleHideWelcomeCard}
          >
            Jetzt entdecken
            <Arrow classes="w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </article>
  )
}

export default WelcomeCard
