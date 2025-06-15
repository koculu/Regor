import { isArray, isMap, isObject, isSet } from '../common/is-what'
import { type AnyRef, RefOperation, type SRefSignature } from '../api/types'
import { isRef } from './isRef'

/**
 * Manually triggers observers of a ref. When `isRecursive` is true, nested refs
 * contained within objects, arrays, sets or maps are also triggered.
 *
 * @param source - Ref to trigger.
 * @param eventSource - Optional value forwarded to observers.
 * @param isRecursive - Trigger nested refs when set to `true`.
 */
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
      trigger(obj[k], eventSource, true)
    }
  }
}
