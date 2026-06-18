import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import Lottie from 'lottie-react'
import MainNavigation from '../components/navigation/MainNavigation'
import logoAnimation from '../../json/logoAnimation.json'
import { useReducedMotion } from '../hooks/useReducedMotion'

function Header() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const reducedMotion = useReducedMotion()

  function toggleNavigation(state: boolean) {
    setOpen(state)
  }

  useEffect(() => {
    function handleResize() {
      if (window.matchMedia('(min-width: 1024px)').matches) {
        setOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    if (open) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
    return () => document.body.classList.remove('overflow-hidden')
  }, [open])

  // Update theme-color meta tag for iOS status bar
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      if (isScrolled) {
        metaThemeColor.setAttribute('content', '#fcfcfc') // white for scrolled header
      } else {
        metaThemeColor.setAttribute('content', '#4C7741') // green-dark-900 default
      }
    }
  }, [isScrolled])

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      if (scrollTop > 50) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll)

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:bg-white focus:px-6 focus:py-3 focus:rounded-lg focus:shadow-lg focus:text-green-dark-900 focus:font-semibold focus:border-2 focus:border-green-middle-600 focus:outline-none focus:ring-2 focus:ring-green-middle-600 focus:ring-offset-2 transition-all"
      >
        {t('layout.header.skipToContent')}
      </a>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all ease-in-out duration-300
            ${isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-lg shadow-grey-900/5' : 'bg-transparent'}`}
      >
        <div className="relative px-4 py-5 max-w-screen-lg mx-auto flex justify-between items-center md:px-6 xl:max-w-screen-xl">
          <Link
            to="/"
            aria-label={t('layout.header.homeAriaLabel')}
            className={`flex items-center gap-x-4 xl:gap-x-5 ${open ? 'opacity-0' : ''}`}
          >
            <figure className="w-24 xl:w-28">
              <Lottie animationData={logoAnimation} autoplay={!reducedMotion} />
            </figure>
            <p className="hidden whitespace-nowrap text-green-dark-900 font-lato font-semibold text-xl xl:block xl:text-2xl">
              Green Ecolution
            </p>
          </Link>

          <button
            type="button"
            id="main-navigation-toggle"
            aria-expanded={open}
            aria-controls="main-navigation"
            aria-haspopup="menu"
            aria-label={t('layout.header.navigationToggleAriaLabel')}
            className="relative w-10 h-10 p-2 z-50 group cursor-pointer lg:hidden"
            onClick={() => toggleNavigation(!open)}
          >
            <span
              className={`block w-6 h-0.5 transition-all ease-in-out duration-300 ${open ? 'bg-white rotate-45 absolute' : 'bg-grey-900 mb-1'}`}
            ></span>
            <span
              className={`block w-6 h-0.5 transition-all ease-in-out duration-300 ${open ? 'bg-white -rotate-45 absolute' : 'bg-grey-900 mb-1'}`}
            ></span>
          </button>

          <MainNavigation isOpen={open} onClose={() => toggleNavigation(false)} />
        </div>
      </header>
    </>
  )
}

export default Header
