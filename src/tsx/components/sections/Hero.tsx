import React, { ReactNode } from 'react'

interface HeroProps {
  headline: string
  description: string
  label?: string
  children?: ReactNode
}

const Hero: React.FC<HeroProps> = ({ headline, description, label = 'Projekt', children }) => {
  return (
    <section className="mt-28 px-4 max-w-208 mx-auto md:px-6 lg:mt-36 lg:max-w-screen-lg xl:mt-52 xl:max-w-screen-xl">
      <div className="lg:text-center">
        {/* Section Label */}
        <div className="inline-block mb-6 lg:mx-auto">
          <span className="text-xs font-semibold tracking-widest text-green-light-900 uppercase">
            {label}
          </span>
          <div className="h-0.5 w-12 bg-gradient-to-r from-green-light-900 to-transparent mt-1" />
        </div>

        {/* Headline */}
        <h1 className="font-lato font-bold text-3xl mb-6 text-grey-900 leading-tight md:text-4xl lg:text-5xl xl:text-6xl">
          {headline}
        </h1>

        {/* Description */}
        <p className="text-grey-600 leading-relaxed max-w-3xl lg:mx-auto lg:text-lg">
          {description}
        </p>

        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  )
}

export default Hero
