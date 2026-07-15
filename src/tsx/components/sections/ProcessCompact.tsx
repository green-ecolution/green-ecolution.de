import { Link } from '@tanstack/react-router'
import { workflowSteps } from '../../../data/workflowSteps'
import Arrow from '../../icons/Arrow'

function ProcessCompact() {
  return (
    <section className="max-w-208 mx-auto my-20 px-4 md:px-6 lg:my-28 lg:max-w-screen-lg xl:my-36 xl:max-w-screen-xl">
      {/* Header */}
      <div className="flex items-end justify-between mb-8 lg:mb-12">
        <div>
          <div className="inline-block mb-4">
            <span className="text-xs font-semibold tracking-widest text-green-light-900 uppercase">
              Lösung
            </span>
            <div className="h-0.5 w-12 bg-gradient-to-r from-green-light-900 to-transparent mt-1" />
          </div>

          <h2 className="font-lato font-bold text-2xl text-grey-900 lg:text-3xl xl:text-4xl">
            Der durchgängige Workflow
          </h2>
        </div>

        <Link
          to="/project"
          hash="process"
          aria-label="Mehr über den Prozess erfahren"
          className="hidden lg:flex group items-center gap-x-2 font-semibold text-green-dark-900 hover:text-green-light-900 transition-colors duration-300 whitespace-nowrap"
        >
          Mehr erfahren
          <Arrow classes="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>

      {/* 3-Column Workflow */}
      <div className="bg-green-light-100/40 rounded-2xl lg:rounded-3xl p-6 md:p-8 lg:p-10 xl:p-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon
            const isLast = index === workflowSteps.length - 1

            return (
              <article
                key={step.title}
                className={`${!isLast ? 'md:border-r md:border-green-dark-900/10 md:pr-8 lg:pr-10' : ''} ${index > 0 ? 'md:pl-8 lg:pl-10' : ''} ${index > 0 ? 'border-t border-green-dark-900/10 pt-8 md:border-t-0 md:pt-0' : ''}`}
              >
                <Icon className="w-8 h-8 text-green-dark-900/40 mb-5 lg:w-10 lg:h-10" />

                <span className="text-xs font-semibold tracking-widest uppercase text-green-dark-900/60 block mb-2">
                  {step.number} · {step.category}
                </span>

                <h3 className="font-lato font-bold text-xl text-grey-900 mb-3 lg:text-2xl">
                  {step.title}
                </h3>

                <p className="text-grey-600 text-sm leading-relaxed">{step.description}</p>
              </article>
            )
          })}
        </div>
      </div>

      {/* Mobile CTA */}
      <div className="flex justify-center mt-8 lg:hidden">
        <Link
          to="/project"
          hash="process"
          aria-label="Mehr über den Prozess erfahren"
          className="group flex items-center gap-x-2 font-semibold text-green-dark-900 hover:text-green-light-900 transition-colors duration-300"
        >
          Mehr erfahren
          <Arrow classes="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  )
}

export default ProcessCompact
