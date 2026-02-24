import { afterAll, afterEach, beforeEach } from 'vitest'

import { ensureDomGlobals } from './minidom/createDom'
import { resetMiniDomCaches } from './minidom/minidom'

const restoreDomGlobals = ensureDomGlobals()

function resetDomState() {
  resetMiniDomCaches()
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
