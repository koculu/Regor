import { isArray, isFunction, isNullOrUndefined } from '../common/is-what'
import { type SRef, type StopObserving, type MountListItem } from '../api/types'
import { addUnbinder } from '../cleanup/addUnbinder'
import { removeNode } from '../cleanup/removeNode'
import { warning, WarningType } from '../log/warnings'
import { observe } from '../observer/observe'
import { sref } from '../reactivity/sref'
import { unref } from '../reactivity/unref'
import { type Binder } from './Binder'
import {
  bindChildNodes,
  findElements,
  getNodes,
  toSelector,
  unmount,
} from '../common/common'
import { MountList } from './MountList'
import { setSwitchOwner } from './switch'

const forMarker = Symbol('r-for')

/**
 * @internal
 */
export class ForBinder {
  __binder: Binder

  __for: string
  __forSelector: string
  __pre: string

  constructor(binder: Binder) {
    this.__binder = binder
    this.__for = binder.__config.__builtInNames.for
    this.__forSelector = toSelector(this.__for)
    this.__pre = binder.__config.__builtInNames.pre
  }

  __bindAll(element: Element): boolean {
    const isForElement = element.hasAttribute(this.__for)
    const elements = findElements(element, this.__forSelector)
    for (const el of elements) {
      this.__bindFor(el)
    }
    return isForElement
  }

  __isProcessedOrMark(el: any): boolean {
    // avoid unnecessary for binding for nested for's
    if (el[forMarker]) return true
    el[forMarker] = true
    findElements(el, this.__forSelector).forEach(
      (x: any) => (x[forMarker] = true),
    )
    return false
  }

  __bindFor(el: HTMLElement): void {
    if (el.hasAttribute(this.__pre) || this.__isProcessedOrMark(el)) return
    const forPath = el.getAttribute(this.__for)
    if (!forPath) {
      warning(WarningType.MissingBindingExpression, this.__for, el)
      return
    }
    el.removeAttribute(this.__for)
    this.__bindForToPath(el, forPath)
  }

  __getIterable<T extends object>(
    obj: T,
  ): T | Iterable<number> | Iterable<[keyof T, T[keyof T]]> {
    if (isNullOrUndefined(obj)) return []
    if (isFunction(obj)) obj = obj()
    if (Symbol.iterator in Object(obj)) {
      return obj
    }
    if (typeof obj === 'number') {
      const getRange = (n: number): Iterable<number> => {
        return {
          *[Symbol.iterator]() {
            for (let i = 1; i <= n; i++) {
              yield i
            }
          },
        }
      }
      return getRange(obj as number)
    }
    return Object.entries(obj) as Iterable<[keyof T, T[keyof T]]>
  }

