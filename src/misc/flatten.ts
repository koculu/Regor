import { isArray, isMap, isObject, isSet } from '../common/is-what'
import { type FlattenRef } from '../api/types'
import { unref } from '../reactivity/unref'

export const flatten = <TValueType>(
  reference: TValueType,
): FlattenRef<TValueType> => {
  return flattenContent(unref(reference)) as FlattenRef<TValueType>
}

const flattenContent = (value: any): any => {
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
    for (const el of map) {
      map.set(flatten(el[0]), flatten(el[1]))
    }
    return map
  }
  const result: any = { ...value }
  for (const entry of Object.entries(result)) {
    result[entry[0]] = flatten(entry[1])
  }
  return result
}
