import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { createComponent, html, RegorConfig } from '../../src'
import { warningHandler } from '../../src/log/warnings'

let originalWarning: (...args: unknown[]) => void

beforeEach(() => {
  originalWarning = warningHandler.warning
  warningHandler.warning = vi.fn()
})

afterEach(() => {
  warningHandler.warning = originalWarning
})

test('RegorConfig accepts explicit global context', () => {
  const g = { custom: 1 }
  const cfg = new RegorConfig(g)
  expect(cfg.globalContext).toBe(g)
})

test('RegorConfig warns when registering unnamed component', () => {
  const cfg = new RegorConfig()
  cfg.addComponent({ template: document.createDocumentFragment() } as any)
  expect(warningHandler.warning).toHaveBeenCalled()
})

test('RegorConfig registers named component and allows updates', () => {
  const cfg = new RegorConfig()
  const named = createComponent(html`<div>x</div>`, { defaultName: 'my-card' })
  cfg.addComponent(named)

  expect(cfg.__components.has('My-card')).toBe(true)
  expect(cfg.__componentsUpperCase.has('MY-CARD')).toBe(true)

  cfg.updateDirectives((directiveMap, builtInNames) => {
    directiveMap['@x'] = directiveMap['@']
    builtInNames.dynamic = '__dyn__'
  })
  expect(cfg.__directiveMap['@x']).toBeDefined()
  expect(cfg.__builtInNames.dynamic).toBe('__dyn__')
})
