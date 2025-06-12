import { expect, test, vi } from 'vitest'
import { RegorConfig, ComponentHead } from '../../src'

test('getDefault returns singleton', () => {
  expect(RegorConfig.getDefault()).toBe(RegorConfig.getDefault())
})

test('global context contains helpers', () => {
  const cfg = new RegorConfig()
  expect(typeof cfg.globalContext.ref).toBe('function')
  expect(typeof cfg.globalContext.sref).toBe('function')
  expect(typeof cfg.globalContext.flatten).toBe('function')
})

test('updateDirectives applies changes', () => {
  const cfg = new RegorConfig()
  cfg.updateDirectives((map, names) => { names.foo = 'r-foo'; map['r-foo'] = {} as any })
  expect(cfg.__builtInNames.foo).toBe('r-foo')
  expect('r-foo' in cfg.__directiveMap).toBe(true)
})

test('ComponentHead unmount removes nodes', () => {
  const container = document.createElement('div')
  const start = document.createComment('s')
  const end = document.createComment('e')
  const span = document.createElement('span')
  container.append(start, span, end)
  const head = new ComponentHead({}, container, [{}], start, end)
  const fn = vi.fn()
  ;(head as any).unmounted = fn
  head.unmount()
  expect(container.contains(span)).toBe(false)
  expect(fn).toHaveBeenCalledTimes(1)
})
