import { type BindData } from '../api/types'
import { bindDataSymbol } from './bindDataSymbol'

/**
 * Retrieves the `BindData` object attached to a node or creates one if it does
 * not exist. `BindData` contains the list of unbinders and arbitrary data used
 * during Regor's cleanup phase.
 *
 * @param node - DOM node associated with Regor bindings.
 * @returns The existing or newly created `BindData` instance.
 */
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
