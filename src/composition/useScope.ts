import { type Scope, type IRegorContext } from '../api/types'
import { isObject } from '../common/is-what'
import { callUnmounted } from './callUnmounted'
import { popScope, pushScope, setScope } from './stack'

const scopeSymbol = Symbol('scope')

/**
 * Creates a new scope and executes the given context factory within it. The
 * returned object can later be used to unmount the scope and trigger
 * `onUnmounted` callbacks.
 *
 * @param context - Factory that produces the scope's Regor context.
 */
export const useScope = <TRegorContext extends IRegorContext>(
  context: () => TRegorContext,
): Scope<TRegorContext> => {
  try {
    pushScope()
    const ctx = context()
    setScope(ctx)
    const result = {
      context: ctx,
      unmount: () => callUnmounted(ctx),
      [scopeSymbol]: 1,
    } as unknown as Scope<TRegorContext>
    ;(result as any)[scopeSymbol] = 1
    return result
  } finally {
    popScope()
  }
}

/**
 * Determines whether a given value is a scope created by {@link useScope}.
 *
 * @param value - Value to test.
 */
export const isScope = (value: unknown): value is Scope<any> => {
  if (!isObject(value)) return false
  return scopeSymbol in value
}
