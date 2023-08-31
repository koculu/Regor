import { type AnyRef } from '../api/types'
import { srefSymbol } from './refSymbols'

export const isRef = (value: unknown): value is AnyRef => {
  return (value as any)?.[srefSymbol] === 1
}
