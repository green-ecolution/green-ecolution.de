import { company } from '../data/company'

export function organizationId(base: string): string {
  return `${base}/#organization`
}

export function organizationSchema(base: string, description: string, founder?: object) {
  const [postalCode, ...city] = company.postalCodeAndCity.split(' ')

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': organizationId(base),
    name: company.name,
    alternateName: 'Green Ecolution',
    url: base,
    logo: `${base}/assets/favicons/favicon.svg`,
    // Google reads an organization with an address as a local business, which
    // expects an image.
    image: `${base}/assets/images/open-graph-image.png`,
    description,
    email: company.email,
    telephone: company.phone.href.replace('tel:', ''),
    address: {
      '@type': 'PostalAddress',
      streetAddress: company.street,
      postalCode,
      addressLocality: city.join(' '),
      addressCountry: 'DE',
    },
    parentOrganization: { '@type': 'Organization', name: company.parentOrganization },
    sameAs: [company.githubUrl],
    ...(founder ? { founder } : {}),
  }
}
