import {
  type AnyRef,
  type Directive,
  type ParseResult,
  type Unbinder,
} from '../src/api/types'
import { observe } from '../src/observer/observe'
import { isRef } from '../src/reactivity/isRef'

const noopUnbinder: Unbinder = () => {}

const defaultParseResult = (): ParseResult => ({
  value: () => [],
  stop: noopUnbinder,
  subscribe: () => noopUnbinder,
  refs: [],
  context: {},
})

export const bindDirective = (
  directive: Directive,
  el: HTMLElement,
  parseResult: ParseResult,
  expr: string,
  option?: string,
  dynamicOption?: ParseResult,
  flags?: string[],
  opts?: { runInitialUpdate?: boolean; observeValueRef?: boolean },
): Unbinder => {
  const createPayload = () => ({
    el,
    expr,
    values: parseResult.value(),
    previousValues: undefined,
    option,
    previousOption: undefined,
    flags,
    parseResult,
    dynamicOption,
  })
  const payload = createPayload()
  const runInitialUpdate = opts?.runInitialUpdate ?? false
  const observeValueRef = opts?.observeValueRef ?? false
  const noopStop: Unbinder = () => {}

  let stopValueObserver = noopStop
  const mounted = directive.mount(payload)
  if (typeof mounted === 'function') return mounted
  if (runInitialUpdate) {
    mounted?.update?.(payload)
  }
  if (
    observeValueRef &&
    mounted?.update &&
    isRef(parseResult.value as unknown)
  ) {
    stopValueObserver = observe(parseResult.value as AnyRef, () => {
      mounted.update?.(createPayload())
    })
  }
  return () => {
    stopValueObserver()
    ;(mounted?.unmount ?? noopUnbinder)()
  }
}

export const updateDirective = (
  directive: Directive,
  el: HTMLElement,
  values: unknown[],
  previousValues?: unknown[],
  option?: unknown,
  previousOption?: unknown,
  flags?: string[],
  parseResult?: ParseResult,
  expr = '',
  dynamicOption?: ParseResult,
): void => {
  const parsed = parseResult ?? defaultParseResult()
  const payload = {
    el,
    expr,
    values,
    previousValues,
    option,
    previousOption,
    flags,
    parseResult: parsed,
    dynamicOption,
  }
  const mounted = directive.mount(payload)
  if (typeof mounted !== 'function') {
    mounted?.update?.(payload)
    mounted?.unmount?.()
  }
}
