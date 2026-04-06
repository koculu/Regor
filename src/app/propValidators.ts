import { type AnyRef } from '../api/types'
import { isArray, isObject } from '../common/is-what'
import { isRef } from '../reactivity/isRef'
import { type ComponentHead } from './ComponentHead'

/**
 * Internal error used by built-in validators to carry an exact prop path and a
 * plain failure detail without baking final message formatting into each
 * validator.
 *
 * @internal
 */
export class PropValidationError extends Error {
  propPath: string
  detail: string

  constructor(propPath: string, detail: string) {
    super(detail)
    this.name = 'PropValidationError'
    this.propPath = propPath
    this.detail = detail
  }
}

/**
 * Assertion-style runtime validator used by `head.validateProps(...)`.
 *
 * A validator should throw when the value is invalid and return normally when
 * the value satisfies the expected runtime contract.
 *
 * @typeParam TValue - Value type asserted by the validator when it succeeds.
 * @param value - Raw incoming prop value.
 * @param name - Prop name or nested path currently being validated.
 * @param head - Current component head, useful for context-aware validation.
 */
export type PropValidator<TValue = unknown> = (
  value: unknown,
  name: string,
  head: ComponentHead<any>,
) => asserts value is TValue

type ValidationSchemaLike = Record<string, PropValidator<any>>
type ValidatorTuple = readonly [
  PropValidator<any>,
  PropValidator<any>,
  ...PropValidator<any>[],
]
type InferValidatorValue<TValidator> =
  TValidator extends PropValidator<infer TValue> ? TValue : never

/**
 * Validation schema shape suggested by `ComponentHead<T>.props`.
 *
 * Every key is optional so component authors can validate only the subset they
 * care about. Editor completion is still driven by the known prop keys.
 */
export type PropValidationSchemaFor<TProps extends object> = {
  [TKey in keyof TProps]?: PropValidator<TProps[TKey]>
}

/**
 * Infers the asserted value types from a validation schema.
 *
 * Keys whose values are not validators are ignored.
 */
export type InferPropValidationSchema<TSchema extends Record<string, unknown>> =
  {
    [TKey in keyof TSchema as TSchema[TKey] extends PropValidator<any>
      ? TKey
      : never]: TSchema[TKey] extends PropValidator<infer TValue>
      ? TValue
      : never
  }

/**
 * Throws a structured validation failure for the given prop path.
 *
 * This is the preferred way for custom validators to fail because it preserves
 * the exact prop path for nested validators such as `shape(...)`, `arrayOf(...)`,
 * and `refOf(...)`. `ComponentHead.validateProps(...)` then wraps that failure
 * with the component host information.
 *
 * Example:
 * ```ts
 * const isNonEmptyString: PropValidator<string> = (value, name) => {
 *   if (typeof value !== 'string' || value.trim() === '') {
 *     pval.fail(name, `expected non-empty string, ${pval.describe(value)}`)
 *   }
 * }
 * ```
 *
 * @param name - Prop name or nested prop path being validated.
 * @param message - Failure detail without the final prop/component prefix.
 * @throws PropValidationError Always throws.
 */
export const fail = (name: string, message: string): never => {
  throw new PropValidationError(name, `${message}.`)
}

const describeValue = (value: unknown): string => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (isRef(value)) {
    return `ref<${describeValue(value())}>`
  }
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'bigint') return 'bigint'
  if (typeof value === 'symbol') return 'symbol'
  if (typeof value === 'function') return 'function'
  if (isArray(value)) return 'array'
  if (value instanceof Date) return 'Date'
  if (value instanceof RegExp) return 'RegExp'
  if (value instanceof Map) return 'Map'
  if (value instanceof Set) return 'Set'
  const ctorName = (value as { constructor?: { name?: string } })?.constructor
    ?.name
  return ctorName && ctorName !== 'Object' ? ctorName : 'object'
}

const trimPreview = (value: string): string => {
  return value.length > 60 ? `${value.slice(0, 57)}...` : value
}

