import { afterAll, afterEach, beforeEach } from 'vitest'

import { ensureDomGlobals } from './minidom/registerDomGlobals'

const restoreDomGlobals = ensureDomGlobals()

function resetDomState() {
  const doc = globalThis.document as
    | (Document & { head?: ParentNode | null; body?: ParentNode | null })
    | undefined
  doc?.head?.replaceChildren()
  doc?.body?.replaceChildren()
  if ('localStorage' in globalThis) {
    ;(globalThis.localStorage as Storage).clear()
  }
  if ('sessionStorage' in globalThis) {
    ;(globalThis.sessionStorage as Storage).clear()
  }
}

beforeEach(() => {
  resetDomState()
})

afterEach(() => {
  resetDomState()
})

afterAll(() => {
  restoreDomGlobals()
})
