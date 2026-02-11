import { type Directive } from '../api/types'
import { unbind } from '../cleanup/unbind'
import { camelize } from '../common/common'
import { isArray, isNullOrUndefined, isObject } from '../common/is-what'
import { warning, WarningType } from '../log/warnings'

/**
 * @internal
 */
export const propDirective: Directive = {
  onChange: (
    el: HTMLElement,
    values: any[],
    _previousValues?: any[],
    option?: any,
    _previousOption?: any,
    flags?: string[],
  ) => {
    if (option) {
      if (flags && flags.includes('camel')) option = camelize(option)
      patchProp(el, option, values[0])
      return
    }
    // supports
    // k,v,k,v
    // [k,v],[k,v]...
    // {k,v},{k,v}...
    const len = values.length
    for (let i = 0; i < len; ++i) {
      const next = values[i]
      if (isArray(next)) {
        const key = next[0]
        const value = next[1]
        patchProp(el, key, value)
      } else if (isObject(next)) {
        for (const item of Object.entries(next)) {
          const key = item[0]
          const value = item[1]
          patchProp(el, key, value)
        }
      } else {
        const key = values[i++]
        const value = values[i]
        patchProp(el, key, value)
      }
    }
  },
}
// The following property patch logic is copied from vuejs/core.
// using the license: The MIT License (MIT)
// Copyright (c) 2018-present, Yuxi (Evan) You
// https://github.com/vuejs/core/blob/main/packages/runtime-dom/src/modules/prop.ts

function includeBooleanAttr(value: unknown): boolean {
  return !!value || value === ''
}

/**
 * @internal
 */
export const patchProp = (el: any, key: string, value: any): void => {
  if (isNullOrUndefined(key)) {
    warning(WarningType.KeyIsEmpty, name, el)
    return
  }

  if (key === 'innerHTML' || key === 'textContent') {
    const childNodes = [...el.childNodes]
    setTimeout(() => childNodes.forEach(unbind), 1)
    el[key] = value ?? ''
    return
  }

  const tag = el.tagName

  if (
    key === 'value' &&
    tag !== 'PROGRESS' &&
    // custom elements may use _value internally
    !tag.includes('-')
  ) {
    // store value as _value as well since
    // non-string values will be stringified.
    el._value = value
    // #4956: <option> value will fallback to its text content so we need to
    // compare against its attribute value instead.
    const oldValue = tag === 'OPTION' ? el.getAttribute('value') : el.value
    const newValue = value ?? ''
    if (oldValue !== newValue) {
      el.value = newValue
    }
    if (value == null) {
      el.removeAttribute(key)
    }
    return
  }

  let needRemove = false
  if (value === '' || value == null) {
    const type = typeof el[key]
    if (type === 'boolean') {
      // e.g. <select multiple> compiles to { multiple: '' }
      value = includeBooleanAttr(value)
    } else if (value == null && type === 'string') {
      // e.g. <div :id="null">
      value = ''
      needRemove = true
    } else if (type === 'number') {
      // e.g. <img :width="null">
      value = 0
      needRemove = true
    }
  }

  // some properties perform value validation and throw,
  // some properties has getter, no setter, will error in 'use strict'
  // eg. <select :type="null"></select> <select :willValidate="null"></select>
  try {
    el[key] = value
  } catch (e) {
    // do not warn if value is auto-coerced from nullish values
    if (!needRemove) {
      warning(WarningType.PropertyAssignmentFailed, key, tag, value, e)
    }
  }
  needRemove && el.removeAttribute(key)
}
