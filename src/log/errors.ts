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
  RefIsReadOnly,
}

const errors = {
  [ErrorType.AppRootElementMissing]: 'App root element is missing',
  [ErrorType.ComponentTemplateNotFound]: (name: string) =>
    `${name} component template cannot be found.`,
  [ErrorType.ComposablesRequireScope]:
    'Use composables in scope. usage: useScope(() => new MyApp()).',
  [ErrorType.RequiresRefSourceArgument]: (name: string) =>
    `${name} requires ref source argument`,
  [ErrorType.ComputedIsReadOnly]: 'computed is readonly.',
  [ErrorType.RefIsReadOnly]: 'ref is readonly.',
}

/**
 * @internal
 */
export const getError = (type: ErrorType, ...args: unknown[]): Error => {
  const msg = errors[type] as (...args: unknown[]) => string
  return new Error(isFunction(msg) ? msg.call(errors, ...args) : msg)
}
