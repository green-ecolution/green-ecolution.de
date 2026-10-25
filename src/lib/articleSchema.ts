import { organizationId } from './organizationSchema'

interface Article {
  url: string
  headline: string
  description: string
  datePublished: string
  imageUrl: string
  author: object
}

export function articleSchema(base: string, article: Article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: article.url,
    headline: article.headline,
    description: article.description,
    datePublished: article.datePublished,
    image: [article.imageUrl],
    author: article.author,
    publisher: { '@id': organizationId(base) },
  }
}
