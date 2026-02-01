import { type UnwrapRef } from '../api/types'
import { isRef } from './isRef'

/**
 * Returns the underlying value of a ref. If the value is not a ref it is
 * returned as-is.
 *
 * @param value - Value or ref to unwrap.
 */
export const unref = <TValueType>(value: TValueType): UnwrapRef<TValueType> => {
  return (isRef(value) ? value() : value) as UnwrapRef<TValueType>
}
