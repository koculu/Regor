import {
  RefOperation,
  type AnyRef,
  type IsNull,
  type ObserveCallback,
  type SRef,
  type SRefContent,
  type UnwrapRef,
} from '../api/types'
import { defineRefValue } from '../common/common'
import { isArray, isMap, isObject, isSet } from '../common/is-what'
import { collectRef, silence } from '../computed/watchEffect'
import { isRaw } from '../misc/isRaw'
import { proxyArrayProto } from '../proxies/array-ref'
import { proxyMapProto } from '../proxies/map-ref'
import { proxySetProto } from '../proxies/set-ref'
import { isRef } from './isRef'
import { srefSymbol } from './refSymbols'

/**
 * @internal
 */
export const batchCollector: {
  set?: Set<AnyRef>
} = {}

/**
 * Converts the given value to sref object and returns the sref.
 * Regor provides two options to get or update the value of a sref.
 * Getting the sref value:
 * 1. refObj.value
 * 2. refObj()
 * Setting the sref value:
 * 1. refObj.value = newValue
 * 2. refObj(newValue)
 *
 * @param value any value
 * @returns ref
 */
export const sref = <TValueType>(
  value?:
    | TValueType
    | (TValueType extends SRef<infer V2> ? SRef<UnwrapRef<V2>> : never)
    | (TValueType extends Array<infer V1> ? V1[] : never)
    | null,
): IsNull<TValueType> extends true
  ? SRef<unknown>
  : SRef<SRefContent<TValueType>> => {
  if (isRef(value) || isRaw(value)) return value as any

  const refObj = {
    auto: true,
    _value: value as TValueType,
  }

  const createProxy = (value: any): boolean => {
    if (!isObject(value)) return false
    if (srefSymbol in value) return true
    const isAnArray = isArray(value)
    if (isAnArray) {
      Object.setPrototypeOf(value, proxyArrayProto)
      return true
    }

    const isASet = isSet(value)
    if (isASet) {
      Object.setPrototypeOf(value, proxySetProto)
      return true
    }

    const isAMap = isMap(value)
    if (isAMap) {
      Object.setPrototypeOf(value, proxyMapProto)
      return true
    }
    return false
  }
  const isProxy = createProxy(value)
  const observers = new Set<ObserveCallback<TValueType>>()
  const trigger = (newValue: TValueType, eventSource: any): void => {
    if (batchCollector.set) {
      batchCollector.set.add(srefFunction as unknown as AnyRef)
      return
    }
    if (observers.size === 0) return
    silence(() => {
      for (const callback of [...observers.keys()]) {
        if (!observers.has(callback)) continue
        callback(newValue, eventSource)
      }
    })
  }

  const attachProxyHandle = (value: any): void => {
    let proxyHandle = value[srefSymbol]
    if (!proxyHandle) value[srefSymbol] = proxyHandle = new Set<any>()
    proxyHandle.add(srefFunction)
  }
  const srefFunction = (
    ...args: [TValueType, any, RefOperation, ObserveCallback<TValueType>]
  ): TValueType => {
    if (!(2 in args)) {
      let newValue = args[0] as TValueType
      const eventSource = args[1]
      if (0 in args) {
        if (refObj._value === newValue) return newValue
        if (isRef(newValue)) {
          newValue = newValue()
          if (refObj._value === newValue) return newValue
        }

        if (createProxy(newValue)) attachProxyHandle(newValue)

        refObj._value = newValue
        if (refObj.auto) {
          trigger(newValue, eventSource)
        }
        return refObj._value
      } else {
        collectRef(srefFunction as unknown as AnyRef)
      }
      return refObj._value
    }

    const operation = args[2]

    switch (operation) {
      case RefOperation.observe: {
        const observer = args[3]
        if (!observer) return (() => {}) as TValueType
        const removeObserver = (
          observer: ObserveCallback<TValueType>,
        ): void => {
          observers.delete(observer)
        }
        observers.add(observer)
        return (() => {
          removeObserver(observer)
        }) as TValueType
      }
      case RefOperation.trigger: {
        const eventSource = args[1]
        const value = refObj._value
        trigger(value, eventSource)
        break
      }
      case RefOperation.observerCount: {
        return observers.size as TValueType
      }
      case RefOperation.pause: {
        refObj.auto = false
        break
      }
      case RefOperation.resume: {
        refObj.auto = true
      }
    }
    return refObj._value
  }
  ;(srefFunction as any)[srefSymbol] = 1

  defineRefValue(srefFunction as any, false)

  if (isProxy) attachProxyHandle(value)
  return srefFunction as any
}
