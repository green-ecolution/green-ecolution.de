import { useEffect } from 'react'
import Contact from '../components/sections/Contact'
import HompageHero from '../components/homepage/HomepageHero'
import HomepageDevider from '../components/homepage/HomepageDevider'
import Faq from './../components/sections/Faq'
import Introduction from './../components/sections/Introduction'
import Features from './../components/sections/Features'
import ProcessCompact from './../components/sections/ProcessCompact'
import Stakeholder from './../components/sections/Stakeholder'
import Videos from '../components/sections/Videos'
import LatestRelease from '../components/sections/LatestRelease'
import Challenge from '../components/sections/Challenge'
import SensorProbe from '../components/sections/SensorProbe'
import DemoInstance from '../components/sections/DemoInstance'
import BreadcrumbSchema from '../components/BreadcrumbSchema'

function HomePage() {
  useEffect(() => {
    document.title = 'Startseite | Green Ecolution | Smartes Grünflächenmanagement'
  }, [])

  return (
    <main id="main-content">
      <BreadcrumbSchema items={[{ name: 'Startseite', path: '/' }]} />
      <HompageHero />
      <HomepageDevider />
      <Introduction />
      <Challenge />
      <Features />
      <SensorProbe />
      <Videos />
      <ProcessCompact />
      <DemoInstance />
      <LatestRelease />
      <div className="relative overflow-hidden before:bg-cover before:bg-background-light-dot before:w-[90%] before:h-[120vh] before:max-w-[60rem] before:absolute before:-right-4 before:top-8 before:-z-10 before:bg-no-repeat sm:before:-right-[5%] 2xl:before:w-[90rem] 2xl:before:max-w-[90rem] 2xl:before:right-[10%] 2xl:before:bg-contain 3xl:before:right-[20%]">
        <Stakeholder />
        <Faq />
        <Contact />
      </div>
    </main>
  )
}

export default HomePage
