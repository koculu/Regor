import {
  type ComposableScope,
  type IRegorContext,
  type OnMounted,
  type OnUnmounted,
} from '../api/types'
import { ErrorType, getError } from '../log/errors'

const scopes = [] as ComposableScope[]

/**
 * @internal
 */
export const pushScope = (): ComposableScope => {
  const cs: ComposableScope = {
    onMounted: [] as OnMounted[],
    onUnmounted: [] as OnUnmounted[],
  }
  scopes.push(cs)
  return cs
}

/**
 * @internal
 */
export const peekScope = (noThrow?: boolean): ComposableScope | undefined => {
  const scope = scopes[scopes.length - 1]
  if (!scope && !noThrow) throw getError(ErrorType.ComposablesRequireScope)
  return scope
}

/**
 * @internal
 */
export const popScope = (context?: IRegorContext): ComposableScope => {
  const cs = peekScope() as ComposableScope
  context && setScope(context)
  scopes.pop()
  return cs
}

const scopeSymbol = Symbol('csp')
/**
 * @internal
 */
export const setScope = (context: IRegorContext): void => {
  const data = context as any
  const existing = data[scopeSymbol] as ComposableScope
  if (existing) {
    const cs = peekScope() as ComposableScope
    if (existing === cs) return
    cs.onMounted.length > 0 && existing.onMounted.push(...cs.onMounted)
    cs.onUnmounted.length > 0 && existing.onUnmounted.push(...cs.onUnmounted)
    return
  }
  data[scopeSymbol] = peekScope()
}

/**
 * @internal
 */
export const getScope = (context: IRegorContext): ComposableScope => {
  const data = context as { [scopeSymbol]: ComposableScope }
  return data[scopeSymbol] as ComposableScope
}
