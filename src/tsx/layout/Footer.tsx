import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import Button from '../components/Button'
import { useReducedMotion } from '../hooks/useReducedMotion'

function useIntersectionObserver(threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}

function Footer() {
  const reducedMotion = useReducedMotion()
  const { ref, isVisible } = useIntersectionObserver()

  return (
    <footer
      ref={ref}
      className="py-10 bg-background-footer-mobile bg-no-repeat bg-cover text-white md:pt-16 lg:bg-background-footer-desktop lg:bg-[35%] xl:bg-[55%] 3xl:bg-contain 3xl:bg-center hyphens-auto"
    >
      <div className="px-4 max-w-screen-lg mx-auto md:px-6 md:flex md:items-end md:justify-between md:gap-x-6 xl:max-w-screen-xl">
        <div
          className={`
            pb-10 border-b border-b-white/20 md:border-none md:pb-0
            ${reducedMotion ? '' : 'transition-all duration-700'}
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          <Link to="/" aria-label="Zur Startseite navigieren" className="group">
            <img
              src="/assets/svg/logo/logo-icon-white.svg"
              className="w-12 h-12 mb-6 transition-all ease-in-out duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(172,182,59,0.5)]"
              alt="Logo Green Ecolution"
              loading="lazy"
            />
          </Link>
          <p className="max-w-sm">
            Green Ecolution ist ein digitales System zur bedarfsgerechten und ressourcenschonenden
            Bewässerung von Stadtbäumen und leistet damit einen Beitrag zu einer nachhaltigen und
            klimaresilienten Stadtentwicklung.
          </p>
          <div className="flex flex-wrap gap-6 mt-8">
            <Button href="mailto:info@green-ecolution.de" ariaLabel="Kontaktiere uns gern per Mail">
              <img src="/assets/svg/socials/mail.svg" className="w-6 h-6" alt="" loading="lazy" />
              <span>Kontakt</span>
            </Button>
            <Button
              href="https://github.com/green-ecolution"
              ariaLabel="Besuche uns auf GitHub"
              isExternalLink
            >
              <img src="/assets/svg/socials/github.svg" className="w-6 h-6" alt="" loading="lazy" />
              <span>GitHub</span>
            </Button>
          </div>
        </div>

        <div
          className={`
            mt-10 md:justify-self-end md:mt-0
            ${reducedMotion ? '' : 'transition-all duration-700'}
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{ transitionDelay: reducedMotion ? '0ms' : '150ms' }}
        >
          <nav aria-label="Meta-Navigation">
            <ul className="flex items-center justify-center gap-x-6 sm:justify-start md:justify-end">
              <li>
                <Link
                  to="/impressum"
                  className="relative font-bold transition-all ease-in-out duration-300 hover:text-green-light-900 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-green-light-900 after:transition-all after:duration-300 hover:after:w-full"
                >
                  Impressum
                </Link>
              </li>
              <li>
                <Link
                  to="/datenschutz"
                  className="relative font-bold transition-all ease-in-out duration-300 hover:text-green-light-900 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-green-light-900 after:transition-all after:duration-300 hover:after:w-full"
                >
                  Datenschutz
                </Link>
              </li>
            </ul>
          </nav>
          <p className="text-xs text-center mt-3 text-white/60 sm:text-left md:text-right">
            © {new Date().getFullYear()} Green Ecolution
            <span className="hidden sm:inline"> · </span>
            <br className="sm:hidden" />
            <span className="text-white/40">
              {import.meta.env.VITE_APP_VERSION} · {import.meta.env.VITE_BUILD_VERSION}
            </span>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
