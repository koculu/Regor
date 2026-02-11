import type { MountListItem,SRef } from '../api/types'

/**
 * @internal
 */
export class MountList {
  __list: MountListItem[] = []

  /** The value map requires unique values, but it is not always the case.
   * Despite that, the valueMap contributes to the performance of rendering
   * when the values are not duplicated.
   * Hence, will keep the valueMap for optimized lookups if possible
   */
  __valueMap = new Map<unknown, MountListItem>()

  get __length(): number {
    return this.__list.length
  }

  __getKey: (v: unknown) => unknown
  constructor(getKey: (v: unknown) => unknown) {
    this.__getKey = getKey
  }

  __setValueMap(item: MountListItem): void {
    const value = this.__getKey(item.value)
    if (value !== undefined) this.__valueMap.set(value, item)
  }

  __deleteValueMap(index: number): void {
    const value = this.__getKey(this.__list[index]?.value)
    if (value !== undefined) this.__valueMap.delete(value)
  }

  /**
   * @internal
   */
  static __createItem(index: SRef<number>, value: unknown): MountListItem {
    return {
      items: [],
      index,
      value,
      order: -1,
    }
  }

  __push(item: MountListItem): void {
    item.order = this.__length
    this.__list.push(item)
    this.__setValueMap(item)
  }

  __insertAt(index: number, item: MountListItem): void {
    const len = this.__length
    for (let i = index; i < len; ++i) this.__list[i].order = i + 1
    item.order = index
    this.__list.splice(index, 0, item)
    this.__setValueMap(item)
  }

  __get(index: number): MountListItem {
    return this.__list[index]
  }

  __replace(index: number, item: MountListItem): void {
    this.__deleteValueMap(index)
    this.__list[index] = item
    this.__setValueMap(item)
    item.order = index
  }

  __removeAt(index: number): void {
    this.__deleteValueMap(index)
    this.__list.splice(index, 1)
    const len = this.__length
    for (let i = index; i < len; ++i) this.__list[i].order = i
  }

  __removeAllAfter(index: number): void {
    const len = this.__length
    for (let i = index; i < len; ++i) this.__deleteValueMap(i)
    this.__list.splice(index)
  }

  __isValueMounted(value: unknown): boolean {
    return this.__valueMap.has(value)
  }

  __lookupValueOrderIfMounted(value: unknown): number {
    const item = this.__valueMap.get(value)
    return item?.order ?? -1
  }
}
