import { type UnwrapRef } from '../api/types'
import { isRef } from './isRef'

export const unref = <TValueType>(value: TValueType): UnwrapRef<TValueType> => {
  return (isRef(value) ? value() : value) as UnwrapRef<TValueType>
}
