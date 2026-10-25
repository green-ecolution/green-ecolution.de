interface Person {
  id: string
  name: string
  imageUrl?: string
  url?: string
  sameAs?: readonly string[]
}

// A stable @id lets Google merge the founder on every page with the author of
// every article into one person.
export function personId(base: string, id: string): string {
  return `${base}/#person-${id}`
}

export function personSchema(base: string, person: Person) {
  return {
    '@type': 'Person',
    '@id': personId(base, person.id),
    name: person.name,
    ...(person.imageUrl ? { image: person.imageUrl } : {}),
    ...(person.url ? { url: person.url } : {}),
    ...(person.sameAs?.length ? { sameAs: person.sameAs } : {}),
  }
}
