import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, redirect } from '@tanstack/react-router'
import Markdown from 'react-markdown'
import { getReleaseBySlug, getAdjacentReleases, getAllReleases } from '../../content/releases'
import { Route } from '../../routes/releases_.$slug'
import { formatReleaseDate } from '../helper/formatDate'
import { useReducedMotion } from '../hooks/useReducedMotion'

const DEFAULT_REPOSITORY = 'https://github.com/green-ecolution/green-ecolution'

function getTextContent(node: ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(getTextContent).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    return getTextContent((node as { props: { children?: ReactNode } }).props.children)
  }
  return ''
}

function useIntersectionObserver(threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

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

function ReleaseDetailPage() {
  const { slug } = Route.useParams()
  const release = getReleaseBySlug(slug)
  const { prev, next } = getAdjacentReleases(slug)
  const reducedMotion = useReducedMotion()
  const { ref: headerRef, isVisible: headerVisible } = useIntersectionObserver()
  const { ref: contentRef, isVisible: contentVisible } = useIntersectionObserver()
  const { ref: changelogRef, isVisible: changelogVisible } = useIntersectionObserver()
  const { ref: navRef, isVisible: navVisible } = useIntersectionObserver()

  useEffect(() => {
    if (release) {
      document.title = `v${release.frontmatter.version} - ${release.frontmatter.title} | Green Ecolution`
    }
  }, [release])

  if (!release) {
    throw redirect({ to: '/releases' })
  }

  const { frontmatter, content } = release
  const allReleases = getAllReleases()
  const isLatest = allReleases[0]?.slug === slug

  const formattedDate = formatReleaseDate(frontmatter.date)

  const getSectionIcon = (text: string): string => {
    const lowerText = text.toLowerCase()
    if (lowerText.includes('highlight')) {
      return '⭐'
    }
    if (
      lowerText.includes('neu') ||
      lowerText.includes('feature') ||
      lowerText.includes('funktion')
    ) {
      return '🚀'
    }
    if (
      lowerText.includes('verbesser') ||
      lowerText.includes('improv') ||
      lowerText.includes('optimier')
    ) {
      return '✨'
    }
    if (lowerText.includes('fehler') || lowerText.includes('bug') || lowerText.includes('fix')) {
      return '🐛'
    }
    if (lowerText.includes('breaking') || lowerText.includes('wichtig')) {
      return '⚠️'
    }
    if (lowerText.includes('sicher') || lowerText.includes('security')) {
      return '🔒'
    }
    if (
      lowerText.includes('technisch') ||
      lowerText.includes('technical') ||
      lowerText.includes('basis')
    ) {
      return '⚙️'
    }
    if (
      lowerText.includes('ausblick') ||
      lowerText.includes('outlook') ||
      lowerText.includes('zukunft')
    ) {
      return '🔮'
    }
    if (
      lowerText.includes('was ist') ||
      lowerText.includes('about') ||
      lowerText.includes('über')
    ) {
      return '💡'
    }
    if (lowerText.includes('kern') || lowerText.includes('core') || lowerText.includes('haupt')) {
      return '🎯'
    }
    if (
      lowerText.includes('demo') ||
      lowerText.includes('preview') ||
      lowerText.includes('ausprobieren')
    ) {
      return '🎮'
    }
    if (
      lowerText.includes('einschränkung') ||
      lowerText.includes('limitation') ||
      lowerText.includes('known issue')
    ) {
      return '🚧'
    }
    if (lowerText.includes('refactor')) {
      return '🔧'
    }
    if (
      lowerText.includes('dokumentation') ||
      lowerText.includes('documentation') ||
      lowerText.includes('docs')
    ) {
      return '📚'
    }
    if (
      lowerText.includes('konfiguration') ||
      lowerText.includes('configuration') ||
      lowerText.includes('config')
    ) {
      return '🛠️'
    }
    return '📋'
  }

  const getSectionColor = (text: string): string => {
    const lowerText = text.toLowerCase()
    if (lowerText.includes('highlight')) {
      return 'bg-green-dark-900/10 text-green-dark-900 border-green-dark-900/20'
    }
    if (
      lowerText.includes('neu') ||
      lowerText.includes('feature') ||
      lowerText.includes('funktion')
    ) {
      return 'bg-green-dark-900/10 text-green-dark-900 border-green-dark-900/20'
    }
    if (
      lowerText.includes('verbesser') ||
      lowerText.includes('improv') ||
      lowerText.includes('optimier')
    ) {
      return 'bg-green-light-900/20 text-green-light-900 border-green-light-900/30'
    }
    if (lowerText.includes('fehler') || lowerText.includes('bug') || lowerText.includes('fix')) {
      return 'bg-green-middle-900/10 text-green-middle-900 border-green-middle-900/20'
    }
    if (lowerText.includes('breaking') || lowerText.includes('wichtig')) {
      return 'bg-grey-900/10 text-grey-900 border-grey-900/20'
    }
    if (
      lowerText.includes('technisch') ||
      lowerText.includes('technical') ||
      lowerText.includes('basis')
    ) {
      return 'bg-blue-400/10 text-blue-400 border-blue-400/20'
    }
    if (
      lowerText.includes('ausblick') ||
      lowerText.includes('outlook') ||
      lowerText.includes('zukunft')
    ) {
      return 'bg-purple-400/10 text-purple-400 border-purple-400/20'
    }
    if (
      lowerText.includes('was ist') ||
      lowerText.includes('about') ||
      lowerText.includes('über')
    ) {
      return 'bg-yellow-400/10 text-yellow-500 border-yellow-400/20'
    }
    if (lowerText.includes('kern') || lowerText.includes('core') || lowerText.includes('haupt')) {
      return 'bg-orange-400/10 text-orange-400 border-orange-400/20'
    }
    if (
      lowerText.includes('demo') ||
      lowerText.includes('preview') ||
      lowerText.includes('ausprobieren')
    ) {
      return 'bg-cyan-400/10 text-cyan-500 border-cyan-400/20'
    }
    if (
      lowerText.includes('einschränkung') ||
      lowerText.includes('limitation') ||
      lowerText.includes('known issue')
    ) {
      return 'bg-amber-400/10 text-amber-500 border-amber-400/20'
    }
    if (lowerText.includes('refactor')) {
      return 'bg-indigo-400/10 text-indigo-500 border-indigo-400/20'
    }
    if (
      lowerText.includes('dokumentation') ||
      lowerText.includes('documentation') ||
      lowerText.includes('docs')
    ) {
      return 'bg-violet-500/10 text-violet-600 border-violet-500/20'
    }
    if (
      lowerText.includes('konfiguration') ||
      lowerText.includes('configuration') ||
      lowerText.includes('config')
    ) {
      return 'bg-slate-400/10 text-slate-500 border-slate-400/20'
    }
    return 'bg-grey-100 text-grey-900 border-grey-100'
  }

  return (
    <main
      id="main-content"
      className="relative overflow-hidden flex-grow before:bg-cover before:bg-background-yellow-dot before:w-4/5 before:h-[100vh] before:max-h-[45rem] before:absolute before:-right-4 before:-top-16 before:-z-10 before:bg-no-repeat sm:before:-right-10 lg:before:max-h-[55rem] xl:before:w-[70rem] xl:before:-right-40 2xl:before:right-[10%] 2xl:before:bg-contain"
    >
      <article className="px-4 max-w-208 mx-auto mt-20 pb-16 md:px-6 lg:mt-24 lg:pb-24 lg:max-w-screen-lg xl:mt-32 xl:max-w-screen-xl">
        {/* Back Link */}
        <Link
          to="/releases"
          aria-label="Zurück zu allen Releases"
          className="group inline-flex items-center gap-2 text-green-dark-900 font-semibold hover:gap-3 transition-all mb-8"
        >
          <span
            aria-hidden="true"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-dark-900/10 group-hover:bg-green-dark-900 group-hover:text-white transition-all"
          >
            ←
          </span>
          <span className="group-hover:underline">Alle Releases</span>
        </Link>

        {/* Header */}
        <header
          ref={headerRef}
          className={`mb-10 transition-all ${reducedMotion ? '' : 'duration-700'} ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Section Label */}
          <div className="inline-block mb-4">
            <span className="text-xs font-semibold tracking-widest text-green-light-900 uppercase">
              Release Notes
            </span>
            <div className="h-0.5 w-12 bg-gradient-to-r from-green-light-900 to-transparent mt-1" />
          </div>

          {/* Meta Row */}
          <div
            className={`flex flex-col gap-3 mb-4 sm:flex-row sm:flex-wrap sm:items-center transition-all ${reducedMotion ? '' : 'duration-700'} ${
              headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: reducedMotion ? '0ms' : '100ms' }}
          >
            <div className="flex items-center gap-3">
              <span className="bg-green-dark-900 text-white px-4 py-1.5 rounded-full text-sm font-lato font-bold shadow-xs">
                v{frontmatter.version}
              </span>
              {isLatest && (
                <span className="inline-flex items-center gap-1.5 bg-green-light-900 text-white px-4 py-1.5 rounded-full text-sm font-lato font-bold shadow-xs">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  Aktuell
                </span>
              )}
              <time dateTime={frontmatter.date} className="text-grey-900/60 text-sm">
                {formattedDate}
              </time>
            </div>
            <span className="text-grey-900/30 hidden sm:inline">|</span>
            <div className="flex items-center gap-3">
              <a
                href={`${frontmatter.repository ?? DEFAULT_REPOSITORY}/releases/tag/v${frontmatter.version}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-grey-900/60 hover:text-green-dark-900 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Release
              </a>
              <a
                href={`${frontmatter.repository ?? DEFAULT_REPOSITORY}/tree/v${frontmatter.version}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-grey-900/60 hover:text-green-dark-900 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
                Source
              </a>
            </div>
          </div>

          {/* Title */}
          <h1
            className={`font-lato font-bold text-3xl mb-4 text-grey-900 lg:text-5xl xl:text-6xl transition-all ${reducedMotion ? '' : 'duration-700'} ${
              headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: reducedMotion ? '0ms' : '200ms' }}
          >
            {frontmatter.title}
          </h1>

          {/* Highlights */}
          {frontmatter.highlights && frontmatter.highlights.length > 0 && (
            <div
              className={`flex flex-wrap gap-2 transition-all ${reducedMotion ? '' : 'duration-700'} ${
                headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: reducedMotion ? '0ms' : '300ms' }}
            >
              {frontmatter.highlights.map((highlight) => (
                <span
                  key={highlight}
                  className="bg-green-dark-900/10 text-green-dark-900 px-3 py-1.5 rounded-full text-sm font-medium"
                >
                  {highlight}
                </span>
              ))}
            </div>
          )}

          {/* Summary */}
          {frontmatter.summary && (
            <p
              className={`mt-4 text-lg text-grey-900/80 leading-relaxed lg:text-xl transition-all ${reducedMotion ? '' : 'duration-700'} ${
                headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: reducedMotion ? '0ms' : '400ms' }}
            >
              {frontmatter.summary}
            </p>
          )}
        </header>

        {/* Markdown Content */}
        <div
          ref={contentRef}
          className={`transition-all ${reducedMotion ? '' : 'duration-1000'} ${
            contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="relative bg-green-light-100 rounded-2xl lg:rounded-3xl shadow-md border border-grey-100 p-6 lg:p-8 overflow-hidden">
            {/* Decorative corner */}
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-green-light-900/10 rounded-full blur-3xl" />

            <Markdown
              components={{
                h2: ({ children }) => {
                  const text = getTextContent(children)
                  const icon = getSectionIcon(text)
                  const colorClasses = getSectionColor(text)
                  return (
                    <div className="mt-10 mb-4 first:mt-0">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${colorClasses}`}
                      >
                        <span className="text-lg">{icon}</span>
                        <h2 className="text-lg font-lato font-bold">{children}</h2>
                      </div>
                    </div>
                  )
                },
                h3: ({ children }) => (
                  <h3 className="text-base font-lato font-semibold mt-5 mb-2 text-grey-900 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-dark-900 flex-shrink-0" />
                    {children}
                  </h3>
                ),
                p: ({ node, children }) => {
                  const paragraphChildren = node?.children ?? []
                  const imageCount = paragraphChildren.filter(
                    (child) => child.type === 'element' && child.tagName === 'img',
                  ).length
                  const isImageGallery =
                    imageCount > 1 &&
                    paragraphChildren.every(
                      (child) =>
                        child.type === 'text' ||
                        (child.type === 'element' &&
                          (child.tagName === 'img' || child.tagName === 'br')),
                    )

                  if (isImageGallery) {
                    return (
                      <div className="my-6 flex flex-col gap-4 sm:flex-row sm:items-start [&>figure]:my-0 sm:[&>figure]:flex-1 sm:[&>figure]:min-w-0">
                        {children}
                      </div>
                    )
                  }

                  return <p className="my-2 text-grey-900/80 leading-relaxed">{children}</p>
                },
                ul: ({ children }) => (
                  <ul className="my-3 space-y-2 text-grey-900/80">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="flex items-start gap-3 text-grey-900/80 leading-relaxed">
                    <span className="text-green-dark-900 flex-shrink-0 h-[1.625em] flex items-center">
                      →
                    </span>
                    <span>{children}</span>
                  </li>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-dark-900 font-medium hover:underline"
                  >
                    {children}
                  </a>
                ),
                img: ({ src, alt }) => (
                  <figure className="my-6">
                    <img
                      src={src}
                      alt={alt ?? ''}
                      className="w-full rounded-xl shadow-lg border border-grey-100"
                    />
                    {alt && (
                      <figcaption className="text-center text-sm text-grey-900/60 mt-2">
                        {alt}
                      </figcaption>
                    )}
                  </figure>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-grey-900">{children}</strong>
                ),
              }}
            >
              {content}
            </Markdown>
          </div>
        </div>

        {/* Changelog Section */}
        {frontmatter.changelog && frontmatter.changelog.length > 0 && (
          <div
            ref={changelogRef}
            className={`mt-8 transition-all ${reducedMotion ? '' : 'duration-1000'} ${
              changelogVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="bg-grey-900 rounded-2xl lg:rounded-3xl overflow-hidden shadow-xl">
              {/* Terminal Header */}
              <div className="bg-grey-900 px-4 py-3 flex items-center gap-2 border-b border-grey-100/10">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <span className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="ml-2 text-grey-100/60 text-sm font-mono">
                  CHANGELOG.md - v{frontmatter.version}
                </span>
              </div>

              {/* Terminal Content */}
              <div className="p-3 lg:p-4 font-mono text-xs lg:text-sm">
                <div className="text-grey-100/40 mb-4 hidden lg:block">
                  # Changelog for v{frontmatter.version}
                </div>

                {frontmatter.changelog.map((entry) => {
                  const typeColors: Record<string, string> = {
                    feat: 'text-green-light-900',
                    fix: 'text-green-middle-900',
                    refactor: 'text-blue-400',
                    docs: 'text-purple-400',
                    style: 'text-pink-400',
                    test: 'text-yellow-400',
                    chore: 'text-grey-100/60',
                    perf: 'text-orange-400',
                    ci: 'text-cyan-400',
                  }

                  const typeColor = typeColors[entry.type] ?? 'text-grey-100/60'
                  const repoBase = frontmatter.repository ?? DEFAULT_REPOSITORY

                  return (
                    <div
                      key={`${entry.type}-${entry.description.slice(0, 20)}`}
                      className="mb-3 lg:mb-2 text-grey-100/90"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-grey-100/40 select-none">$</span>
                        <div className="flex-1 min-w-0 flex flex-col lg:flex-row lg:items-start lg:justify-between lg:gap-4">
                          <div className="min-w-0">
                            <span className={`${typeColor} font-bold`}>
                              {entry.type}
                              {entry.scope && (
                                <span className="text-grey-100/40">({entry.scope})</span>
                              )}
                              <span className="text-grey-100/40">:</span>
                            </span>{' '}
                            <span className="break-words">{entry.description}</span>
                          </div>
                          {(entry.pr ?? entry.commit) && (
                            <span className="flex items-center gap-2 text-grey-100/40 text-xs mt-1 lg:mt-0 lg:flex-shrink-0">
                              {entry.pr && (
                                <a
                                  href={`${repoBase}/pull/${entry.pr}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-green-light-900 transition-colors"
                                >
                                  #{entry.pr}
                                </a>
                              )}
                              {entry.commit && (
                                <a
                                  href={`${repoBase}/commit/${entry.commit}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-green-light-900 transition-colors"
                                >
                                  {entry.commit.slice(0, 7)}
                                </a>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Prev/Next Navigation */}
        <nav
          ref={navRef}
          aria-label="Release Navigation"
          className={`mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all ${reducedMotion ? '' : 'duration-700'} ${
            navVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {prev ? (
            <Link
              to="/releases/$slug"
              params={{ slug: prev.slug }}
              className="group relative p-5 rounded-2xl border border-grey-200 bg-white hover:border-green-dark-900/30 hover:shadow-lg transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-light-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <span className="text-xs text-grey-500 uppercase tracking-wide font-semibold">
                  Neuere Version
                </span>
                <div className="flex items-center gap-3 mt-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-grey-100 text-grey-400 group-hover:bg-green-dark-900 group-hover:text-white transition-all">
                    ←
                  </span>
                  <div>
                    <span className="font-lato font-bold text-grey-900 group-hover:text-green-dark-900 transition-colors">
                      v{prev.frontmatter.version}
                    </span>
                    <p className="text-sm text-grey-600 line-clamp-1">{prev.frontmatter.title}</p>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              to="/releases/$slug"
              params={{ slug: next.slug }}
              className="group relative p-5 rounded-2xl border border-grey-200 bg-white hover:border-green-dark-900/30 hover:shadow-lg transition-all sm:text-right overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-bl from-green-light-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <span className="text-xs text-grey-500 uppercase tracking-wide font-semibold">
                  Ältere Version
                </span>
                <div className="flex items-center gap-3 mt-2 sm:justify-end">
                  <div>
                    <span className="font-lato font-bold text-grey-900 group-hover:text-green-dark-900 transition-colors">
                      v{next.frontmatter.version}
                    </span>
                    <p className="text-sm text-grey-600 line-clamp-1">{next.frontmatter.title}</p>
                  </div>
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-grey-100 text-grey-400 group-hover:bg-green-dark-900 group-hover:text-white transition-all">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ) : (
            <div />
          )}
        </nav>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-grey-100 text-center">
          <p className="text-grey-900/60 text-sm">
            Fehler gefunden oder Feedback zu diesem Release?{' '}
            <a
              href={`${frontmatter.repository ?? DEFAULT_REPOSITORY}/issues/new`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-dark-900 hover:underline font-medium"
            >
              Issue erstellen →
            </a>
          </p>
        </div>
      </article>
    </main>
  )
}

export default ReleaseDetailPage
