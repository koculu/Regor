import { expect, test } from 'vitest'

import { ContextRegistry } from '../../src/composition/ContextRegistry'

test('context registry registers and resolves by class', () => {
  class AppContext {
    readonly value = 1
  }

  const registry = new ContextRegistry()
  const app = new AppContext()
  registry.register(app)

  expect(registry.find(AppContext)).toBe(app)
  expect(registry.require(AppContext)).toBe(app)
})

test('context registry find supports base-class lookup', () => {
  abstract class BaseContext {}
  class FeatureContext extends BaseContext {
    readonly name = 'feature'
  }

  const registry = new ContextRegistry()
  const feature = new FeatureContext()
  registry.register(feature)

  expect(registry.find(BaseContext)).toBe(feature)
  expect(registry.require(BaseContext)).toBe(feature)
})

test('context registry unregisterByClass removes registered context', () => {
  class AppContext {}

  const registry = new ContextRegistry()
  registry.register(new AppContext())
  registry.unregisterByClass(AppContext)

  expect(registry.find(AppContext)).toBeUndefined()
})

test('context registry unregister removes only matching current instance', () => {
  class AppContext {
    constructor(readonly id: number) {}
  }

  const registry = new ContextRegistry()
  const first = new AppContext(1)
  const second = new AppContext(2)
  registry.register(first)
  registry.register(second)

  registry.unregister(first)
  expect(registry.find(AppContext)).toBe(second)

  registry.unregister(second)
  expect(registry.find(AppContext)).toBeUndefined()
})

test('context registry require throws for missing context', () => {
  class MissingContext {}

  const registry = new ContextRegistry()

  expect(() => registry.require(MissingContext)).toThrow(
    'MissingContext is not registered in ContextRegistry.',
  )
})