  __bindForToPath(el: HTMLElement, forPath: string): void {
    const config = this.__parseForPath(forPath)
    if (!config?.list) {
      warning(WarningType.InvalidForExpression, this.__for, forPath, el)
      return
    }
    // TODO: key binding requires expression evaluation on each step.
    // For now, :key="id" is supported but :key="item.id" is not.
    const nameKey = this.__binder.__config.__builtInNames.key
    const nameKeyBind = this.__binder.__config.__builtInNames.keyBind
    const key = el.getAttribute(nameKey) ?? el.getAttribute(nameKeyBind)
    el.removeAttribute(nameKey)
    el.removeAttribute(nameKeyBind)
    const getKey = key ? (v: any) => unref(unref(v)?.[key]) : (v: any) => v
    const areEqual = (a: any, b: any): boolean => getKey(a) === getKey(b)

    const nodes = getNodes(el)
    const parent = el.parentNode as HTMLElement
    if (!parent) return
    const title = `${this.__for} => ${forPath}`
    const commentBegin = new Comment(`__begin__ ${title}`)
    parent.insertBefore(commentBegin, el)
    setSwitchOwner(commentBegin, nodes)
    nodes.forEach((x) => {
      removeNode(x)
    })
    el.remove() // template node removal
    const commentEnd = new Comment(`__end__ ${title}`)
    parent.insertBefore(commentEnd, commentBegin.nextSibling)

    const binder = this.__binder
    const parser = binder.__parser
    const capturedContext = parser.__capture()
    const mountNewValue = (
      i: number,
      newValue: any,
      nextSibling: Node,
    ): MountListItem => {
      const result = config.createContext(newValue, i)
      const mountItem = MountList.__createItem(result.index, newValue)
      parser.__scoped(capturedContext, () => {
        parser.__push(result.ctx)
        let start = nextSibling.previousSibling as ChildNode
        const childNodes: ChildNode[] = []
        for (const x of nodes) {
          const node = x.cloneNode(true)
          parent.insertBefore(node, nextSibling)
          childNodes.push(node as ChildNode)
        }
        bindChildNodes(binder, childNodes)
        start = start.nextSibling as ChildNode
        while (start !== nextSibling) {
          mountItem.items.push(start)
          start = start.nextSibling as ChildNode
        }
      })
      return mountItem
    }

    const replace = (i: number, newValue: any): void => {
      const oldMountItems = mountList.__get(i).items
      const nextSibling = oldMountItems[oldMountItems.length - 1]
        .nextSibling as Element
      for (const existingNode of oldMountItems) {
        removeNode(existingNode)
      }
      mountList.__replace(i, mountNewValue(i, newValue, nextSibling))
    }

    const push = (i: number, newValue: any): void => {
      mountList.__push(mountNewValue(i, newValue, commentEnd))
    }

    const remove = (i: number): void => {
      for (const existingNode of mountList.__get(i).items) {
        removeNode(existingNode)
      }
    }

    const updateIndexes = (s: number): void => {
      const len = mountList.__length
      for (let k = s; k < len; ++k) {
        mountList.__get(k).index(k)
      }
    }

    const updateDom = (newValues: any): void => {
      let len = mountList.__length
      if (isFunction(newValues)) newValues = newValues()
      const unrefedNewValue = unref(newValues[0])
      if (isArray(unrefedNewValue) && unrefedNewValue.length === 0) {
        unmount(commentBegin, commentEnd)
        mountList.__removeAllAfter(0)
        return
      }
      let i = 0
      let firstRemovalOrInsertionIndex = Number.MAX_SAFE_INTEGER
      // shouldGrowList defines maximum number of inserts
      // when the incoming value doesn't match the current mounted item in the iteration
      const initialLength = len
      const forGrowThreshold = this.__binder.__config.forGrowThreshold
      const shouldGrowList = (): boolean =>
        mountList.__length < initialLength + forGrowThreshold
      for (const newValue of this.__getIterable(newValues[0])) {
        const modify = (): void => {
          if (i < len) {
            const mountItem = mountList.__get(i++)
            if (areEqual(mountItem.value, newValue)) return
            const newValueMountPosition = mountList.__lookupValueOrderIfMounted(
              getKey(newValue),
            )
            // TODO: develop a better r-for patch algorithm.
            // Using the LCS algorithm would make it possible to create a minimum amount of DOM changes.
            // However, LCS diff & patch itself is costly, with a complexity of O(n*m).
            // Hence, LCS is not being used.
            // The following simple aproach aims to be fast for the most common scenarios:
            // - Removing the mismatching mounted DOM element if the new value is already mounted
            // - Insert the new DOM element if the length of mounted items count is not more than some threshold (forGrowThreshold)
            // - Replace DOM element otherwise.
            if (newValueMountPosition >= i && newValueMountPosition - i < 10) {
              // the new value is not mounted before,
              // it is time to remove the mounted value.
              // also it is fine to batch remove mounted values until the position returned
              --i
              firstRemovalOrInsertionIndex = Math.min(
                firstRemovalOrInsertionIndex,
                i,
              )
              remove(i)
              mountList.__removeAt(i)
              --len

              if (newValueMountPosition > i + 1) {
                for (let j = i; j < newValueMountPosition - 1 && j < len; ) {
                  if (areEqual(mountList.__get(i).value, newValue)) break
                  ++j
                  remove(i)
                  mountList.__removeAt(i)
                  --len
                }
              }
              modify()
              return
            }
            if (shouldGrowList()) {
              mountList.__insertAt(
                i - 1,
                mountNewValue(i, newValue, mountList.__get(i - 1).items[0]),
              )
              firstRemovalOrInsertionIndex = Math.min(
                firstRemovalOrInsertionIndex,
                i - 1,
              )
              ++len
            } else {
              replace(i - 1, newValue)
            }
          } else {
            push(i++, newValue)
          }
        }
        modify()
      }
      const j = i
      len = mountList.__length
      while (i < len) remove(i++)
      mountList.__removeAllAfter(j)
      updateIndexes(firstRemovalOrInsertionIndex)
    }

    const observeTailChanges = (): void => {
      stopObserving = observe(value, updateDom)
    }

    const unbinder = (): void => {
      parseResult.stop()
      stopObserving()
    }

    const parseResult = parser.__parse(config.list)
    const value = parseResult.value

    let stopObserving: StopObserving

    let i = 0
    const mountList = new MountList(getKey)
    for (const item of this.__getIterable(value()[0] as any)) {
      mountList.__push(mountNewValue(i++, item, commentEnd))
    }
    addUnbinder(commentBegin, unbinder)
    observeTailChanges()
  }

  static __forPathRegex =
    /\{?\[?\(?([^)}\]]+)\)?\]?\}?([^)]+)?\s+\b(?:in|of)\b\s+([^\s]+)\s*/

  __parseForPath(forPath: string):
    | {
        list: string
        createContext: (
          value: any,
          i: number,
        ) => {
          ctx: any
          index: SRef<number>
        }
      }
    | undefined {
    const matches = ForBinder.__forPathRegex.exec(forPath)
    if (!matches) return
    const keys = (matches[1] + (matches[2] ?? ''))
      .split(',')
      .map((key) => key.trim())
    const indexOfIndex = keys.length > 1 ? keys.length - 1 : -1
    const index =
      indexOfIndex !== -1 && keys[indexOfIndex]?.startsWith('#')
        ? keys[indexOfIndex]
        : ''
    if (index) keys.splice(indexOfIndex, 1)

    const list = matches[3]
    if (!list || keys.length === 0) return
    const hasDestructuring = /[{[]/.test(forPath)
    return {
      list,
      createContext: (value: any, i: number) => {
        const ctx: any = {}
        const unrefValue = unref(value)
        if (!hasDestructuring && keys.length === 1) {
          ctx[keys[0]] = value
        } else if (isArray(unrefValue)) {
          let j = 0
          for (const k of keys) {
            ctx[k] = unrefValue[j++]
          }
        } else {
          for (const k of keys) {
            ctx[k] = unrefValue[k]
          }
        }
        const result = { ctx, index: sref(-1) }
        if (index) {
          result.index = ctx[index.substring(1)] = sref(i)
        }
        return result
      },
    }
  }
}
