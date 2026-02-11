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
import { sref } from '../reactivity/sref'
import { jsep } from './jsep/jsep'
import { type ArrayExpression, type Expression } from './jsep/jsep-types'
import { regorEval } from './regorEval'

const astCache: Record<string, ArrayExpression> = {}

/**
 * @internal
 */
export class Parser {
  __contexts: any[]

  __config: RegorConfig

  constructor(contexts: any[], config: RegorConfig) {
    this.__contexts = contexts
    this.__config = config
  }

  __push(context: any): void {
    this.__contexts = [context, ...this.__contexts]
  }

  __getComponents(): Record<string, Component> {
    const obj = this.__contexts
      .map((x) => x.components)
      .filter((x) => !!x)
      .reverse()
      .reduce((p, c) => {
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
      .filter((x) => !!x)
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
    const value = sref<any[]>([])
    const stopObserverList = [] as StopObserving[]
    const unbinder = (): void => {
      for (const stopObserver of stopObserverList) {
        stopObserver()
      }
      stopObserverList.length = 0
    }
    const result: ParseResult = {
      value,
      stop: unbinder,
      refs: [],
      context: this.__contexts[0],
    }
    if (isNullOrWhitespace(expression)) return result
    const globalContext = this.__config.globalContext
    const refs: any[] = []
    const evaluate = (
      expr: Expression,
      contexts: any[],
      collectRefs: boolean,
      context?: any,
    ): { value: any; refs: AnyRef[]; ref?: AnyRef } => {
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
        collectRefs && refs.push(...r.refs)
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
      const contexts = this.__contexts
      const refresh = (): void => {
        refs.splice(0)
        unbinder()
        const evaluated = ast.elements.map((x, i) => {
          if (isLazy?.(i, -1))
            return {
              value: (e: Event) =>
                evaluate(x, contexts, false, { $event: e }).value,
              refs: [],
            }
          return evaluate(x, contexts, true)
        })
        if (!once) {
          for (const r of refs) {
            const stopObserving = observe(r, refresh)
            stopObserverList.push(stopObserving)
          }
        }
        value(evaluated.map((x) => x.value))
        result.refs = evaluated.map((x) => x.ref)
      }
      refresh()
    } catch (e) {
      warning(WarningType.ErrorLog, `parse error: ${expression}`, e)
    }
    return result
  }

  __capture(): any[] {
    return this.__contexts
  }

  __replaced: any[][] = []

  __replace(contexts: any[]): void {
    this.__replaced.push(this.__contexts)
    this.__contexts = contexts
  }

  __scoped(contexts: any[], action: () => any): void {
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
