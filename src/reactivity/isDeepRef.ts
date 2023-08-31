import { type AnyRef } from '../api/types'
import { refSymbol } from './refSymbols'

export const isDeepRef = (value: unknown): value is AnyRef => {
  return (value as any)?.[refSymbol] === 1
}
