import { type UnwrapRef } from '../api/types'
import { srefSymbol } from './refSymbols'

export const unref = <TValueType>(value: TValueType): UnwrapRef<TValueType> => {
  const anyValue = value as any
  return (
    anyValue != null && anyValue[srefSymbol] === 1 ? anyValue() : anyValue
  ) as UnwrapRef<TValueType>
}
