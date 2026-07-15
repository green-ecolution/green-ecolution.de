import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { getAllReleases } from '../../content/releases'
import ReleaseTimeline from '../components/releases/ReleaseTimeline'
import { formatReleaseDate } from '../helper/formatDate'

function ReleasesPage() {
  const releases = getAllReleases()
  const latestRelease = releases[0]
  const olderReleases = releases.slice(1)

  useEffect(() => {
    document.title = 'Releases | Green Ecolution | Smartes Grünflächenmanagement'
  }, [])

  const formattedDate = latestRelease ? formatReleaseDate(latestRelease.frontmatter.date) : ''

  return (
    <main
      id="main-content"
      className="relative overflow-hidden flex-grow before:bg-cover before:bg-background-yellow-dot before:w-4/5 before:h-[100vh] before:max-h-[45rem] before:absolute before:-right-4 before:-top-16 before:-z-10 before:bg-no-repeat sm:before:-right-10 lg:before:max-h-[55rem] xl:before:w-[70rem] xl:before:-right-40 2xl:before:right-[10%] 2xl:before:bg-contain"
    >
      <section className="px-4 max-w-208 mx-auto mt-28 pb-16 md:px-6 lg:mt-36 lg:pb-24 lg:max-w-screen-lg xl:mt-52 xl:max-w-screen-xl">
        {/* Header with section label */}
        <header className="lg:text-center mb-12 lg:mb-16">
          <div className="inline-block mb-4 lg:mx-auto">
            <span className="text-xs font-semibold tracking-widest text-green-light-900 uppercase">
              Releases
            </span>
            <div className="h-0.5 w-12 bg-gradient-to-r from-green-light-900 to-transparent mt-1" />
          </div>

          <h1 className="font-lato font-bold text-3xl mb-4 text-grey-900 leading-tight md:text-4xl lg:text-5xl xl:text-6xl">
            Release Notes
          </h1>

          <p className="text-grey-600 leading-relaxed max-w-2xl lg:mx-auto lg:text-lg">
            Hier siehst du, was sich von Version zu Version geändert hat, von neuen Funktionen bis
            zu behobenen Fehlern.
          </p>
        </header>

        {/* Latest Release - Featured Card */}
        {latestRelease && (
          <div className="mb-16 lg:mb-20">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-green-dark-900">
                Aktuelles Release
              </span>
              <span className="inline-flex items-center gap-1.5 bg-green-light-900/20 text-green-light-900 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                <span className="w-1.5 h-1.5 bg-green-light-900 rounded-full animate-pulse" />
                Neu
              </span>
            </div>

            <Link
              to="/releases/$slug"
              params={{ slug: latestRelease.slug }}
              className="group relative block"
            >
              {/* Layered shadow effects for depth */}
              <div className="absolute inset-0 bg-green-dark-900/20 rounded-3xl blur-xl translate-y-4 scale-[0.98] transition-all duration-500 group-hover:translate-y-6 group-hover:blur-2xl group-hover:bg-green-dark-900/30" />

              {/* Main card */}
              <div className="relative bg-gradient-to-br from-green-dark-900 via-green-dark-900 to-green-middle-900 rounded-2xl lg:rounded-3xl p-6 lg:p-10 shadow-xl ring-1 ring-white/10 overflow-hidden transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-2xl">
                {/* Grid pattern overlay */}
                <div
                  className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                     linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '24px 24px',
                  }}
                />

                {/* Decorative corner accent */}
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-green-light-900/20 rounded-full blur-3xl transition-all duration-500 group-hover:bg-green-light-900/30 group-hover:scale-110" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-green-middle-900/30 rounded-full blur-2xl" />

                {/* Version badge floating */}
                <div className="absolute top-4 right-4 lg:top-6 lg:right-6">
                  <span className="inline-flex items-center bg-white/15 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-sm font-lato font-bold ring-1 ring-white/20 shadow-lg">
                    v{latestRelease.frontmatter.version}
                  </span>
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <time
                      dateTime={latestRelease.frontmatter.date}
                      className="text-white/60 text-sm font-medium"
                    >
                      {formattedDate}
                    </time>
                  </div>

                  <h2 className="font-lato font-bold text-2xl lg:text-4xl text-white mb-3 lg:mb-4 max-w-2xl group-hover:text-green-light-100 transition-colors">
                    {latestRelease.frontmatter.title}
                  </h2>

                  {latestRelease.frontmatter.summary && (
                    <p className="text-white/75 leading-relaxed text-base lg:text-lg max-w-2xl mb-6">
                      {latestRelease.frontmatter.summary}
                    </p>
                  )}

                  {latestRelease.frontmatter.highlights &&
                    latestRelease.frontmatter.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6 lg:mb-8">
                        {latestRelease.frontmatter.highlights.map((highlight) => (
                          <span
                            key={highlight}
                            className="bg-white/10 backdrop-blur-sm text-white/90 px-3 py-1.5 rounded-lg text-sm font-medium ring-1 ring-white/10 transition-all duration-300 hover:bg-white/20"
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    )}

                  <div className="flex items-center gap-3 text-white/80 group-hover:text-white transition-colors">
                    <span className="text-sm font-semibold">Details ansehen</span>
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 transition-all duration-300 group-hover:translate-x-1">
                      <svg
                        className="w-4 h-4"
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
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Older Releases */}
        {olderReleases.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-grey-900/50">
                Ältere Releases
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-grey-900/10 to-transparent" />
            </div>
            <ReleaseTimeline releases={olderReleases} />
          </div>
        )}
      </section>
    </main>
  )
}

export default ReleasesPage
