import { type IRegorContext } from '../api/types'
import { removeNode } from '../cleanup/removeNode'
import { callUnmounted } from '../composition/callUnmounted'
import { warningHandler } from '../log/warnings'
import {
  type InferPropValidationSchema,
  PropValidationError,
  type PropValidationSchemaFor,
  type PropValidator,
} from './propValidators'
import { type PropValidationMode } from './RegorConfig'

export type ContextClass<TValue extends object> = abstract new (
  ...args: never[]
) => TValue

const formatComponentValidationError = (
  element: Element,
  propName: string,
  error: unknown,
): Error => {
  const tagName = element.tagName?.toLowerCase?.() || 'unknown'
  const finalPropName =
    error instanceof PropValidationError ? error.propPath : propName
  const detail =
    error instanceof PropValidationError
      ? error.detail
      : error instanceof Error
        ? error.message
        : String(error)

  if (error instanceof Error) {
    return new Error(
      `Invalid prop "${finalPropName}" on <${tagName}>: ${detail}`,
      {
        cause: error,
      },
    )
  }
  return new Error(
    `Invalid prop "${finalPropName}" on <${tagName}>: ${detail}`,
    {
      cause: error,
    },
  )
}

/**
 * Runtime metadata passed to a component's `context(head)` factory.
 *
 * `ComponentHead` gives component authors controlled access to:
 * - incoming values from parent (`head.props`)
 * - component mount boundaries (`head.start`, `head.end`)
 * - parent-context event bridge (`head.emit(...)`)
 * - optional behavior toggles (`head.autoProps`, `head.entangle`, `head.enableSwitch`)
 *
 * Typical usage:
 * ```ts
 * const Card = defineComponent(
 *  `<article><h3 r-text="title"></h3></article>`,
 *  {
 *   props: ['title'],
 *   context(head) {
 *     // read parent values
 *     const initialTitle = head.props.title
 *
 *     // optional event to parent/listener
 *     const close = () => head.emit('close', { reason: 'user' })
 *
 *     return { title: initialTitle, close }
 *   },
 * })
 * ```
 */
export class ComponentHead<
  TContext extends IRegorContext | object = IRegorContext,
