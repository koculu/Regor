import { rawSymbol } from '../reactivity/refSymbols'

/**
 * Checks whether the provided value was marked as {@link markRaw}. Raw values
 * are excluded from deep reactivity conversion.
 */
export const isRaw = (value: any): boolean => {
  return !!value && value[rawSymbol] === 1
}
