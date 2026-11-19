import { useRef } from 'react'
import { videoBaseUrl } from '../../lib/runtimeEnv'
import { trackEvent } from '../../lib/track'

interface Props {
  /** Path below the video base, e.g. /blog-video/ndr-drehtag/ndr-drehtag.mp4 */
  path: string
  posterPath: string
  label: string
}

// Same reason as VideoPlayer: the base url only exists in window._env_ at serve
// time, so it cannot be resolved in astro without baking the default in.
export default function ContentVideoPlayer({ path, posterPath, label }: Props) {
  const base = videoBaseUrl()
  // play fires again after every pause and seek, the event counts the first start only.
  const hasStarted = useRef(false)

  const onPlay = () => {
    if (hasStarted.current) return
    hasStarted.current = true
    trackEvent('video_play', { video: path.split('/').pop() ?? path })
  }

  return (
    <video
      controls
      playsInline
      preload="metadata"
      poster={`${base}${posterPath}`}
      aria-label={label}
      onPlay={onPlay}
      className="block h-auto w-full"
    >
      <source src={`${base}${path}`} type="video/mp4" />
    </video>
  )
}
