import { isArray, isMap, isObject, isSet } from '../common/is-what'
import type { Ref, SRef, ComputedRef, Flat } from '../api/types'
import { unref } from '../reactivity/unref'

export const flatten = <TValueType>(
  reference:
    | TValueType
    | Ref<TValueType>
    | SRef<TValueType>
    | ComputedRef<TValueType>,
): Flat<TValueType> => {
  return flattenContent(unref(reference))
}

const flattenContent = (
  value: any,
  weakMap: WeakMap<any, any> = new WeakMap<any, any>(),
): any => {
  if (!value) return value
  if (!isObject(value)) return value

  if (isArray(value)) {
    return value.map(flatten)
  }
  if (isSet(value)) {
    const set = new Set<unknown>()
    for (const key of value.keys()) {
      set.add(flatten(key))
    }
    return set
  }
  if (isMap(value)) {
    const map = new Map<unknown, unknown>()
    for (const el of value) {
      map.set(flatten(el[0]), flatten(el[1]))
    }
    return map
  }
  if (weakMap.has(value)) return unref(weakMap.get(value))
  const result: any = { ...value }
  weakMap.set(value, result)
  for (const entry of Object.entries(result)) {
    result[entry[0]] = flattenContent(unref(entry[1]), weakMap)
  }
  return result
}
