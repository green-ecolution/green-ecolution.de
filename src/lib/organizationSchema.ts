import { company } from '../data/company'

export function organizationSchema(base: string, description: string) {
  const [postalCode, ...city] = company.postalCodeAndCity.split(' ')

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.name,
    alternateName: 'Green Ecolution',
    url: base,
    logo: `${base}/assets/favicons/favicon.svg`,
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
  }
}
