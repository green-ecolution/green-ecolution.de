// Islands render on the server too, where there is no localStorage. Every reader
// therefore has to cope with it being absent, and every writer has to tolerate a
// browser that refuses to store (private mode throws rather than returning null).
function read(key: string): string | null {
  if (typeof localStorage === 'undefined') {
    return null
  }
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string): void {
  if (typeof localStorage === 'undefined') {
    return
  }
  try {
    localStorage.setItem(key, value)
  } catch {
    // Private mode can refuse writes; the visitor simply sees the intro again.
  }
}

export function setInitialLoad() {
  write('green_ecolution_initial_load', 'false')
}

export function isInitialLoad(): boolean {
  return read('green_ecolution_initial_load') !== 'false'
}

export function setStoredLanguage(language: string) {
  write('green_ecolution_language', language)
}

export function getStoredLanguage(): string | null {
  return read('green_ecolution_language')
}
