import { type Directive } from '../api/types'
import { isArray, isString } from '../common/is-what'

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

type Class = string | Record<string, string | string[]> | null

const patchClass = (el: HTMLElement, next: Class, prev: Class): void => {
  const classList = el.classList
  const isClassString = isString(next)
  const isPrevClassString = isString(prev)
  if (next && !isClassString) {
    if (prev && !isPrevClassString) {
      for (const key in prev) {
        if (!(key in next) || !next[key]) {
          classList.remove(key)
        }
      }
    }
    for (const key in next) {
      if (next[key]) classList.add(key)
    }
  } else {
    if (isClassString) {
      if (prev !== next) {
        if (isPrevClassString) classList.remove(...prev.trim().split(/\s+/))
        classList.add(...next.trim().split(/\s+/))
      }
    } else if (prev) {
      if (isPrevClassString) classList.remove(...prev.trim().split(/\s+/))
    }
  }
}
