import { expect, test, vi } from 'vitest'

import { type ParseResult, type SRef } from '../../src/api/types'
import { modelDirective } from '../../src/directives/model'
import { warningHandler } from '../../src/log/warnings'
import { ref } from '../../src/reactivity/ref'
import { bindDirective, updateDirective } from '../directive-test-utils'

const makeParseResult = (
  refs: any[],
  getValue: () => [any, any],
): ParseResult => {
  const value = function (newValue?: unknown) {
    if (arguments.length > 0) return newValue as unknown[]
    return getValue()
  } as SRef<unknown[]>
  ;(value as any).value = getValue()
  return {
    value,
    subscribe: () => () => {},
    stop: () => {},
    refs,
    context: {},
  }
}

const updateModel = (
  el: HTMLElement,
  value: unknown,
  flags: unknown = '',
): void => {
  let modelValue = value
  const modelRef = function (nextValue?: unknown) {
    if (arguments.length === 0) return modelValue
    modelValue = nextValue
    return modelValue
  } as any
  const parseResult = makeParseResult([modelRef], () => [modelRef(), flags])
  updateDirective(
    modelDirective,
    el,
    [value],
    undefined,
    undefined,
    undefined,
    undefined,
    parseResult,
  )
}

test('model number parser returns early for trailing decimal when value is unchanged', () => {
  let model = 1
  let setCalls = 0
  const modelRef = function (v?: any) {
    if (arguments.length === 0) return model
    model = v
    setCalls++
    return model
  } as any
  const input = document.createElement('input')
  const parseResult = makeParseResult([modelRef], () => [modelRef(), 'number'])
  bindDirective(modelDirective, input, parseResult, 'expr')

  input.value = '1.'
  input.dispatchEvent(new Event('input'))

  expect(setCalls).toBe(0)
  expect(model).toBe(1)
})

test('model number parser handles invalid trailing decimal values', () => {
  let model: any = 'init'
  const modelRef = function (v?: any) {
    if (arguments.length === 0) return model
    model = v
    return model
  } as any
  const input = document.createElement('input')
  const parseResult = makeParseResult([modelRef], () => [modelRef(), 'number'])
  bindDirective(modelDirective, input, parseResult, 'expr')

  input.value = 'x.'
  input.dispatchEvent(new Event('input'))

  expect(model).toBe('')
  expect(input.value).toBe('')
})

test('model number parser trailing decimal executes non-NaN branch', () => {
  let model: any = 0
  const modelRef = function (v?: any) {
    if (arguments.length === 0) return model
    model = v
    return model
  } as any
  const input = document.createElement('input')
  const parseResult = makeParseResult([modelRef], () => [modelRef(), 'number'])
  bindDirective(modelDirective, input, parseResult, 'expr')

  input.value = '1.'
  input.dispatchEvent(new Event('input'))

  expect(model).toBe(1)
})

test('model checkbox set binding adds and deletes values', () => {
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.value = 'x'
  const bag = new Set<string>()
  const modelRef = function (v?: any) {
    if (arguments.length === 0) return bag
    return v
  } as any
  const parseResult = makeParseResult([modelRef], () => [modelRef(), ''])
  bindDirective(modelDirective, input, parseResult, 'expr')

  input.checked = true
  input.dispatchEvent(new Event('change'))
  expect(bag.has('x')).toBe(true)

  input.checked = false
  input.dispatchEvent(new Event('change'))
  expect(bag.has('x')).toBe(false)
})

test('model checkbox array binding noops when checked value is already present', () => {
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.value = 'x'
  const list = ['x']
  const modelRef = function (v?: any) {
    if (arguments.length === 0) return list
    return v
  } as any
  const parseResult = makeParseResult([modelRef], () => [modelRef(), ''])
  bindDirective(modelDirective, input, parseResult, 'expr')

  input.checked = true
  input.dispatchEvent(new Event('change'))
  expect(list).toStrictEqual(['x'])
})

