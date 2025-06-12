import { isFunction } from '../common/is-what'

/**
 * @internal
 */
export enum ErrorType {
  AppRootElementMissing,
  ComponentTemplateNotFound,
  ComposablesRequireScope,
  RequiresRefSourceArgument,
  ComputedIsReadOnly,
  PersistRequiresKey,
}

const errors = {
  [ErrorType.AppRootElementMissing]:
    "createApp can't find root element. You must define either a valid `selector` or an `element`. Example: createApp({}, {selector: '#app', html: '...'})",
  [ErrorType.ComponentTemplateNotFound]: (selector: string) =>
    `Component template cannot be found. selector: ${selector} .`,
  [ErrorType.ComposablesRequireScope]:
    'Use composables in scope. usage: useScope(() => new MyApp()).',
  [ErrorType.RequiresRefSourceArgument]: (name: string) =>
    `${name} requires ref source argument`,
  [ErrorType.ComputedIsReadOnly]: 'computed is readonly.',
  [ErrorType.PersistRequiresKey]: 'persist requires a string key.',
}

/**
 * @internal
 */
export const getError = (type: ErrorType, ...args: unknown[]): Error => {
  const msg = errors[type] as (...args: unknown[]) => string
  return new Error(isFunction(msg) ? msg.call(errors, ...args) : msg)
}
