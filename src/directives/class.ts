import { type Directive } from '../api/types'
import { toClassTokens } from '../common/class-tokens'
import { isArray, isString } from '../common/is-what'
import { unref } from '../reactivity/unref'

/**
 * @internal
 */
const updateClass = (
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
        patchClass(el, next[j], previous?.[j])
      }
    } else {
      patchClass(el, next, previous)
    }
  }
}

export const classDirective: Directive = {
  mount: () => ({
    update: ({ el, values, previousValues }) => {
      updateClass(el, values as any[], previousValues as any[] | undefined)
    },
  }),
}

type Class = string | Record<string, unknown> | null

const patchClass = (el: HTMLElement, next: Class, prev: Class): void => {
  const nextValue = unref(next) as Class
  const prevValue = unref(prev) as Class
  const classList = el.classList
  const isClassString = isString(nextValue)
  const isPrevClassString = isString(prevValue)
  if (nextValue && !isClassString) {
    const nextMap = nextValue as Record<string, unknown>
    if (prevValue && !isPrevClassString) {
      const prevMap = prevValue as Record<string, unknown>
      for (const key in prevMap) {
        if (!(key in nextMap) || !unref(nextMap[key])) {
          classList.remove(key)
        }
      }
    }
    for (const key in nextMap) {
      if (unref(nextMap[key])) classList.add(key)
    }
  } else {
    if (isClassString) {
      if (prevValue !== nextValue) {
        const prevTokens = isPrevClassString ? toClassTokens(prevValue) : []
        const nextTokens = toClassTokens(nextValue)
        if (prevTokens.length > 0) classList.remove(...prevTokens)
        if (nextTokens.length > 0) classList.add(...nextTokens)
      }
    } else if (prevValue) {
      const prevTokens = isPrevClassString ? toClassTokens(prevValue) : []
      if (prevTokens.length > 0) classList.remove(...prevTokens)
    }
  }
}
