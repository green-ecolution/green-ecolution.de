import { useTranslation } from 'react-i18next'
import type { Release } from '../../types/release'
import ReleaseCard from './ReleaseCard'

interface ReleaseTimelineProps {
  releases: Release[]
}

const ReleaseTimeline: React.FC<ReleaseTimelineProps> = ({ releases }) => {
  const { t } = useTranslation()

  if (releases.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-grey-900/5 mb-4">
          <svg
            className="w-6 h-6 text-grey-900/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <p className="text-grey-900/50 text-sm">{t('releaseTimeline.empty')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-5">
      {releases.map((release, index) => (
        <ReleaseCard key={release.slug} release={release} index={index} />
      ))}
    </div>
  )
}

export default ReleaseTimeline
