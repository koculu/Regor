import { type Unbinder } from '../api/types'
import { getBindData } from './getBindData'

export const addUnbinder = (node: Node, unbinder: Unbinder): void => {
  getBindData(node).unbinders.push(unbinder)
}
