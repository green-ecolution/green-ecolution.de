import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowUp } from 'lucide-react'
import { useReducedMotion } from '../hooks/useReducedMotion'

function BackToTop() {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 500)
    }

    window.addEventListener('scroll', toggleVisibility, { passive: true })
    toggleVisibility()

    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: reducedMotion ? 'auto' : 'smooth',
    })
  }

  return (
    <button
      onClick={scrollToTop}
      aria-label={t('components.backToTop.ariaLabel')}
      className={`fixed bottom-6 right-6 z-50 p-3 rounded-full bg-green-dark-900 text-white shadow-lg cursor-pointer
        transition-all duration-300 hover:bg-green-middle-900 hover:scale-110 hover:shadow-xl
        focus:outline-none focus:ring-2 focus:ring-green-light-900 focus:ring-offset-2
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  )
}

export default BackToTop
