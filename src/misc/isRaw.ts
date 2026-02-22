import { rawSymbol } from '../reactivity/refSymbols'

export const isRaw = (value: unknown): boolean => {
  return !!value && (value as Record<symbol, unknown>)[rawSymbol] === 1
}