const formatPreview = (value: unknown, depth = 0): string => {
  const maxPreviewDepth = 1
  const maxArrayItems = 5
  const maxObjectEntries = 5

  if (depth > maxPreviewDepth) return 'unknown'
  if (isRef(value)) {
    const refValue = value()
    return `ref(${formatPreview(refValue, depth + 1)})`
  }
  if (typeof value === 'string') return trimPreview(JSON.stringify(value))
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value)
  }
  if (typeof value === 'symbol') return String(value)
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (value instanceof Date) return value.toISOString()
  if (value instanceof RegExp) return String(value)
  if (isArray(value)) {
    const items = value
      .slice(0, maxArrayItems)
      .map((x) => formatPreview(x, depth + 1))
      .join(', ')
    return value.length > maxArrayItems ? `[${items}, ...]` : `[${items}]`
  }
  if (isObject(value)) {
    const entries = Object.entries(value).slice(0, maxObjectEntries)
    if (entries.length === 0) return '{}'
    const text = entries
      .map(([key, entry]) => {
        const preview = formatPreview(entry, depth + 1)
        return `${key}: ${preview}`
      })
      .join(', ')
    return Object.keys(value).length > maxObjectEntries
      ? `{ ${text}, ... }`
      : `{ ${text} }`
  }
  return 'unknown'
}

/**
 * Describes the received runtime value in the same style used by Regor's
 * built-in prop validators.
 *
 * This is useful in custom validators when you want failure messages to stay
 * consistent with `pval.isString`, `pval.isNumber`, `pval.refOf(...)`, and the
 * other built-ins. The description includes both a received type label and a
 * compact preview of the value. Regor refs are shown explicitly together with
 * their current value.
 *
 * Example:
 * ```ts
 * const isPositiveNumber: PropValidator<number> = (value, name) => {
 *   if (typeof value !== 'number' || value <= 0) {
 *     pval.fail(name, `expected positive number, ${pval.describe(value)}`)
 *   }
 * }
 * ```
 *
 * @param value - Raw runtime value that failed validation.
 * @returns A compact `got ...` description suitable for validator errors.
 */
export const describe = (value: unknown): string => {
  if (isRef(value)) {
    return `got ${describeValue(value)}(${formatPreview(value())})`
  }
  const type = describeValue(value)
  const preview = formatPreview(value)
  return `got ${type} (${preview})`
}

const getErrorDetail = (error: unknown): string => {
  if (error instanceof PropValidationError) return error.detail
  if (error instanceof Error) return error.message
  return String(error)
}

const trimReceivedSuffix = (detail: string, value: unknown): string => {
  const received = `, ${describe(value)}.`
  return detail.endsWith(received) ? detail.slice(0, -received.length) : detail
}

const getOrReason = (name: string, error: unknown, value: unknown): string => {
  if (error instanceof PropValidationError) {
    if (error.propPath === name) {
      return trimReceivedSuffix(error.detail, value)
    }
    if (error.propPath === `${name}.value` && isRef(value)) {
      const innerReason = trimReceivedSuffix(error.detail, value())
      if (innerReason.startsWith('expected ')) {
        return `expected ref<${innerReason.slice('expected '.length)}>`
      }
      return `expected ref where ${innerReason}`
    }
  }
  return getErrorDetail(error)
}

const formatOrDetail = (
  name: string,
  errors: unknown[],
  value: unknown,
): string => {
  const reasons: string[] = []

  for (const error of errors) {
    const reason = getOrReason(name, error, value)
    if (!reasons.includes(reason)) reasons.push(reason)
  }

  if (reasons.length === 0) return describe(value)
  if (reasons.length === 1) return `${reasons[0]}, ${describe(value)}`
  return `${reasons.join(' or ')}, ${describe(value)}`
}

const formatLiteral = (value: unknown): string => {
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  return describeValue(value)
}

/**
 * Validates that a prop is a string.
 */
export const isString: PropValidator<string> = (value, name) => {
  if (typeof value !== 'string')
    fail(name, `expected string, ${describe(value)}`)
}

/**
 * Validates that a prop is a number.
 */
export const isNumber: PropValidator<number> = (value, name) => {
  if (typeof value !== 'number')
    fail(name, `expected number, ${describe(value)}`)
}

/**
 * Validates that a prop is a boolean.
 */
export const isBoolean: PropValidator<boolean> = (value, name) => {
  if (typeof value !== 'boolean')
    fail(name, `expected boolean, ${describe(value)}`)
}

/**
 * Validates that a prop is an instance of the given runtime class.
 *
 * This works with real classes only. It cannot validate interfaces or type
 * aliases because those do not exist at runtime.
 */
export const isClass = <TValue extends object>(
  ctor: abstract new (...args: any[]) => TValue,
): PropValidator<TValue> => {
  return (value, name) => {
    if (!(value instanceof ctor)) {
      fail(
        name,
        `expected instance of ${ctor.name || 'provided class'}, ${describe(value)}`,
      )
    }
  }
}

