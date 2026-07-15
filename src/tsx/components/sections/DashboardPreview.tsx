import Lottie from 'lottie-react'
import dashboardAnimation from '../../../json/dashboardAnimation.json'
import { useReducedMotion } from '../../hooks/useReducedMotion'

function DashboardPreview() {
  const reducedMotion = useReducedMotion()

  return (
    <section className="my-20 px-4 max-w-208 mx-auto md:px-6 lg:my-28 lg:max-w-screen-lg xl:my-36 xl:max-w-screen-xl">
      {/* Header */}
      <article className="mb-10 lg:mb-14 lg:text-center">
        <div className="inline-block mb-4 lg:mx-auto">
          <span className="text-xs font-semibold tracking-widest text-green-light-900 uppercase">
            Software
          </span>
          <div className="h-0.5 w-12 bg-gradient-to-r from-green-light-900 to-transparent mt-1" />
        </div>

        <h2 className="font-lato font-bold text-2xl mb-4 lg:text-3xl text-grey-900">
          Fundierte Handlungsempfehlungen
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          zur Bewässerung auf einen Blick
        </h2>

        <p className="text-grey-600 leading-relaxed max-w-2xl lg:mx-auto">
          Unser System wertet die Sensordaten wissenschaftlich aus und zeigt, zu welchem Zeitpunkt
          eine Bewässerung notwendig ist. Die Daten werden so aufbereitet, dass sie einfach zu
          interpretieren und direkt in die Einsatzplanung einzubinden sind.
        </p>
      </article>

      {/* Dashboard Screenshot */}
      <figure className="relative">
        {/* Decorative background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-light-900/10 via-green-dark-900/5 to-transparent rounded-3xl blur-3xl scale-110" />

        {/* Screenshot container */}
        <div className="relative bg-white rounded-2xl lg:rounded-3xl shadow-xl border border-grey-900/10 overflow-hidden">
          {/* Browser-like top bar */}
          <div className="flex items-center gap-2 px-2 py-2 sm:px-4 sm:py-3 bg-grey-900/5 border-b border-grey-900/10">
            <div className="flex gap-1 sm:gap-1.5">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#f87171]" />
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#fbbf24]" />
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#4ade80]" />
            </div>
            <div className="flex-1 mx-2 sm:mx-4">
              <div className="h-5 sm:h-6 bg-grey-900/10 rounded-md max-w-md mx-auto flex items-center justify-center">
                <span className="text-[10px] sm:text-xs text-grey-600/60">
                  app.green-ecolution.de
                </span>
              </div>
            </div>
          </div>

          {/* Dashboard Image with Lottie Overlay */}
          <div className="relative overflow-hidden">
            <img
              src="/assets/images/releases/v0.1.0-dashboard.png"
              alt="Green Ecolution Dashboard - Übersicht der Bewässerungsempfehlungen"
              className="w-full h-auto"
            />
            {/* Lottie animation overlay - hidden on mobile */}
            <div className="hidden md:block absolute top-[25%] right-[3%] w-[42%] pointer-events-none bg-white">
              <Lottie animationData={dashboardAnimation} autoplay={!reducedMotion} loop={true} />
            </div>
          </div>
        </div>
      </figure>
    </section>
  )
}

export default DashboardPreview
