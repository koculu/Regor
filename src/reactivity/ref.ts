import { isArray, isObject, isSymbol } from '../common/is-what'
import { isRaw } from '../misc/isRaw'
import { isRef } from './isRef'
import { sref } from './sref'

import type {
  Ref,
  IsNull,
  RefContent,
  RefParam,
  SRef,
  UnwrapRef,
} from '../api/types'
import { refSymbol } from './refSymbols'
import { isDeepRef } from './isDeepRef'

/**
 * Converts the given value and it's all properties to ref objects and returns the ref.
 * The returned object's type reflects it's nested properties as well.
 * Regor provides two options to get or update the value of a ref.
 * Getting the ref value:
 * 1. refObj.value
 * 2. refObj()
 * Setting the ref value:
 * 1. refObj.value = newValue
 * 2. refObj(newValue)
 *
 * @param value any value
 * @returns ref
 */
export const ref = <TValueType>(
  value?:
    | TValueType
    | RefContent<TValueType>
    | (TValueType extends Ref<infer V1> ? Ref<RefParam<V1>> : never)
    | (TValueType extends SRef<infer V2> ? SRef<UnwrapRef<V2>> : never)
    | RefParam<TValueType>
    | (TValueType extends Array<infer V1> ? V1[] : never)
    | null,
): IsNull<TValueType> extends true
  ? Ref<unknown>
  : Ref<RefParam<TValueType>> => {
  if (isRaw(value)) return value as any
  let result: any
  if (isRef(value)) {
    result = value as any
    value = result() as TValueType
  } else {
    result = sref<any>(value) as any
  }

  if (
    value instanceof Node ||
    value instanceof Date ||
    value instanceof RegExp ||
    value instanceof Promise ||
    value instanceof Error
  )
    return result

  result[refSymbol] = 1
  if (isArray(value)) {
    const len = value.length
    for (let i = 0; i < len; ++i) {
      const item = value[i]
      if (isDeepRef(item)) continue
      value[i] = ref(item)
    }
    return result
  }

  if (!isObject(value)) return result
  for (const item of Object.entries(value)) {
    const val = item[1]
    if (isDeepRef(val)) continue
    const key = item[0]
    if (isSymbol(key)) continue
    ;(value as any)[key] = ref(val)
  }
  return result
}
