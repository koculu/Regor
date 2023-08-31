import { type BindData } from '../api/types'
import { bindDataSymbol } from './bindDataSymbol'

export const getBindData = (node: any): BindData => {
  const bindData = node[bindDataSymbol]
  if (bindData) return bindData as BindData
  const newBindData: BindData = {
    unbinders: [],
    data: {},
  }
  node[bindDataSymbol] = newBindData
  return newBindData
}
