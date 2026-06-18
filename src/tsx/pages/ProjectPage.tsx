import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Advantages from '../components/sections/Advantages'
import Architecture from '../components/sections/Architecture'
import DashboardPreview from '../components/sections/DashboardPreview'
import Hero from '../components/sections/Hero'
import Contact from '../components/sections/Contact'
import FurtherLinks from '../components/sections/FurhterLinks'
import Process from '../components/sections/Process'
import OpenSourceGovernance from '../components/sections/OpenSourceGovernance'

import VisionRoadmap from '../components/sections/VisionRoadmap'
import BreadcrumbSchema from '../components/BreadcrumbSchema'

function ProjectPage() {
  const { t } = useTranslation()

  useEffect(() => {
    document.title = t('pages.project.documentTitle')
  }, [t])

  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const element = document.getElementById(hash.substring(1))
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [])

  const heroHeadline = t('pages.project.hero.headline')
  const heroDescription = t('pages.project.hero.description')

  return (
    <main
      id="main-content"
      className="relative overflow-hidden before:bg-cover before:bg-background-light-dot before:w-4/5 before:h-[100vh] before:max-h-[45rem] before:absolute before:-right-4 before:-top-16 before:-z-10 before:bg-no-repeat sm:before:-right-10 lg:before:max-h-[55rem] xl:before:w-[70rem] xl:before:-right-40 2xl:before:right-[10%] 2xl:before:bg-contain"
    >
      <BreadcrumbSchema
        items={[
          { name: t('pages.breadcrumbs.home'), path: '/' },
          { name: t('pages.breadcrumbs.project'), path: '/project' },
        ]}
      />
      <Hero headline={heroHeadline} description={heroDescription} />
      <DashboardPreview />
      <Process />
      <Architecture />
      <OpenSourceGovernance />
      <Advantages />

      <VisionRoadmap />
      <FurtherLinks />
      <Contact />
    </main>
  )
}

export default ProjectPage