test('model radio/select listeners noop after model ref is removed', () => {
  const radio = document.createElement('input')
  radio.type = 'radio'
  radio.value = 'a'
  const select = document.createElement('select')
  const opt = document.createElement('option')
  opt.value = 'x'
  opt.selected = true
  select.appendChild(opt)

  let value = 'init'
  const modelRef = function (v?: any) {
    if (arguments.length === 0) return value
    value = v
    return value
  } as any
  const radioResult = makeParseResult([modelRef], () => [modelRef(), ''])
  const selectResult = makeParseResult([modelRef], () => [modelRef(), ''])

  bindDirective(modelDirective, radio, radioResult, 'expr')
  bindDirective(modelDirective, select, selectResult, 'expr')

  radioResult.refs[0] = undefined
  selectResult.refs[0] = undefined
  radio.dispatchEvent(new Event('change'))
  select.dispatchEvent(new Event('change'))

  expect(value).toBe('init')
})

test('model input unbinder removes composition and input listeners', () => {
  let model: any = 'init'
  const modelRef = function (v?: any) {
    if (arguments.length === 0) return model
    model = v
    return model
  } as any
  const input = document.createElement('input')
  const parseResult = makeParseResult([modelRef], () => [modelRef(), 'trim'])
  const unbind = bindDirective(modelDirective, input, parseResult, 'expr')

  unbind()
  input.value = ' next '
  input.dispatchEvent(new Event('input'))
  input.dispatchEvent(new Event('change'))
  input.dispatchEvent(new Event('compositionstart'))
  input.dispatchEvent(new Event('compositionend'))

  expect(model).toBe('init')
})

test('model checkbox fallback value and attr-based true/false values are supported', () => {
  const input = document.createElement('input')
  input.type = 'checkbox'
  const model = ref<any>('seed')
  const parseResult = makeParseResult([model], () => [model(), ''])
  bindDirective(modelDirective, input, parseResult, 'expr')

  input.checked = true
  input.dispatchEvent(new Event('change'))
  expect(model()).toBe(true)

  input.checked = false
  input.dispatchEvent(new Event('change'))
  expect(model()).toBe(false)

  input.setAttribute('true-value', 'yes')
  input.setAttribute('false-value', 'no')
  input.checked = true
  input.dispatchEvent(new Event('change'))
  expect(model()).toBe('yes')

  input.checked = false
  input.dispatchEvent(new Event('change'))
  expect(model()).toBe('no')

  input.removeAttribute('true-value')
  input.removeAttribute('false-value')
  updateModel(input, true)
  expect(input.checked).toBe(true)
})

test('model input composition handlers and trimmer execute expected branches', () => {
  let model: any = ''
  const modelRef = function (v?: any) {
    if (arguments.length === 0) return model
    model = v
    return model
  } as any
  const input = document.createElement('input')
  const parseResult = makeParseResult([modelRef], () => [modelRef(), 'trim'])
  bindDirective(modelDirective, input, parseResult, 'expr')

  input.value = '  keep  '
  input.dispatchEvent(new Event('change'))
  expect(input.value).toBe('keep')

  input.value = '  comp  '
  input.dispatchEvent(new Event('compositionstart'))
  input.dispatchEvent(new Event('input'))
  expect(model).toBe('')

  input.dispatchEvent(new Event('compositionend'))
  expect(model).toBe('comp')
})

test('model checkbox unbind removes listener', () => {
  const input = document.createElement('input')
  input.type = 'checkbox'
  const model = ref<any>(false)
  const parseResult = makeParseResult([model], () => [model(), ''])
  const unbind = bindDirective(modelDirective, input, parseResult, 'expr')
  unbind()

  input.checked = true
  input.dispatchEvent(new Event('change'))
  expect(model()).toBe(false)
})

test('model onChange covers radio, checkbox-set and select-multiple array branches', () => {
  const radio = document.createElement('input')
  radio.type = 'radio'
  radio.value = 'r'
  updateModel(radio, 'r')
  expect(radio.checked).toBe(true)

  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.value = 'x'
  updateModel(checkbox, new Set(['x']))
  expect(checkbox.checked).toBe(true)

  const select = document.createElement('select')
  select.multiple = true
  const a = document.createElement('option')
  a.value = 'a'
  const b = document.createElement('option')
  b.value = 'b'
  select.appendChild(a)
  select.appendChild(b)
  updateModel(select, ['b'])
  expect(a.selected).toBe(false)
  expect(b.selected).toBe(true)
})

