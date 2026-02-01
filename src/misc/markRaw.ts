import { type RawMarker } from '../api/types'
import { rawSymbol } from '../reactivity/refSymbols'

/**
 * Utility type that marks a value so that it won't be converted into a deep
 * ref when passed to {@link ref}.
 */
export type Raw<TValueType> = TValueType & RawMarker

/**
 * Tags an object as raw, preventing {@link ref} from making its properties
 * reactive.
 *
 * @param value - Object that should remain non-reactive.
 * @returns The same object with the raw marker attached.
 */
export const markRaw = <TValueType extends object>(
  value: TValueType,
): Raw<TValueType> => {
  ;(value as any)[rawSymbol] = 1
  return value as Raw<TValueType>
}
