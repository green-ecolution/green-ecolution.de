import Lottie from 'lottie-react'
import { useTranslation } from 'react-i18next'
import cableAnimation from '../../json/cableAnimation.json'
import Arrow from '../icons/Arrow'
import Retry from '../icons/Retry'
import { useReducedMotion } from '../hooks/useReducedMotion'

interface ErrorFallbackProps {
  onReset: () => void
}

function ErrorFallback({ onReset }: ErrorFallbackProps) {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()

  return (
    <main className="relative h-screen overflow-hidden before:bg-cover before:bg-background-dark-dot before:w-4/5 before:h-[100vh] before:max-h-[45rem] before:absolute before:-right-4 before:-top-16 before:-z-10 before:bg-no-repeat sm:before:-right-10 lg:before:max-h-[55rem] xl:before:w-[70rem] xl:before:-right-40 2xl:before:right-[10%] 2xl:before:bg-contain">
      <figure aria-hidden="true" className="absolute top-0 inset-x-0">
        <Lottie className="h-[50vh]" animationData={cableAnimation} autoplay={!reducedMotion} />
      </figure>

      <div className="mt-[55vh] mx-auto max-w-208 xl:max-w-screen-lg">
        <section className="my-28 px-4 md:px-6 lg:my-36 xl:my-52">
          <h1 className="font-lato font-bold text-4xl mb-4 lg:mb-6 lg:text-5xl lg:text-center xl:text-6xl">
            {t('components.errorFallback.title')}
          </h1>
          <p className="lg:text-center mb-10">{t('components.errorFallback.description')}</p>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-center">
            <button
              type="button"
              onClick={onReset}
              className="flex items-center justify-center gap-x-4 rounded-2xl w-max font-semibold px-5 py-2 group cursor-pointer bg-green-dark-900 transition-colors text-white hover:bg-green-light-900"
            >
              <span>{t('components.errorFallback.retryLabel')}</span>
              <Retry classes="w-5" />
            </button>
            <a
              href="/"
              className="flex items-center justify-center gap-x-4 rounded-2xl w-max font-semibold px-5 py-2 group cursor-pointer border border-green-dark-900 text-green-dark-900 transition-colors hover:bg-green-dark-900 hover:text-white"
            >
              <span>{t('components.errorFallback.homeLabel')}</span>
              <Arrow classes="w-6 transition-all ease-in-out duration-300 group-hover:translate-x-2" />
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}

export default ErrorFallback
