import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { Release } from '../../types/release'
import { formatReleaseDate } from '../../helper/formatDate'

interface ReleaseCardProps {
    release: Release
    index?: number
}

const ReleaseCard: React.FC<ReleaseCardProps> = ({ release, index = 0 }) => {
    const { frontmatter, slug } = release
    const formattedDate = formatReleaseDate(frontmatter.date)
    const { t } = useTranslation()

    return (
        <article className="group relative" style={{ animationDelay: `${index * 100}ms` }}>
            {/* Timeline connector line */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-green-dark-900/20 via-green-dark-900/10 to-transparent hidden lg:block" />

            {/* Timeline dot */}
            <div className="absolute left-0 top-8 w-2 h-2 -translate-x-[3.5px] rounded-full bg-green-dark-900/30 ring-2 ring-green-light-100 hidden lg:block group-hover:bg-green-dark-900 group-hover:scale-125 transition-all duration-300" />

            <Link to="/releases/$slug" params={{ slug }} className="block lg:ml-6">
                <div className="relative bg-white rounded-xl lg:rounded-2xl p-5 lg:p-6 border border-grey-900/10 shadow-xs transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-0.5 group-hover:border-green-dark-900/20 overflow-hidden">
                    {/* Subtle gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-light-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="relative z-10">
                        {/* Header row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-lato font-bold text-green-dark-900 bg-green-dark-900/10 ring-1 ring-green-dark-900/20">
                                    v{frontmatter.version}
                                </span>
                                <time dateTime={frontmatter.date} className="text-grey-900/50 text-sm">
                                    {formattedDate}
                                </time>
                            </div>

                            {/* Arrow indicator */}
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-grey-900/5 text-grey-900/40 group-hover:bg-green-dark-900 group-hover:text-white transition-all duration-300">
                                <svg
                                    className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </span>
                        </div>

                        {/* Title */}
                        <h2 className="font-lato font-bold text-lg lg:text-xl text-grey-900 mb-2 group-hover:text-green-dark-900 transition-colors">
                            {frontmatter.title}
                        </h2>

                        {/* Summary */}
                        {frontmatter.summary && (
                            <p className="text-grey-900/70 text-sm leading-relaxed mb-4 line-clamp-2">
                                {frontmatter.summary}
                            </p>
                        )}

                        {/* Highlights as compact tags */}
                        {frontmatter.highlights && frontmatter.highlights.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {frontmatter.highlights.slice(0, 4).map((highlight) => (
                                    <span
                                        key={highlight}
                                        className="inline-flex items-center gap-1 text-xs text-grey-900/60 bg-grey-900/5 px-2 py-1 rounded-md"
                                    >
                                        <span className="w-1 h-1 rounded-full bg-green-dark-900/40" />
                                        {highlight}
                                    </span>
                                ))}
                                {frontmatter.highlights.length > 4 && (
                                    <span className="text-xs text-grey-900/40 px-2 py-1">
                                        {t('releaseCard.moreHighlights', {
                                            count: frontmatter.highlights.length - 4,
                                        })}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Link>
        </article>
    )
}

export default ReleaseCard
