import { defineCollection, reference } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const releases = defineCollection({
  loader: glob({
    pattern: '**/*.mdx',
    base: './src/content/releases',
    // The default id slugifies, turning de/v0.5.0 into de/v050 and with it every
    // public release URL. Keep the path verbatim so /de/releases/v0.5.0 survives.
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ''),
  }),
  schema: z.object({
    version: z.string(),
    date: z.coerce.date(),
    title: z.string(),
    summary: z.string(),
    highlights: z.array(z.string()).default([]),
    changelog: z
      .array(
        z.object({
          // A previously unseen type has to fail the build rather than render blank.
          type: z.enum(['feat', 'fix', 'perf', 'refactor', 'docs', 'chore', 'style', 'test', 'ci']),
          scope: z.string().optional(),
          description: z.string(),
          pr: z.number().optional(),
          // Unused by every release file so far. The changelog component renders
          // it, and zod would drop it silently, so it belongs in the schema.
          commit: z.string().optional(),
        }),
      )
      .default([]),
    // No release file sets this today. It is in the schema because the detail
    // page reads it, and zod would silently drop it otherwise.
    repository: z.url().optional(),
    author: reference('authors'),
  }),
})

const authors = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/authors' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      // The role is per language even though an article may fall back to German:
      // the byline should still read english on /en.
      role: z.object({ de: z.string(), en: z.string() }),
      image: image().optional(),
      // Public profiles of the person, emitted as schema.org sameAs.
      sameAs: z.array(z.url()).optional(),
    }),
})

const blog = defineCollection({
  loader: glob({
    pattern: '**/*.mdx',
    base: './src/content/blog',
    // Same reason as the releases: the default id slugifies and would eat the
    // language prefix the language fallback reads.
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ''),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      summary: z.string(),
      cover: image(),
      // Not optional. A cover without alt text is a hole in the page for anyone
      // on a screen reader, and the build is the only place that reliably asks.
      coverAlt: z.string(),
      // A wrong key has to fail the build instead of rendering a blank byline.
      author: reference('authors'),
    }),
})

export const collections = { releases, authors, blog }
