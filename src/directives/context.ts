import { type Directive } from '../api/types'
import { isObject } from '../common/is-what'
import { isRef } from '../reactivity/isRef'

/**
 * @internal
 */
export const contextDirective: Directive = {
  collectRefObj: true,
  mount: ({ parseResult }) => ({
    update: ({ values }) => {
      const ctx = parseResult.context
      const obj = values[0]
      if (!isObject(obj)) return
      for (const item of Object.entries(obj)) {
        const key = item[0]
        const nextValue = item[1]
        const ctxKey = ctx[key]
        if (ctxKey === nextValue) continue
        if (isRef(ctxKey)) {
          ctxKey(nextValue)
        } else {
          ctx[key] = nextValue
        }
      }
    },
  }),
}