> {
  /**
   * Values provided by parent for this component instance.
   *
   * Sources:
   * - declared props via `props: ['foo']` + attribute binding (`:foo="..."`)
   * - object binding via `:context="{ ... }"`
   */
  props: TContext

  /**
   * Comment node that marks the beginning of this mounted component block.
   * Advanced use only.
   */
  start: Comment

  /**
   * Comment node that marks the end of this mounted component block.
   * Advanced use only.
   */
  end: Comment

  /**
   * Captured context chain used by this component instance.
   * Used internally for lifecycle/unmount behavior.
   */
  ctx: IRegorContext[]

  /**
   * Controls whether Regor should automatically apply incoming `head.props`
   * values to the component context after `context(head)` returns.
   *
   * Think of it as "auto wire parent inputs into my component fields".
   *
   * - `true` (default):
   *   - If a key exists in `head.props` but does not exist on the object
   *     returned by `context(head)`, Regor adds that key to component context.
   *   - Existing ref fields can receive incoming values automatically.
   *   - Ref-to-ref inputs can be entangled when `head.entangle` is enabled.
   * - `false`:
   *   - Regor does not auto-apply props.
   *   - You fully control mapping manually inside `context(head)`.
   *
   * Use `false` when you need strict custom mapping/validation/transforms
   * before any value touches component state.
   *
   * "Missing key" is always checked against the returned component context object.
   *
   * Example (auto add):
   * ```ts
   * // Parent passes: :context="{ badge: 'pro' }"
   * context(head) {
   *   // Returned context has no "badge" key:
   *   return { name: ref('Ada') }
   * }
   * // Resulting component context becomes:
   * // { name: ref('Ada'), badge: 'pro' }
   * ```
   *
   * Example:
   * ```ts
   * context(head) {
   *   head.autoProps = false
   *   const title = ref((head.props.title as string) ?? 'Untitled')
   *   return { title }
   * }
   * ```
   */
  autoProps = true

  /**
   * Enables two-way ref linking between incoming props and component context
   * when `autoProps` is also enabled.
   *
   * - `true` (default): parent and component refs stay synchronized.
   * - `false`: component keeps local ref isolation.
   */
  entangle = true

  /**
   * Enables slot context switch behavior for advanced slot scenarios.
   * Default: `false`.
   */
  enableSwitch = false

  /**
   * Optional hook called after automatic prop assignment completes.
   * Useful when post-assignment normalization is needed.
   */
  onAutoPropsAssigned?: () => void

  /**
   * @internal
   */
  __element: Element

  /**
   * Runtime behavior used when `validateProps(...)` encounters invalid input.
   * Defaults to `'throw'`.
   */
  __propValidationMode: PropValidationMode

  constructor(
    props: TContext,
    element: Element,
    ctx: IRegorContext[],
    start: Comment,
    end: Comment,
    propValidationMode: PropValidationMode,
  ) {
    this.props = props
    this.__element = element
    this.ctx = ctx
    this.start = start
    this.end = end
    this.__propValidationMode = propValidationMode
  }

  /**
   * Emits a custom DOM event from the component host element.
   *
   * Example:
   * ```ts
   * head.emit('saved', { id: 42 })
   * ```
   *
   * Parent markup can listen via regular event binding:
   * ```html
   * <MyComp @saved="onSaved"></MyComp>
   * ```
   */
  emit = (event: string, args: Record<string, unknown>): void => {
    this.__element.dispatchEvent(
      new CustomEvent<Record<string, unknown>>(event, { detail: args }),
    )
  }

  /**
   * Finds a parent context instance by constructor type from the captured
   * context stack.
   *
   * Matching uses `instanceof` and respects stack order.
   *
   * `occurrence` selects which matching instance to return:
   * - `0` (default): first match
   * - `1`: second match
   * - `2`: third match
   * - negative values: always `undefined`
   *
   * Example:
   * ```ts
   * // stack: [RootCtx, ParentCtx, ParentCtx]
   * head.findContext(ParentCtx)    // first ParentCtx
   * head.findContext(ParentCtx, 1) // second ParentCtx
   * ```
   *
   * @param constructor - Class constructor used for `instanceof` matching.
   * @param occurrence - Zero-based index of the matching instance to return.
   * @returns The matching parent context instance, or `undefined` when not found.
   */
  findContext<TValue extends object>(
    constructor: ContextClass<TValue>,
    occurrence = 0,
  ): TValue | undefined {
    if (occurrence < 0) return undefined
    let current = 0
    for (const value of this.ctx ?? []) {
      if (!(value instanceof constructor)) continue
      if (current === occurrence) return value
      ++current
    }
    return undefined
  }

  /**
   * Returns a parent context instance by constructor type from the captured
   * context stack.
   *
   * The stack is scanned in order and each entry is checked with `instanceof`.
   * `occurrence` is zero-based (`0` = first match, `1` = second match, ...).
   * If no instance exists at the requested occurrence, this method throws.
   *
   * Example:
   * ```ts
   * const auth = head.requireContext(AuthContext)     // first AuthContext
   * const outer = head.requireContext(LayoutCtx, 1)   // second LayoutCtx
   * ```
   *
   * @param constructor - Class constructor used for `instanceof` matching.
   * @param occurrence - Zero-based index of the instance to return.
   * @returns The parent context instance at the requested occurrence.
   * @throws Error when no matching instance exists at the requested occurrence.
   */
  requireContext<TValue extends object>(
    constructor: ContextClass<TValue>,
    occurrence = 0,
  ): TValue {
    const value = this.findContext(constructor, occurrence)
    if (value !== undefined) return value
    throw new Error(
      `${constructor} was not found in the context stack at occurrence ${occurrence}.`,
    )
  }

  /**
   * Validates selected incoming props using assertion-style validators.
   *
   * Only keys listed in `schema` are checked. Validation throws immediately
   * on the first invalid prop and does not mutate `head.props`.
   *
   * The schema is keyed from `head.props`, so editor completion can suggest
   * known prop names while still allowing you to validate only a subset.
   *
   * Validators typically come from `pval`, but custom user validators are also
   * supported. Custom validators may throw their own `Error`, though `pval.fail(...)`
   * is recommended so nested validators can preserve the exact failing prop path.
   *
   * Example:
   * ```ts
   * head.validateProps({
   *   title: pval.isString,
   *   count: pval.optional(pval.isNumber),
   * })
   * ```
   *
   * Example with a custom validator:
   * ```ts
   * const isNonEmptyString: PropValidator<string> = (value, name) => {
   *   if (typeof value !== 'string' || value.trim() === '') {
   *     pval.fail(name, 'expected non-empty string')
   *   }
   * }
   * ```
   *
   * @param schema - Validators to apply to selected incoming props.
   */
  validateProps<TSchema extends PropValidationSchemaFor<TContext>>(
    schema: TSchema,
  ): asserts this is ComponentHead<
    TContext & InferPropValidationSchema<TSchema>
  > {
    if (this.__propValidationMode === 'off') return
    const props = this.props as Record<string, unknown>
    for (const name in schema) {
      const validator: PropValidator<unknown> | undefined = schema[name]
      if (!validator) continue
      const validateProp: PropValidator<unknown> = validator
      try {
        validateProp(props[name], name, this)
      } catch (error) {
        const enrichedError = formatComponentValidationError(
          this.__element,
          name,
          error,
        )
        if (this.__propValidationMode === 'warn') {
          warningHandler.warning(enrichedError.message, enrichedError)
          continue
        }
        throw enrichedError
      }
    }
  }

  /**
   * Unmounts this component instance by removing nodes between `start` and `end`
   * and calling unmount lifecycle handlers for captured contexts.
   */
  unmount(): void {
    let next = this.start.nextSibling
    const end = this.end
    while (next && next !== end) {
      removeNode(next)
      next = next.nextSibling
    }
    for (const ctx of this.ctx) callUnmounted(ctx)
  }
}
