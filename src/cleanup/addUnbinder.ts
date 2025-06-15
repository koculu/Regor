import { type Unbinder } from '../api/types'
import { getBindData } from './getBindData'

/**
 * Associates an unbinder function with a DOM node. The unbinder is later
 * executed during cleanup to remove bindings and listeners added by Regor.
 *
 * @param node - DOM node to attach the unbinder to.
 * @param unbinder - Function invoked to clean up the node when unbinding.
 */
export const addUnbinder = (node: Node, unbinder: Unbinder): void => {
  getBindData(node).unbinders.push(unbinder)
}
