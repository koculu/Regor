import { type Directive, type ParseResult, type Unbinder } from '../api/types'
import { observe } from '../observer/observe'
import { isRef } from '../reactivity/isRef'
import { camelize } from '../common/common'

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
    const stopObserving = observe(
      parseResult.value,
      () => {
        const value = parseResult.refs[0] ?? parseResult.value()[0]
        const ctx = parseResult.context
        const ctxKey = ctx[option]
        if (ctxKey === value) return
        if (isRef(ctxKey)) {
          ctxKey(value)
        } else {
          ctx[key] = value
        }
      },
      true,
    )
    return stopObserving
  },
}
