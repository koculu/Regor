import { type IRegorContext } from '../api/types'
import { removeNode } from '../cleanup/removeNode'
import { callUnmounted } from '../composition/callUnmounted'

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
 * const Card = createComponent({
 *   template: `<article><h3 r-text="title"></h3></article>`,
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

  constructor(
    props: TContext,
    element: Element,
    ctx: IRegorContext[],
    start: Comment,
    end: Comment,
  ) {
    this.props = props
    this.__element = element
    this.ctx = ctx
    this.start = start
    this.end = end
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
