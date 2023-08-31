import { addUnbinder } from '../cleanup/addUnbinder'
import { isElement } from '../common/common'

const switches: Record<string, any[]> = {}
const switchCounter: Record<string, number> = {}

let nextSwitchId = 1

/**
 * @internal
 */
export const addSwitch = (context: any[]): string => {
  const id = (nextSwitchId++).toString()
  switches[id] = context
  switchCounter[id] = 0
  return id
}

/**
 * @internal
 */
export const refSwitch = (id: string): void => {
  switchCounter[id] += 1
}

/**
 * @internal
 */
export const removeSwitch = (id: string): void => {
  if (--switchCounter[id] === 0) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete switches[id]
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete switchCounter[id]
  }
}

/**
 * @internal
 */
export const getSwitch = (id: string): any[] => switches[id]

/**
 * @internal
 */
export const hasSwitch = (): boolean =>
  nextSwitchId !== 1 && Object.keys(switches).length > 0

/**
 * @internal
 * Used for component slot template context switch.
 */
export const rswitch = 'r-switch'

const getSwitches = (nodes: ChildNode[]): string[] => {
  const switches = nodes
    .filter((x) => isElement(x))
    .map((x) =>
      [...(x as Element).querySelectorAll('[r-switch]')].map((x) =>
        x.getAttribute(rswitch),
      ),
    )
  const set = new Set<string>()
  switches.forEach((x) => {
    x.forEach((y) => y && set.add(y))
  })
  return [...set]
}

/**
 * @internal
 */
export const setSwitchOwner = (owner: Node, switchNodes: ChildNode[]): void => {
  if (!hasSwitch()) return
  const switches = getSwitches(switchNodes)
  if (switches.length === 0) return
  switches.forEach(refSwitch)
  addUnbinder(owner, () => {
    switches.forEach(removeSwitch)
  })
}
