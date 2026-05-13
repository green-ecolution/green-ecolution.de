import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ContactHeroContent from '../components/hero/ContactHeroContent'
import Hero from '../components/sections/Hero'
import Stakeholder from '../components/sections/Stakeholder'
import BreadcrumbSchema from '../components/BreadcrumbSchema'

function ContactPage() {
  const { t } = useTranslation()

  useEffect(() => {
    document.title = t('pages.contact.documentTitle')
  }, [t])

  const heroHeadline = t('pages.contact.hero.headline')
  const heroDescription = t('pages.contact.hero.description')

  return (
    <main
      id="main-content"
      className="relative overflow-hidden before:bg-cover before:bg-background-dark-dot before:w-4/5 before:h-[100vh] before:max-h-[45rem] before:absolute before:-right-4 before:-top-16 before:-z-10 before:bg-no-repeat sm:before:-right-10 lg:before:max-h-[55rem] xl:before:w-[70rem] xl:before:-right-40 2xl:before:right-[10%] 2xl:before:bg-contain"
    >
      <BreadcrumbSchema
        items={[
          { name: t('pages.breadcrumbs.home'), path: '/' },
          { name: t('pages.breadcrumbs.contact'), path: '/contact' },
        ]}
      />
      <Hero headline={heroHeadline} description={heroDescription} label={t('pages.contact.label')}>
        <ContactHeroContent />
      </Hero>
      <Stakeholder hasDesktopList />
    </main>
  )
}

export default ContactPage
