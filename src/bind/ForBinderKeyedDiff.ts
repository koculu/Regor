import { type MountListItem } from '../api/types'

/**
 * Keyed r-for patcher used by ForBinder.
 *
 * What it does:
 * - Runs a keyed diff between old mounted items and next iterable values.
 * - Uses head/tail sync for cheap prefix/suffix matches.
 * - Builds key `->` newIndex map for middle section lookup.
 * - Builds newIndexToOldIndex map and applies LIS to minimize DOM moves.
 * - Reuses/moves existing mounted blocks when safe.
 * - Mounts only truly new items and removes only missing items.
 *
 * Safety expectations:
 * - Keys must be defined and unique for full keyed mode.
 * - If keys are unusable (undefined / duplicates), returns `undefined` so
 *   caller can fallback to legacy non-keyed behavior.
 * - Reuse requires both key match and value identity match; same key with
 *   different value identity is remounted to keep bindings/reactivity correct.
 */
type PatchOptions = {
  oldItems: MountListItem[]
  newValues: unknown[]
  getKey: (value: unknown) => unknown
  isSameValue: (a: unknown, b: unknown) => boolean
  mountNewValue: (
    index: number,
    value: unknown,
    nextSibling: Node,
  ) => MountListItem
  removeMountItem: (item: MountListItem) => void
  endAnchor: Node
}

const moveMountItemBefore = (item: MountListItem, anchor: Node): void => {
  const parent = anchor.parentNode as Node | null
  if (!parent) return
  for (let i = 0; i < item.items.length; ++i) {
    parent.insertBefore(item.items[i], anchor)
  }
}

const getSequence = (arr: number[]): number[] => {
  const len = arr.length
  const p = arr.slice()
  const result: number[] = []
  let u: number
  let v: number
  let c: number

  for (let i = 0; i < len; ++i) {
    const value = arr[i]
    if (value === 0) continue
    const j = result[result.length - 1]
    if (j === undefined || arr[j] < value) {
      p[i] = j ?? -1
      result.push(i)
      continue
    }
    u = 0
    v = result.length - 1
    while (u < v) {
      c = (u + v) >> 1
      if (arr[result[c]] < value) u = c + 1
      else v = c
    }
    if (value < arr[result[u]]) {
      if (u > 0) p[i] = result[u - 1]
      result[u] = i
    }
  }

  u = result.length
  v = result[u - 1] ?? -1
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}

/**
 * @internal
 */
export class ForBinderKeyedDiff {
  /**
   * Applies keyed patch and returns the next ordered mount list.
   * Returns `undefined` when keyed mode is not safe for this update.
   */
  static __patch(options: PatchOptions): MountListItem[] | undefined {
    const {
      oldItems,
      newValues,
      getKey,
      isSameValue,
      mountNewValue,
      removeMountItem,
      endAnchor,
    } = options
    const oldLen = oldItems.length
    const newLen = newValues.length

    const newKeys = new Array<unknown>(newLen)
    const keySeen = new Set<unknown>()
    for (let i = 0; i < newLen; ++i) {
      const key = getKey(newValues[i])
      if (key === undefined || keySeen.has(key)) return undefined
      keySeen.add(key)
      newKeys[i] = key
    }

    const newMountItems = new Array<MountListItem>(newLen)
    let i = 0
    let e1 = oldLen - 1
    let e2 = newLen - 1

    while (i <= e1 && i <= e2) {
      const oldItem = oldItems[i]
      if (getKey(oldItem.value) !== newKeys[i]) break
      if (!isSameValue(oldItem.value, newValues[i])) break
      oldItem.value = newValues[i]
      newMountItems[i] = oldItem
      ++i
    }

    while (i <= e1 && i <= e2) {
      const oldItem = oldItems[e1]
      if (getKey(oldItem.value) !== newKeys[e2]) break
      if (!isSameValue(oldItem.value, newValues[e2])) break
      oldItem.value = newValues[e2]
      newMountItems[e2] = oldItem
      --e1
      --e2
    }

    if (i > e1) {
      for (let k = e2; k >= i; --k) {
        const anchor =
          k + 1 < newLen ? newMountItems[k + 1].items[0] : endAnchor
        newMountItems[k] = mountNewValue(k, newValues[k], anchor)
      }
      return newMountItems
    }

    if (i > e2) {
      for (let k = i; k <= e1; ++k) removeMountItem(oldItems[k])
      return newMountItems
    }

    const s1 = i
    const s2 = i
    const toBePatched = e2 - s2 + 1
    const newIndexToOldIndexMap = new Array<number>(toBePatched).fill(0)
    const keyToNewIndexMap = new Map<unknown, number>()
    for (let k = s2; k <= e2; ++k) {
      keyToNewIndexMap.set(newKeys[k], k)
    }

    let moved = false
    let maxNewIndexSoFar = 0
    for (let k = s1; k <= e1; ++k) {
      const oldItem = oldItems[k]
      const newIndex = keyToNewIndexMap.get(getKey(oldItem.value))
      if (newIndex === undefined) {
        removeMountItem(oldItem)
        continue
      }
      if (!isSameValue(oldItem.value, newValues[newIndex])) {
        removeMountItem(oldItem)
        continue
      }
      oldItem.value = newValues[newIndex]
      newMountItems[newIndex] = oldItem
      newIndexToOldIndexMap[newIndex - s2] = k + 1
      if (newIndex >= maxNewIndexSoFar) maxNewIndexSoFar = newIndex
      else moved = true
    }

    const increasingNewIndexSequence = moved
      ? getSequence(newIndexToOldIndexMap)
      : []
    let seqIdx = increasingNewIndexSequence.length - 1

    for (let k = toBePatched - 1; k >= 0; --k) {
      const newIndex = s2 + k
      const anchor =
        newIndex + 1 < newLen ? newMountItems[newIndex + 1].items[0] : endAnchor
      if (newIndexToOldIndexMap[k] === 0) {
        newMountItems[newIndex] = mountNewValue(
          newIndex,
          newValues[newIndex],
          anchor,
        )
        continue
      }
      const item = newMountItems[newIndex]
      if (!moved) continue
      if (seqIdx >= 0 && increasingNewIndexSequence[seqIdx] === k) {
        --seqIdx
      } else if (item) {
        moveMountItemBefore(item, anchor)
      }
    }

    return newMountItems
  }
}
