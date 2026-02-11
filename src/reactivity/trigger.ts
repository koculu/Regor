import { type AnyRef, RefOperation, type SRefSignature } from '../api/types'
import { isArray, isMap, isObject, isSet } from '../common/is-what'
import { isRef } from './isRef'

export const trigger = <TValueType extends AnyRef>(
  source: TValueType,
  eventSource?: any,
  isRecursive?: boolean,
): void => {
  if (!isRef(source)) return
  const srefImpl = source as unknown as SRefSignature<TValueType>
  srefImpl(undefined, eventSource, RefOperation.trigger)
  if (!isRecursive) return
  const obj = srefImpl()
  if (!obj) return
  if (isArray(obj) || isSet(obj)) {
    for (const el of obj) {
      trigger(el, eventSource, true)
    }
  } else if (isMap(obj)) {
    for (const el of obj) {
      trigger(el[0], eventSource, true)
      trigger(el[1], eventSource, true)
    }
  }
  if (isObject(obj)) {
    for (const k in obj) {
      trigger(obj[k] as any, eventSource, true)
    }
  }
}
