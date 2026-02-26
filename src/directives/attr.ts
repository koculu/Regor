import { type Directive } from '../api/types'
import { camelize } from '../common/common'
import {
  isArray,
  isNullOrUndefined,
  isObject,
  isString,
} from '../common/is-what'
import { warning, WarningType } from '../log/warnings'

const xlinkNS = 'http://www.w3.org/1999/xlink'

const booleanAttributes: any = {
  itemscope: 2,
  allowfullscreen: 2,
  formnovalidate: 2,
  ismap: 2,
  nomodule: 2,
  novalidate: 2,
  readonly: 2,
  async: 1,
  autofocus: 1,
  autoplay: 1,
  controls: 1,
  default: 1,
  defer: 1,
  disabled: 1,
  hidden: 1,
  inert: 1,
  loop: 1,
  open: 1,
  required: 1,
  reversed: 1,
  scoped: 1,
  seamless: 1,
  checked: 1,
  muted: 1,
  multiple: 1,
  selected: 1,
}

function includeBooleanAttr(value: unknown): boolean {
  return !!value || value === ''
}

/**
 * @internal
 */
const updateAttr = (
  el: HTMLElement,
  values: any[],
  previousValues?: any[],
  option?: any,
  previousOption?: any,
  flags?: string[],
): void => {
  if (option) {
    if (flags && flags.includes('camel')) option = camelize(option as string)
    patchAttribute(el, option as string, values[0], previousOption as string)
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
      const previousKey = previousValues?.[i]?.[0]
      const key = next[0]
      const value = next[1]
      patchAttribute(el, key, value, previousKey)
    } else if (isObject(next)) {
      for (const item of Object.entries(next)) {
        const key = item[0]
        const value = item[1]
        const p = previousValues?.[i]
        const previousKey = p && key in p ? key : undefined
        patchAttribute(el, key, value, previousKey)
      }
    } else {
      const previousKey = previousValues?.[i]
      const key = values[i++]
      const value = values[i]
      patchAttribute(el, key, value, previousKey)
    }
  }
}

export const attrDirective: Directive = {
  mount: () => ({
    update: ({ el, values, previousValues, option, previousOption, flags }) => {
      updateAttr(
        el,
        values as any[],
        previousValues as any[] | undefined,
        option,
        previousOption,
        flags,
      )
    },
  }),
}

const patchAttribute = (
  el: HTMLElement,
  key: string,
  value: any,
  previousKey?: string,
): void => {
  if (previousKey && previousKey !== key) {
    el.removeAttribute(previousKey)
  }

  if (isNullOrUndefined(key)) {
    warning(WarningType.KeyIsEmpty, 'r-bind', el)
    return
  }

  if (!isString(key)) {
    warning(
      WarningType.ErrorLog,
      `Attribute key is not string at ${el.outerHTML}`,
      key,
    )
    return
  }

  if (key.startsWith('xlink:')) {
    if (isNullOrUndefined(value)) {
      el.removeAttributeNS(xlinkNS, key.slice(6, key.length))
    } else {
      el.setAttributeNS(xlinkNS, key, value)
    }
    return
  }

  const isBoolean = key in booleanAttributes
  if (isNullOrUndefined(value) || (isBoolean && !includeBooleanAttr(value))) {
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, isBoolean ? '' : value)
  }
}
