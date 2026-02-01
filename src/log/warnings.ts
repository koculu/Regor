import { isFunction, isString } from '../common/is-what'

/**
 * @internal
 */
export enum WarningType {
  MissingBindingExpression,
  InvalidForExpression,
  BindingRequiresObjectExpressions,
  KeyIsEmpty,
  PropertyAssignmentFailed,
  MissingEventType,
  ErrorLog,
  ModelNotSupportOnElement,
  ModelRequiresRef,
}

/**
 * @internal
 */
const warnings = {
  [WarningType.ModelRequiresRef]: (el: Element) =>
    `Model binding requires a ref at ${el.outerHTML}`,
  [WarningType.ModelNotSupportOnElement]: (el: Element) =>
    `Model binding is not supported on ${el.tagName} element at ${el.outerHTML}`,
  [WarningType.MissingBindingExpression]: (name: string, el: Element) =>
    `${name} binding expression is missing at ${el.outerHTML}`,
  [WarningType.InvalidForExpression]: (
    name: string,
    forPath: string,
    el: Element,
  ) => `invalid ${name} expression: ${forPath} at ${el.outerHTML}`,
  [WarningType.BindingRequiresObjectExpressions]: (name: string, el: Element) =>
    `${name} requires object expression at ${el.outerHTML}`,
  [WarningType.KeyIsEmpty]: (name: string, el: Element) =>
    `${name} binder: key is empty on ${el.outerHTML}.`,
  [WarningType.PropertyAssignmentFailed]: (
    key: unknown,
    tag: string,
    value: unknown,
    e: Error,
  ) => ({
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    msg: `Failed setting prop "${key}" on <${tag.toLowerCase()}>: value ${value} is invalid.`,
    args: [e],
  }),
  [WarningType.MissingEventType]: (name: string, el: Element) =>
    `${name} binding missing event type at ${el.outerHTML}`,
  [WarningType.ErrorLog]: (msg: string, e: Error) => ({ msg, args: [e] }),
}

/**
 * @internal
 */
export const warning = (type: WarningType, ...args: unknown[]): void => {
  const msg = warnings[type] as (
    ...args: unknown[]
  ) => string | { args: unknown[] }
  const item = isFunction(msg) ? msg.call(warnings, ...args) : msg
  const handler = warningHandler.warning
  if (!handler) return
  if (isString(item)) handler(item)
  else handler(item, ...item.args)
}

/**
 * Global handler used by Regor to emit warning messages. By default warnings
 * are logged using `console.warn` but this object can be customised to display
 * warnings differently.
 */
export const warningHandler = { warning: console.warn }
