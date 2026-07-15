import ReactPlayer from 'react-player'
import VideoPreview from '../VideoPreview'
import { videoBaseUrl } from '../../lib/runtimeEnv'

const VIDEO_BASE = `${videoBaseUrl()}/project-video`
const VIDEO_SHORT = `${VIDEO_BASE}/short/green-ecolution-short.m3u8`
const VIDEO_SHORT_THMBNL = `${VIDEO_BASE}/short/green-ecolution-thumbnail.png`
const VIDEO_LONG = `${VIDEO_BASE}/long/green-ecolution-long.m3u8`
const VIDEO_LONG_THMBNL = `${VIDEO_BASE}/long/green-ecolution-thumbnail.png`

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
  return (
    <section className="relative overflow-hidden px-4 mx-auto md:px-6 py-20 lg:py-28 xl:py-36 before:bg-cover before:bg-background-light-dot before:w-[90%] before:h-[80%] before:absolute before:-right-4 before:top-12 before:-z-10 before:bg-no-repeat xl:before:bg-contain xl:before:top-20 xl:before:left-[10%] 3xl:before:left-[20%]">
      <article className="mx-auto mb-8 lg:mb-14 lg:text-center xl:max-w-screen-lg">
        {/* Section Label */}
        <div className="mb-6 lg:mb-8 lg:flex lg:justify-center">
          <div className="inline-block">
            <span className="text-xs font-semibold tracking-widest text-green-light-900 uppercase">
              Videos
            </span>
            <div className="h-0.5 w-12 bg-gradient-to-r from-green-light-900 to-transparent mt-1 lg:mx-auto" />
          </div>
        </div>

        <h2 className="font-lato font-bold text-2xl mb-6 text-grey-900 lg:text-3xl">
          Lerne das Projekt per Video kennen
        </h2>
        <p className="text-grey-900/80 leading-relaxed">
          Im Rahmen des Forschungsprojekts sind neben der Sensorlösung und der Software auch zwei
          Videos entstanden. Sie stellen das Projekt vor: die Zielsetzung, die Problemstellung und
          die entwickelte Lösung.
        </p>
      </article>

      <section className="mx-auto grid grid-cols-1 gap-6 lg:grid-cols-2 xl:max-w-screen-xl">
        <div>
          <VideoCard
            src={VIDEO_SHORT}
            thumbnail={VIDEO_SHORT_THMBNL}
            title="Kurzvideo"
            describtion="Ein kurzer Einstieg in das Projekt. In rund einer halben Minute erfährst du, worum es bei Green Ecolution geht."
            duration="ca. 30 Sekunden"
          />
        </div>
        <div>
          <VideoCard
            src={VIDEO_LONG}
            thumbnail={VIDEO_LONG_THMBNL}
            title="Langvideo"
            describtion="Das ausführliche Video geht tiefer und erklärt die wichtigsten Hintergründe, Details und die nächsten Schritte des Projekts."
            duration="ca. 4 Minuten"
          />
        </div>
      </section>
    </section>
  )
}

export default Videos
