import { type BindData } from '../api/types'
import { bindDataSymbol } from './bindDataSymbol'

type BindableNode = { [bindDataSymbol]?: BindData }

export const getBindData = (node: object): BindData => {
  const bindableNode = node as BindableNode
  const bindData = bindableNode[bindDataSymbol]
  if (bindData) return bindData as BindData
  const newBindData: BindData = {
    unbinders: [],
    data: {},
  }
  bindableNode[bindDataSymbol] = newBindData
  return newBindData
}
