import { type AnyRef } from '../api/types'
import { srefSymbol } from './refSymbols'

/**
 * Checks whether the supplied value is any kind of ref (`ref`, `sref` or
 * `computed`).
 */
export const isRef = (value: unknown): value is AnyRef => {
  return (value as any)?.[srefSymbol] === 1
}
