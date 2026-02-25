import { type Directive, type ParseResult, type Unbinder } from '../api/types'
import { isObject } from '../common/is-what'
import { observe } from '../observer/observe'
import { isRef } from '../reactivity/isRef'

/**
 * @internal
 */
export const contextDirective: Directive = {
  collectRefObj: true,
  onBind: (_: HTMLElement, parseResult: ParseResult): Unbinder => {
    const stopObserving = observe(
      parseResult.value,
      () => {
        const value = parseResult.value()
        const ctx = parseResult.context
        const obj = value[0]
        if (!isObject(obj)) {
          return
        }
        for (const item of Object.entries(obj)) {
          const key = item[0]
          const value = item[1]
          const ctxKey = ctx[key]
          if (ctxKey === value) continue
          if (isRef(ctxKey)) {
            ctxKey(value)
          } else {
            ctx[key] = value
          }
        }
      },
      true,
    )
    return stopObserving
  },
}
