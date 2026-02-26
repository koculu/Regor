import {
  type AnyRef,
  type Component,
  type IsLazy,
  type IsLazyKey,
  type ParseResult,
  type StopObserving,
} from '../api/types'
import { type RegorConfig } from '../app/RegorConfig'
import { isNullOrWhitespace } from '../common/is-what'
import { warning, WarningType } from '../log/warnings'
import { observe } from '../observer/observe'
import { jsep } from './jsep/jsep'
import { type ArrayExpression, type Expression } from './jsep/jsep-types'
import { regorEval } from './regorEval'

const astCache: Record<string, ArrayExpression> = {}
const isComponentMap = (value: unknown): value is Record<string, Component> =>
  !!value

/**
 * @internal
 */
export class Parser {
  __contexts: Record<string, unknown>[]

  __config: RegorConfig

  constructor(contexts: Record<string, unknown>[], config: RegorConfig) {
    this.__contexts = contexts
    this.__config = config
  }

  __push(context: Record<string, unknown>): void {
    this.__contexts = [context, ...this.__contexts]
  }

  __getComponents(): Record<string, Component> {
    const obj = this.__contexts
      .map((x) => x.components)
      .filter(isComponentMap)
      .reverse()
      .reduce<Record<string, Component>>((p, c) => {
        for (const [key, value] of Object.entries(c)) {
          p[key.toUpperCase()] = value
        }
        return p
      }, {})
    return obj
  }

  __getComponentSelectors(): string[] {
    const selectors: string[] = []
    const seen = new Set<string>()
    const componentsList = this.__contexts
      .map((x) => x.components)
      .filter(isComponentMap)
      .reverse()
    for (const components of componentsList) {
      for (const key of Object.keys(components)) {
        if (seen.has(key)) continue
        seen.add(key)
        selectors.push(key)
      }
    }
    return selectors
  }

  __parse(
    expression: string,
    isLazy?: IsLazy,
    isLazyKey?: IsLazyKey,
    collectRefObj?: boolean,
    once?: boolean,
  ): ParseResult {
    let currentValues: unknown[] = []
    const stopObserverList: StopObserving[] = []
    const subscribers = new Set<(values: unknown[]) => void>()
    const clearObservers = (): void => {
      for (let i = 0; i < stopObserverList.length; ++i) {
        stopObserverList[i]()
      }
      stopObserverList.length = 0
    }
    const unbinder = (): void => {
      clearObservers()
      subscribers.clear()
    }
    const subscribe = (
      observer: (values: unknown[]) => void,
      init?: boolean,
    ): StopObserving => {
      subscribers.add(observer)
      if (init) observer(currentValues)
      return () => {
        subscribers.delete(observer)
      }
    }
    const result: ParseResult = {
      value: () => currentValues,
      stop: unbinder,
      subscribe,
      refs: [],
      context: this.__contexts[0],
    }
    if (isNullOrWhitespace(expression)) return result
    const globalContext = this.__config.globalContext
    const refs: AnyRef[] = []
    const uniqueRefs = new Set<AnyRef>()
    const evaluate = (
      expr: Expression,
      contexts: Record<string, unknown>[],
      collectRefs: boolean,
      context?: unknown,
    ): { value: unknown; refs: AnyRef[]; ref?: AnyRef } => {
      try {
        const r = regorEval(
          expr,
          contexts,
          globalContext,
          isLazy,
          isLazyKey,
          context,
          collectRefObj,
        )
        if (collectRefs && r.refs.length > 0) refs.push(...r.refs)
        return { value: r.value, refs: r.refs, ref: r.ref }
      } catch (e) {
        warning(WarningType.ErrorLog, `evaluation error: ${expression}`, e)
      }
      return { value: undefined, refs: [] }
    }
    try {
      const ast =
        astCache[expression] ??
        (jsep('[' + expression + ']') as ArrayExpression)
      astCache[expression] = ast
      const contexts = this.__contexts.slice()
      const elements = ast.elements
      const len = elements.length
      const expressionRefs = new Array<AnyRef | undefined>(len)
      result.refs = expressionRefs
      const refresh = (): void => {
        refs.length = 0
        if (!once) {
          uniqueRefs.clear()
          clearObservers()
        }
        const nextValues = new Array<unknown>(len)
        for (let i = 0; i < len; ++i) {
          const expr = elements[i]
          if (isLazy?.(i, -1)) {
            nextValues[i] = (e: Event) =>
              evaluate(expr, contexts, false, { $event: e }).value
            continue
          }
          const evaluated = evaluate(expr, contexts, true)
          nextValues[i] = evaluated.value
          expressionRefs[i] = evaluated.ref
        }
        if (!once) {
          for (const r of refs) {
            if (uniqueRefs.has(r)) continue
            uniqueRefs.add(r)
            stopObserverList.push(observe(r, refresh))
          }
        }
        currentValues = nextValues as unknown[]
        if (subscribers.size !== 0) {
          for (const subscriber of subscribers) {
            if (!subscribers.has(subscriber)) continue
            subscriber(currentValues)
          }
        }
      }
      refresh()
    } catch (e) {
      warning(WarningType.ErrorLog, `parse error: ${expression}`, e)
    }
    return result
  }

  __capture(): Record<string, unknown>[] {
    return this.__contexts.slice()
  }

  __replaced: Record<string, unknown>[][] = []

  __replace(contexts: Record<string, unknown>[]): void {
    this.__replaced.push(this.__contexts)
    this.__contexts = contexts
  }

  __scoped(contexts: Record<string, unknown>[], action: () => unknown): void {
    try {
      this.__replace(contexts)
      action()
    } finally {
      this.__restore()
    }
  }

  __restore(): void {
    this.__contexts = this.__replaced.pop() ?? []
  }
}
