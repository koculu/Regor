import { type Directive, type ParseResult, type Unbinder } from '../api/types'
import { camelize } from '../common/common'
import {
  isFunction,
  isNullOrWhitespace,
  isObject,
  isString,
} from '../common/is-what'
import { warning, WarningType } from '../log/warnings'
import { unref } from '../reactivity/unref'

const availableFlags = [
  'stop',
  'prevent',
  'capture',
  'self',
  'once',
  'left',
  'right',
  'middle',
  'passive',
] as const
type EventFlags = Record<(typeof availableFlags)[number], boolean>

const getFlags = (flags: string): EventFlags | undefined => {
  const result: Record<string, boolean> = {}
  if (isNullOrWhitespace(flags)) {
    return undefined
  }
  const items = flags.split(',')
  for (const f of availableFlags) {
    result[f] = items.includes(f)
  }
  return result as EventFlags
}

/**
 * @internal
 */
const bindOn = (
  el: HTMLElement,
  parseResult: ParseResult,
  option?: string,
  dynamicOption?: ParseResult,
  flags?: string[],
): Unbinder => {
  if (dynamicOption) {
    const values = parseResult.value()
    const option = unref(dynamicOption.value()[0])
    if (!isString(option)) return () => {}
    return attachEventListener(
      el,
      camelize(option),
      () => parseResult.value()[0],
      flags?.join(',') ?? values[1],
    )
  } else if (option) {
    const values = parseResult.value()
    return attachEventListener(
      el,
      camelize(option),
      () => parseResult.value()[0],
      flags?.join(',') ?? values[1],
    )
  }
  // object syntax
  // {k,v,f,...},{k,v,f,...},...
  const unbinders: Unbinder[] = []
  const unbinder = (): void => {
    unbinders.forEach((x) => x())
  }
  const values = parseResult.value()
  const len = values.length
  for (let i = 0; i < len; ++i) {
    let next = values[i]
    if (isFunction(next)) next = next()
    if (isObject(next)) {
      for (const item of Object.entries(next)) {
        const eventType = item[0]
        const method = (): any => {
          let obj = parseResult.value()[i] as any
          if (isFunction(obj)) obj = obj()
          obj = obj[eventType]
          if (isFunction(obj)) obj = obj()
          return obj
        }
        const flags = (next as any)[eventType + '_flags']
        unbinders.push(attachEventListener(el, eventType, method, flags))
      }
    } else {
      warning(WarningType.BindingRequiresObjectExpressions, 'r-on', el)
    }
  }
  return unbinder
}

export const onDirective: Directive = {
  isLazy: (i: number, d: number) => d === -1 && i % 2 === 0,
  isLazyKey: (key: string, d: number) => d === 0 && !key.endsWith('_flags'),
  once: false,
  collectRefObj: true,
  mount: ({ el, parseResult, option, dynamicOption, flags }) => {
    return bindOn(
      el,
      parseResult,
      option as string | undefined,
      dynamicOption,
      flags,
    )
  },
}

const getShouldExecuteEvent = (
  eventType: string,
  flags: string,
): [string, (_: any) => boolean] => {
  if (
    eventType.startsWith('keydown') ||
    eventType.startsWith('keyup') ||
    eventType.startsWith('keypress')
  ) {
    flags ??= ''
    const parts = [...eventType.split('.'), ...flags.split(',')]
    eventType = parts[0]
    const keyType = parts[1]
    const isCtrl = parts.includes('ctrl')
    const isShift = parts.includes('shift')
    const isAlt = parts.includes('alt')
    const isMeta = parts.includes('meta')
    const checkModifiers = (e: KeyboardEvent): boolean => {
      if (isCtrl && !e.ctrlKey) return false
      if (isShift && !e.shiftKey) return false
      if (isAlt && !e.altKey) return false
      if (isMeta && !e.metaKey) return false
      return true
    }

    if (keyType) {
      return [
        eventType,
        (e: KeyboardEvent) => {
          if (!checkModifiers(e)) return false
          return e.key.toUpperCase() === keyType.toUpperCase()
        },
      ]
    }
    return [eventType, checkModifiers]
  }
  return [eventType, (_: any) => true]
}

/**
 * @internal
 */
export const attachEventListener = (
  el: HTMLElement,
  eventType: string,
  method: (e: unknown) => any,
  flags: any,
): Unbinder => {
  if (isNullOrWhitespace(eventType)) {
    warning(WarningType.MissingEventType, 'r-on', el)
    return () => {}
  }

  const flag = getFlags(flags)
  const options = flag
    ? {
        capture: flag.capture,
        passive: flag.passive,
        once: flag.once,
      }
    : undefined

  let shouldExecuteEvent: (_: any) => boolean
  ;[eventType, shouldExecuteEvent] = getShouldExecuteEvent(eventType, flags)

  const execute = (e: Event): void => {
    if (!shouldExecuteEvent(e)) return
    if (!method && eventType === 'submit' && flag?.prevent) return
    let r = method(e) // might be lazy
    if (isFunction(r)) r = r(e) // might return a function
    if (isFunction(r)) r(e) // final call
  }

  const unbinder = (): void => {
    el.removeEventListener(eventType, listener, options)
  }

  const listener = (e: Event): void => {
    if (!flag) {
      execute(e)
      return
    }
    try {
      if (flag.left && (e as MouseEvent).button !== 0) return
      if (flag.middle && (e as MouseEvent).button !== 1) return
      if (flag.right && (e as MouseEvent).button !== 2) return
      if (flag.self && e.target !== el) return
      if (flag.stop) e.stopPropagation()
      if (flag.prevent) e.preventDefault()
      execute(e)
    } finally {
      if (flag.once) unbinder()
    }
  }
  el.addEventListener(eventType, listener, options)
  return unbinder
}
