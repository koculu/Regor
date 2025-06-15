import { type AnyRef } from '../api/types'
import { refSymbol } from './refSymbols'

/**
 * Determines whether the given value is a deep ref created via {@link ref}.
 */
export const isDeepRef = (value: unknown): value is AnyRef => {
  return (value as any)?.[refSymbol] === 1
}
