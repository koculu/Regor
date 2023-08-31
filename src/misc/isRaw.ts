import { rawSymbol } from '../reactivity/refSymbols'

export const isRaw = (value: any): boolean => {
  return !!value && value[rawSymbol] === 1
}
