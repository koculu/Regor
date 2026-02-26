import { expect, test, vi } from 'vitest'

import * as propModule from '../../src/directives/prop'
import { valueDirective } from '../../src/directives/value'
import { updateDirective } from '../directive-test-utils'

test('value directive delegates to patchProp with "value" key', () => {
  const spy = vi.spyOn(propModule, 'patchProp')
  const el = document.createElement('input')

  updateDirective(valueDirective, el, ['abc'])

  expect(spy).toHaveBeenCalledWith(el, 'value', 'abc')
})

test('value directive updates input value', () => {
  const el = document.createElement('input') as any

  updateDirective(valueDirective, el, [99])

  expect(el._value).toBe(99)
  expect(String(el.value)).toBe('99')
})
