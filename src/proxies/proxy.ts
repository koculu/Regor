import { srefSymbol } from '../reactivity/refSymbols'
import { trigger } from '../reactivity/trigger'

function define(obj: unknown, key: string, val: any): void {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: false,
    writable: true,
    configurable: true,
  })
}

/**
 * @internal
 */
export const createProxy = (
  originalProto: any,
  proxyProto: any,
  methodsToPatch: string[],
): void => {
  methodsToPatch.forEach(function (method: any) {
    const original = originalProto[method]
    define(proxyProto, method, function mutator(...args: unknown[]) {
      // @ts-expect-error: implicit any type for this
      const result = original.apply(this, args)
      // @ts-expect-error: implicit any type for this
      const subscribers = this[srefSymbol]
      for (const subscriber of subscribers) trigger(subscriber)
      return result
    })
  })
}

/**
 * @internal
 */
export const setToStringTag = (proxyProto: any, tag: string): void => {
  Object.defineProperty(proxyProto, Symbol.toStringTag, {
    value: tag,
    writable: false,
    enumerable: false,
    configurable: true,
  })
}
