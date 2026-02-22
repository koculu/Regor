import { type IRegorContext, type Scope } from '../api/types'
import { isObject } from '../common/is-what'
import { callUnmounted } from './callUnmounted'
import { popScope, pushScope, setScope } from './stack'

const scopeSymbol = Symbol('scope')

export const useScope = <TRegorContext extends IRegorContext | object>(
  context: () => TRegorContext,
): Scope<TRegorContext> => {
  try {
    pushScope()
    const ctx = context()
    setScope(ctx as IRegorContext)
    const result = {
      context: ctx,
      unmount: () => callUnmounted(ctx as IRegorContext),
      [scopeSymbol]: 1,
    } as unknown as Scope<TRegorContext>
    ;(result as any)[scopeSymbol] = 1
    return result
  } finally {
    popScope()
  }
}

export const isScope = (value: unknown): value is Scope<any> => {
  if (!isObject(value)) return false
  return scopeSymbol in value
}
