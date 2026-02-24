import { type MountListItem, type SRef, type StopObserving } from '../api/types'
import { addUnbinder } from '../cleanup/addUnbinder'
import { removeNode } from '../cleanup/removeNode'
import {
  bindChildNodes,
  findElements,
  getNodes,
  toSelector,
  unmount,
} from '../common/common'
import { isArray, isFunction, isNullOrUndefined } from '../common/is-what'
import { warning, WarningType } from '../log/warnings'
import { sref } from '../reactivity/sref'
import { unref } from '../reactivity/unref'
import { type Binder } from './Binder'
import { MountList } from './MountList'
import { setSwitchOwner } from './switch'

const forMarker = Symbol('r-for')
const noIndexRef = ((_: number) => -1) as SRef<number>

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
    const nameKey = this.__binder.__config.__builtInNames.key
    const nameKeyBind = this.__binder.__config.__builtInNames.keyBind
    /**
     * r-for key handling is path-based for speed.
     *
     * - `key` and `:key` are treated identically here.
     * - The value is NOT evaluated as a full directive expression.
     * - Supported key forms:
     *   - `id` (single property on current item)
     *   - dotted property paths (any depth), e.g. `row.id`, `row.meta.id`, `a.b.c.d`
     * - For alias-like dotted keys (`row.id`), a fallback strips the first segment
     *   when needed so keys still resolve against the current item shape.
     * - Not supported as key syntax:
     *   - arbitrary JS expressions (e.g. `row.id + '-' + row.type`)
     *   - function calls / computed expressions
     */
    const keyExpression =
      el.getAttribute(nameKey) ?? el.getAttribute(nameKeyBind)
    el.removeAttribute(nameKey)
    el.removeAttribute(nameKeyBind)

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
    const singleCapturedContext = capturedContext.length === 1
    const rowContexts = singleCapturedContext
      ? [undefined as any, capturedContext[0]]
      : undefined
    const getKey = this.__createKeyGetter(keyExpression)
    const areEqual = (a: any, b: any): boolean => getKey(a) === getKey(b)
    const mountNewValue = (
      i: number,
      newValue: any,
      nextSibling: Node,
    ): MountListItem => {
      const result = config.createContext(newValue, i)
      const mountItem = MountList.__createItem(result.index, newValue)
      const renderInContext = (): void => {
        const insertParent =
          ((commentEnd.parentNode ??
            commentBegin.parentNode) as HTMLElement | null) ?? parent
        let start = nextSibling.previousSibling as ChildNode
        const childNodes: ChildNode[] = []
        // Perf improvement note: Do not try to create fragment to insert all nodes at once. It is not faster!
        for (let j = 0; j < nodes.length; ++j) {
          const node = nodes[j].cloneNode(true) as ChildNode
          insertParent.insertBefore(node, nextSibling)
          childNodes.push(node)
        }
        bindChildNodes(binder, childNodes)
        start = start.nextSibling as ChildNode
        while (start !== nextSibling) {
          mountItem.items.push(start)
          start = start.nextSibling as ChildNode
        }
      }
      if (rowContexts) {
        rowContexts[0] = result.ctx
        parser.__scoped(rowContexts, renderInContext)
      } else {
        parser.__scoped(capturedContext, () => {
          parser.__push(result.ctx)
          renderInContext()
        })
      }
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
      const beginParent = commentBegin.parentNode
      const endParent = commentEnd.parentNode
      if (!beginParent || !endParent) return
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
      stopObserving = (
        parseResult.subscribe ? parseResult.subscribe(updateDom) : () => {}
      ) as StopObserving
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
    /\{?\[?\(?([^)}\]]+)\)?\]?\}?([^)]+)?\s+\b(?:in|of)\b\s+(.*)\s*$/

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
      indexOfIndex !== -1 &&
      (keys[indexOfIndex] === 'index' || keys[indexOfIndex]?.startsWith('#'))
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
        const result: { ctx: any; index: SRef<number> } = {
          ctx,
          index: noIndexRef,
        }
        if (index) {
          result.index = ctx[
            index.startsWith('#') ? index.substring(1) : index
          ] = sref(i)
        }
        return result
      },
    }
  }

  __createKeyGetter(keyExpression: string | null): (v: any) => unknown {
    // Fast key resolver for r-for:
    // - plain key: direct property lookup
    // - dotted key: compiled path walk
    // This intentionally avoids parser/evaluator overhead in hot diff paths.
    if (!keyExpression) return (v: any) => v
    const expression = keyExpression.trim()
    if (!expression) return (v: any) => v
    if (expression.includes('.')) {
      const path = this.__compilePath(expression)
      const fallbackPath = path.length > 1 ? path.slice(1) : undefined
      return (v: any) => {
        const base = unref(v)
        const primary = this.__walkPath(base, path)
        if (primary !== undefined || !fallbackPath) return primary
        // Supports alias-prefixed keys like "row.id" without carrying alias metadata.
        return this.__walkPath(base, fallbackPath)
      }
    }
    return (v: any) => unref(unref(v)?.[expression])
  }

  __compilePath(path: string): string[] {
    return path.split('.').filter((x) => x.length > 0)
  }

  __walkPath(source: any, path: string[]): unknown {
    let value = source
    for (const part of path) {
      value = unref(value)?.[part]
    }
    return unref(value)
  }
}
