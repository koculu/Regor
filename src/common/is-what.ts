/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export const isFunction = (value: unknown): value is Function => {
  return typeof value === 'function'
}

/**
 * @internal
 */
export const isString = (value: unknown): value is string => {
  return typeof value === 'string'
}

/**
 * @internal
 */
export const isUndefined = (value: unknown): value is undefined => {
  return typeof value === 'undefined'
}

/**
 * @internal
 */
export const isNullOrUndefined = (
  value: unknown,
): value is null | undefined => {
  return value == null || typeof value === 'undefined'
}

/**
 * @internal
 */
export const isNullOrWhitespace = (
  value: string | undefined | null,
): value is null | undefined => {
  return typeof value !== 'string' || !value?.trim()
}

/**
 * @internal
 */
export const objectToString = Object.prototype.toString

/**
 * @internal
 */
export const toTypeString = (value: unknown): string =>
  objectToString.call(value)

/**
 * @internal
 */
export const isMap = (val: unknown): val is Map<any, any> =>
  toTypeString(val) === '[object Map]'

/**
 * @internal
 */
export const isSet = (val: unknown): val is Set<any> =>
  toTypeString(val) === '[object Set]'

/**
 * @internal
 */
export const isDate = (val: unknown): val is Date =>
  toTypeString(val) === '[object Date]'

/**
 * @internal
 */
export const isSymbol = (val: unknown): val is symbol => typeof val === 'symbol'

/**
 * @internal
 */
export const isArray = Array.isArray

/**
 * @internal
 */
export const isObject = (val: unknown): val is Record<string, unknown> =>
  val !== null && typeof val === 'object'