test('model onBind handles object flags and unsupported element branch', () => {
  let model: any = ''
  const modelRef = function (v?: any) {
    if (arguments.length === 0) return model
    model = v
    return model
  } as any
  const input = document.createElement('input')
  const parseResult = makeParseResult([modelRef], () => [
    modelRef(),
    { trim: true },
  ])
  bindDirective(modelDirective, input, parseResult, 'expr')

  input.value = '  x  '
  input.dispatchEvent(new Event('input'))
  expect(model).toBe('x')

  const div = document.createElement('div')
  const parse2 = makeParseResult([modelRef], () => [modelRef(), {}])
  const warnSpy = vi
    .spyOn(warningHandler, 'warning')
    .mockImplementation(() => undefined)
  try {
    const unbind = bindDirective(modelDirective, div, parse2, 'expr')
    expect(typeof unbind).toBe('function')
    expect(() => unbind()).not.toThrow()
  } finally {
    warnSpy.mockRestore()
  }
})

test('model getFlags resolves ref and function flags', () => {
  let model: any = ''
  const modelRef = function (v?: any) {
    if (arguments.length === 0) return model
    model = v
    return model
  } as any
  const input = document.createElement('input')
  const parseResult = makeParseResult([modelRef], () => [
    modelRef(),
    ref(() => ({ trim: true })),
  ])
  bindDirective(modelDirective, input, parseResult, 'expr')

  input.value = '  x  '
  input.dispatchEvent(new Event('input'))
  expect(model).toBe('x')
})

test('model input and checkbox listeners return early when model ref is removed', () => {
  let model: any = 'init'
  const modelRef = function (v?: any) {
    if (arguments.length === 0) return model
    model = v
    return model
  } as any

  const input = document.createElement('input')
  const inputResult = makeParseResult([modelRef], () => [modelRef(), ''])
  bindDirective(modelDirective, input, inputResult, 'expr')
  inputResult.refs[0] = undefined
  input.value = 'next'
  input.dispatchEvent(new Event('input'))
  expect(model).toBe('init')

  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.value = 'x'
  const boxResult = makeParseResult([modelRef], () => [modelRef(), ''])
  bindDirective(modelDirective, checkbox, boxResult, 'expr')
  boxResult.refs[0] = undefined
  checkbox.checked = true
  checkbox.dispatchEvent(new Event('change'))
  expect(model).toBe('init')
})

test('model reads _value payloads and select number flag converts selected values', () => {
  const radio = document.createElement('input') as HTMLInputElement & {
    _value?: any
  }
  radio.type = 'radio'
  radio.value = 'fallback'
  radio._value = { id: 1 }
  updateModel(radio, { id: 1 })
  expect(radio.checked).toBe(true)

  const select = document.createElement('select')
  const a = document.createElement('option') as HTMLOptionElement & {
    _value?: any
  }
  const b = document.createElement('option') as HTMLOptionElement & {
    _value?: any
  }
  a._value = '1.5'
  b._value = '2.5'
  a.selected = true
  b.selected = true
  select.multiple = true
  select.appendChild(a)
  select.appendChild(b)

  const model = ref<any>('init')
  const parseResult = makeParseResult([model], () => [model(), 'number'])
  bindDirective(modelDirective, select, parseResult, 'expr')
  select.dispatchEvent(new Event('change'))

  const selected = model() as any[]
  expect(selected.length).toBe(2)
  expect(selected[0]).toBe(1.5)
  expect(selected[1]).toBe(2.5)
})

test('model onChange keeps selectedIndex when single-select already points to matched option', () => {
  const select = document.createElement('select')
  const a = document.createElement('option')
  a.value = 'a'
  const b = document.createElement('option')
  b.value = 'b'
  b.selected = true
  select.appendChild(a)
  select.appendChild(b)

  expect(select.selectedIndex).toBe(1)
  updateModel(select, 'b')
  expect(select.selectedIndex).toBe(1)
})