/**
 * Wraps a validator so `undefined` is also accepted.
 */
export const optional = <TValue>(
  validator: PropValidator<TValue>,
): PropValidator<TValue | undefined> => {
  return (value, name, head) => {
    if (value === undefined) return
    validator(value, name, head)
  }
}

/**
 * Wraps a validator so `null` is also accepted.
 */
export const nullable = <TValue>(
  validator: PropValidator<TValue>,
): PropValidator<TValue | null> => {
  return (value, name, head) => {
    if (value === null) return
    validator(value, name, head)
  }
}

/**
 * Accepts the value when any of the provided validators succeeds.
 *
 * This is useful for runtime union-style contracts such as string-or-number or
 * nullable object-or-ref shapes.
 *
 * Example:
 * ```ts
 * head.validateProps({
 *   value: pval.or(pval.isString, pval.isNumber),
 * })
 * ```
 *
 * Example with refs:
 * ```ts
 * head.validateProps({
 *   value: pval.or(pval.isString, pval.refOf(pval.isString)),
 * })
 * ```
 */
export const or = <TValidators extends ValidatorTuple>(
  ...validators: TValidators
): PropValidator<InferValidatorValue<TValidators[number]>> => {
  return (value, name, head) => {
    const errors: unknown[] = []
    for (const validator of validators) {
      try {
        validator(value, name, head)
        return
      } catch (error) {
        errors.push(error)
      }
    }
    fail(name, formatOrDetail(name, errors, value))
  }
}

/**
 * Validates that a prop matches one of the provided literal values.
 */
export const oneOf = <const TValue extends readonly unknown[]>(
  values: TValue,
): PropValidator<TValue[number]> => {
  return (value, name) => {
    if (values.includes(value)) return
    fail(
      name,
      `expected one of ${values.map((x) => formatLiteral(x)).join(', ')}, ${describe(value)}`,
    )
  }
}

/**
 * Validates that a prop is an array and applies the given validator to each
 * entry. Nested failures include the failing index in the prop path.
 */
export const arrayOf = <TValue>(
  validator: PropValidator<TValue>,
): PropValidator<TValue[]> => {
  return (value, name, head) => {
    if (!isArray(value)) fail(name, `expected array, ${describe(value)}`)
    const items = value as unknown[]
    for (let i = 0; i < items.length; ++i) {
      validator(items[i], `${name}[${i}]`, head)
    }
  }
}

/**
 * Validates that a prop is an object and applies validators to selected nested
 * keys. Nested failures include dotted prop paths such as `meta.slug`.
 */
export const shape = <TSchema extends ValidationSchemaLike>(
  schema: TSchema,
): PropValidator<InferPropValidationSchema<TSchema>> => {
  return (value, name, head) => {
    if (!isObject(value)) fail(name, `expected object, ${describe(value)}`)
    const record = value as Record<string, unknown>
    for (const key in schema) {
      const validator: PropValidator<unknown> = schema[key]
      validator(record[key], `${name}.${key}`, head)
    }
  }
}

/**
 * Validates that a prop is a Regor ref and applies the given validator to the
 * ref's current value.
 *
 * This is useful for dynamic single-prop bindings such as `:title="titleRef"`.
 */
export const refOf = <TValue>(
  validator: PropValidator<TValue>,
): PropValidator<AnyRef> => {
  return (value, name, head) => {
    if (isRef(value)) {
      validator(value(), `${name}.value`, head)
      return
    }
    fail(name, `expected ref, ${describe(value)}`)
  }
}

/**
 * Built-in prop-validator namespace used with `head.validateProps(...)`.
 *
 * This namespace includes both ready-made validators and composition helpers.
 * Custom validators can also use `pval.fail(...)` and `pval.describe(...)`
 * to produce messages in the same style as Regor's built-in validators.
 *
 * Example:
 * ```ts
 * head.validateProps({
 *   title: pval.isString,
 *   count: pval.optional(pval.isNumber),
 *   meta: pval.shape({
 *     slug: pval.isString,
 *   }),
 * })
 * ```
 */
export const pval = {
  fail,
  describe,
  isString,
  isNumber,
  isBoolean,
  isClass,
  optional,
  nullable,
  or,
  oneOf,
  arrayOf,
  shape,
  refOf,
} as const
