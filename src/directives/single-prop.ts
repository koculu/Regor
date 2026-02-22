import { type Directive, type ParseResult, type Unbinder } from '../api/types'
import { camelize } from '../common/common'
import { observe } from '../observer/observe'
import { entangle } from '../reactivity/entangle'
import { isRef } from '../reactivity/isRef'

/**
 * @internal
 */
export const singlePropDirective: Directive = {
  collectRefObj: true,
  onBind: (
    _: HTMLElement,
    parseResult: ParseResult,
    _expr: string,
    option?: string,
    _dynamicOption?: ParseResult,
    _flags?: string[],
  ): Unbinder => {
    if (!option) return () => {}
    const key = camelize(option)
    let stopEntangle: Unbinder = () => {}
    const stopObserving = observe(
      parseResult.value,
      () => {
        const value = parseResult.refs[0] ?? parseResult.value()[0]
        const ctx = parseResult.context
        const ctxKey = ctx[key]
        if (ctxKey === value) return

        if (isRef(value)) {
          if (isRef(ctxKey)) {
            stopEntangle()
            stopEntangle = entangle(value, ctxKey)
            return
          }
          ctx[key] = value
          return
        }

        stopEntangle()
        stopEntangle = () => {}
        if (isRef(ctxKey)) {
          ctxKey(value)
          return
        }
        ctx[key] = value
      },
      true,
    )
    return () => {
      stopEntangle()
      stopObserving()
    }
  },
}
