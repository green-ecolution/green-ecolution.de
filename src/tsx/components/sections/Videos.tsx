import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactPlayer from 'react-player'
import VideoPreview from '../VideoPreview'
import { useReducedMotion } from '../../hooks/useReducedMotion'

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

const VIDEO_SHORT =
  'https://s3.green-ecolution.de/public-videos/project-video/short/green-ecolution-short.m3u8'
const VIDEO_SHORT_THMBNL =
  'https://s3.green-ecolution.de/public-videos/project-video/short/green-ecolution-thumbnail.png'
const VIDEO_LONG =
  'https://s3.green-ecolution.de/public-videos/project-video/long/green-ecolution-long.m3u8'
const VIDEO_LONG_THMBNL =
  'https://s3.green-ecolution.de/public-videos/project-video/long/green-ecolution-thumbnail.png'

const VideoCard = (props: {
  src: string
  thumbnail: string
  title: string
  describtion: string
  duration: string
}) => (
  <article
    className="
      group video__player h-full bg-white
      shadow-md hover:shadow-lg
      rounded-2xl p-6
      border border-grey-100 hover:border-green-light-900/30
      transition-all duration-300
    "
  >
    <div className="aspect-video w-full h-auto overflow-hidden rounded-xl">
      <ReactPlayer
        playing
        controls
        src={props.src}
        width="100%"
        height="auto"
        style={{ width: '100%', height: 'auto', aspectRatio: '16/9' }}
        light={<VideoPreview thumbnail={props.thumbnail} />}
      />
    </div>
    <h3 className="mt-8 mb-4 font-lato text-xl text-grey-900 lg:text-2xl">
      <strong>{props.title}</strong>&nbsp;|&nbsp;
      <span className="text-base lg:text-lg text-grey-900/60">{props.duration}</span>
    </h3>
    <p className="text-grey-900/80 leading-relaxed">{props.describtion}</p>
  </article>
)

const Videos = () => {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  const { ref, isVisible } = useIntersectionObserver()

  return (
    <section
      ref={ref}
      className="relative overflow-hidden px-4 mx-auto md:px-6 py-20 lg:py-28 xl:py-36 before:bg-cover before:bg-background-light-dot before:w-[90%] before:h-[80%] before:absolute before:-right-4 before:top-12 before:-z-10 before:bg-no-repeat xl:before:bg-contain xl:before:top-20 xl:before:left-[10%] 3xl:before:left-[20%]"
    >
      <article className="mx-auto mb-8 lg:mb-14 lg:text-center xl:max-w-screen-lg">
        {/* Section Label */}
        <div
          className={`
            mb-6 lg:mb-8 lg:flex lg:justify-center
            ${reducedMotion ? '' : 'transition-all duration-700'}
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          <div className="inline-block">
            <span className="text-xs font-semibold tracking-widest text-green-light-900 uppercase">
              {t('sections.videos.label')}
            </span>
            <div className="h-0.5 w-12 bg-gradient-to-r from-green-light-900 to-transparent mt-1 lg:mx-auto" />
          </div>
        </div>

        <h2
          className={`
            font-lato font-bold text-2xl mb-6 text-grey-900 lg:text-3xl
            ${reducedMotion ? '' : 'transition-all duration-700'}
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{ transitionDelay: reducedMotion ? '0ms' : '100ms' }}
        >
          {t('sections.videos.title')}
        </h2>
        <p
          className={`
            text-grey-900/80 leading-relaxed
            ${reducedMotion ? '' : 'transition-all duration-700'}
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{ transitionDelay: reducedMotion ? '0ms' : '200ms' }}
        >
          {t('sections.videos.description')}
        </p>
      </article>

      <section className="mx-auto grid grid-cols-1 gap-6 lg:grid-cols-2 xl:max-w-screen-xl">
        <div
          className={`
            ${reducedMotion ? '' : 'transition-all duration-700'}
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{ transitionDelay: reducedMotion ? '0ms' : '300ms' }}
        >
          <VideoCard
            src={VIDEO_SHORT}
            thumbnail={VIDEO_SHORT_THMBNL}
            title={t('sections.videos.cards.short.title')}
            describtion={t('sections.videos.cards.short.description')}
            duration={t('sections.videos.cards.short.duration')}
          />
        </div>
        <div
          className={`
            ${reducedMotion ? '' : 'transition-all duration-700'}
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{ transitionDelay: reducedMotion ? '0ms' : '400ms' }}
        >
          <VideoCard
            src={VIDEO_LONG}
            thumbnail={VIDEO_LONG_THMBNL}
            title={t('sections.videos.cards.long.title')}
            describtion={t('sections.videos.cards.long.description')}
            duration={t('sections.videos.cards.long.duration')}
          />
        </div>
      </section>
    </section>
  )
}

export default Videos
