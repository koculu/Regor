import { type RawMarker } from '../api/types'
import { rawSymbol } from '../reactivity/refSymbols'

export type Raw<TValueType> = TValueType & RawMarker

export const markRaw = <TValueType extends object>(
  value: TValueType,
): Raw<TValueType> => {
  ;(value as any)[rawSymbol] = 1
  return value as Raw<TValueType>
}
