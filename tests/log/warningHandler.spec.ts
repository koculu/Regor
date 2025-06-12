import { expect, test, vi } from 'vitest'
import { warningHandler } from '../../src'
import { warning, WarningType } from '../../src/log/warnings'

test('warningHandler can be overridden', () => {
  const spy = vi.fn()
  const prev = warningHandler.warning
  warningHandler.warning = spy
  const el = document.createElement('div')
  warning(WarningType.MissingBindingExpression, 'r-text', el)
  expect(spy).toHaveBeenCalled()
  warningHandler.warning = prev
})
