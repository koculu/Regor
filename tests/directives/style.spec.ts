import { expect, test } from 'vitest'

import { getBindData } from '../../src/cleanup/getBindData'
import { styleDirective } from '../../src/directives/style'
import { updateDirective } from '../directive-test-utils'

test('style directive applies object and removes missing previous keys', () => {
  const el = document.createElement('div')

  updateDirective(
    styleDirective,
    el,
    [{ color: 'red', marginTop: '2px' }],
    [{ color: 'blue', padding: '1px' }],
  )

  expect(el.style.color).toBe('red')
  expect(el.style.marginTop).toBe('2px')
  expect(el.style.padding).toBe('')
})

test('style directive supports array syntax and !important', () => {
  const el = document.createElement('div')

  updateDirective(styleDirective, el, [
    [{ color: 'red !important' }, { '--x': '1' }],
  ])

  expect(el.style.getPropertyValue('color')).toBe('red !important')
  expect(el.style.getPropertyValue('--x')).toBe('1')
})

test('style directive applies cssText for string styles', () => {
  const el = document.createElement('div')

  updateDirective(
    styleDirective,
    el,
    ['color: blue; padding: 4px'],
    ['color: red'],
  )

  expect(el.style.color).toBe('blue')
  expect(el.style.padding).toBe('4px')
})

test('style directive removes style attribute on null and preserves display', () => {
  const el = document.createElement('div')
  el.style.display = 'inline-block'
  el.setAttribute('style', 'display: inline-block; color: red')

  updateDirective(styleDirective, el, [null], ['color: red'])

  expect(el.getAttribute('style')).toBe('display: inline-block')
  expect(el.style.display).toBe('inline-block')
})

test('style directive keeps display unchanged when _ord marker exists', () => {
  const el = document.createElement('div')
  el.style.display = 'none'
  getBindData(el).data._ord = 1

  updateDirective(styleDirective, el, [null], ['display: none'])

  expect(el.style.display).toBe('')
})

test('style directive handles array values, null values, and prefix cache paths', () => {
  const fakeStyle: Record<string, any> = {
    display: '',
    color: '',
    WebkitTransform: '',
    setProperty(name: string, value: string): void {
      this[name] = value
    },
  }
  const fakeEl = {
    style: fakeStyle,
    removeAttribute: () => {},
  } as unknown as HTMLElement

  updateDirective(styleDirective, fakeEl, [
    { color: ['red', 'blue'], transform: 'scale(1)' },
  ])
  expect(fakeStyle.color).toBe('blue')
  expect(fakeStyle.WebkitTransform).toBe('scale(1)')

  updateDirective(
    styleDirective,
    fakeEl,
    [{ color: null }],
    [{ color: 'blue' }],
  )
  expect(fakeStyle.color).toBe('')

  updateDirective(styleDirective, fakeEl, [{ color: 'green' }])
  expect(fakeStyle.color).toBe('green')
})

test('style directive does not rewrite cssText when string value is unchanged', () => {
  const el = document.createElement('div')
  el.style.cssText = 'color: red;'

  updateDirective(styleDirective, el, ['color: red;'], ['color: red;'])

  expect(el.style.color).toBe('red')
})
