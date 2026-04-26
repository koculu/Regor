import { type Directive } from '../api/types'
import { getBindData } from '../cleanup/getBindData'
import { camelize, capitalize, hyphenate } from '../common/common'
import { isArray, isString } from '../common/is-what'
import { unref } from '../reactivity/unref'

/**
 * @internal
 */
const updateStyle = (
  el: HTMLElement,
  values: any[],
  previousValues?: any[],
): void => {
  // supports
  // s1,s2,s3,s4
  // [s1,s2],[s3,s4]...
  // {k:v,...},{k:v,...}...
  const len = values.length
  for (let i = 0; i < len; ++i) {
    const next = values[i]
    const previous = previousValues?.[i]
    if (isArray(next)) {
      const len2 = next.length
      for (let j = 0; j < len2; ++j) {
        patchStyle(el, next[j], previous?.[j])
      }
    } else {
      patchStyle(el, next, previous)
    }
  }
}

export const styleDirective: Directive = {
  mount: () => ({
    update: ({ el, values, previousValues }) => {
      updateStyle(el, values as any[], previousValues as any[] | undefined)
    },
  }),
}

// The following style patch logic is copied from vuejs/core.
// using the license: The MIT License (MIT)
// Copyright (c) 2018-present, Yuxi (Evan) You
// https://github.com/vuejs/core/blob/main/packages/runtime-dom/src/modules/style.ts
type Style = string | Record<string, unknown> | null

const patchStyle = (el: HTMLElement, next: Style, prev: Style): void => {
  const nextValue = unref(next) as Style
  const prevValue = unref(prev) as Style
  const style = el.style
  const isCssString = isString(nextValue)
  if (nextValue && !isCssString) {
    const nextMap = nextValue as Record<string, unknown>
    if (prevValue && !isString(prevValue)) {
      const prevMap = prevValue as Record<string, unknown>
      for (const key in prevMap) {
        if (unref(nextMap[key]) == null) {
          setStyle(style, key, '')
        }
      }
    }
    for (const key in nextMap) {
      setStyle(style, key, nextMap[key])
    }
  } else {
    const currentDisplay = style.display
    if (isCssString) {
      if (prevValue !== nextValue) {
        style.cssText = nextValue
      }
    } else if (prevValue) {
      el.removeAttribute('style')
    }
    // if :show binding is active on the element, keep the display as is.
    const data = getBindData(el).data
    if ('_ord' in data) return
    style.display = currentDisplay
  }
}

const importantRE = /\s*!important$/

function setStyle(
  style: CSSStyleDeclaration,
  name: string,
  val: unknown,
): void {
  const value = unref(val)
  if (isArray(value)) {
    value.forEach((v) => {
      setStyle(style, name, v)
    })
  } else {
    const cssValue = value == null ? '' : String(value)
    if (name.startsWith('--')) {
      // custom property definition
      style.setProperty(name, cssValue)
    } else {
      const prefixed = autoPrefix(style, name)
      if (importantRE.test(cssValue)) {
        // !important
        style.setProperty(
          hyphenate(prefixed),
          cssValue.replace(importantRE, ''),
          'important',
        )
      } else {
        style[prefixed as any] = cssValue
      }
    }
  }
}

const prefixes = ['Webkit', 'Moz', 'ms']
const prefixCache: Record<string, string> = {}

function autoPrefix(style: CSSStyleDeclaration, rawName: string): string {
  const cached = prefixCache[rawName]
  if (cached) {
    return cached
  }
  let name = camelize(rawName)
  if (name !== 'filter' && name in style) {
    return (prefixCache[rawName] = name)
  }
  name = capitalize(name)
  for (let i = 0; i < prefixes.length; i++) {
    const prefixed = prefixes[i] + name
    if (prefixed in style) {
      return (prefixCache[rawName] = prefixed)
    }
  }
  return rawName
}
