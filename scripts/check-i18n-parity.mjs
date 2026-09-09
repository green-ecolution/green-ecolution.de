import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const LANGUAGES = ['de', 'en']
const REFERENCE = 'de'

const localesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'i18n', 'locales')

// Derived from the catalog files rather than listed here: a namespace added to
// the locales but forgotten in a hardcoded list would never be checked at all.
function namespacesOf(language) {
  return readdirSync(join(localesDir, language))
    .filter((entry) => entry.endsWith('.json'))
    .map((entry) => entry.slice(0, -'.json'.length))
    .sort()
}

function flatten(value, prefix = '') {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return [prefix]
  }

  return Object.entries(value).flatMap(([key, nested]) =>
    flatten(nested, prefix ? `${prefix}.${key}` : key),
  )
}

function keysOf(language, namespace) {
  const path = join(localesDir, language, `${namespace}.json`)
  return new Set(flatten(JSON.parse(readFileSync(path, 'utf8'))).filter(Boolean))
}

const problems = []
const referenceNamespaces = namespacesOf(REFERENCE)
const targetLanguages = LANGUAGES.filter((entry) => entry !== REFERENCE)

for (const language of targetLanguages) {
  const namespaces = namespacesOf(language)

  for (const namespace of referenceNamespaces) {
    if (!namespaces.includes(namespace)) {
      problems.push(`${language}: fehlende Katalogdatei "${namespace}.json"`)
    }
  }

  for (const namespace of namespaces) {
    if (!referenceNamespaces.includes(namespace)) {
      problems.push(`${language}: Katalogdatei "${namespace}.json" existiert nicht in ${REFERENCE}`)
    }
  }

  for (const namespace of referenceNamespaces.filter((entry) => namespaces.includes(entry))) {
    const reference = keysOf(REFERENCE, namespace)
    const target = keysOf(language, namespace)

    for (const key of reference) {
      if (!target.has(key)) {
        problems.push(`${language}/${namespace}.json: fehlender Key "${key}"`)
      }
    }

    for (const key of target) {
      if (!reference.has(key)) {
        problems.push(`${language}/${namespace}.json: Key "${key}" existiert nicht in ${REFERENCE}`)
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`i18n-Parity fehlgeschlagen, ${problems.length} Abweichung(en):`)
  for (const problem of problems) {
    console.error(`  ${problem}`)
  }
  process.exit(1)
}

console.log(`i18n-Parity in Ordnung (${referenceNamespaces.length} Namespaces).`)
