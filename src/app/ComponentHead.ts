import { type IRegorContext } from '../api/types'
import { callUnmounted } from '../composition/callUnmounted'
import { removeNode } from '../cleanup/removeNode'

export class ComponentHead<TProps = Record<any, any>> {
  props: TProps

  start: Comment

  end: Comment

  ctx: IRegorContext[]

  /** Automatically assigns properties defined in the :props binding to the component context when enabled. If disabled, props should be manually assigned using head.props.
   * Default: true */
  autoProps = true

  /** When both autoProps and entangle are enabled,
   * the refs defined in the component context (without using head.props)
   * become entangled with the head.props refs. (parent[ref] <==> component[ref])
   * This means that changes to parent[ref] reflect in component[ref], and vice versa.
   * Disable this flag to isolate refs created within the component context.
   * Default: true */
  entangle = true

  /** enables slot context switch to the parent
   * Default: false */
  enableSwitch = false

  /** A callback invoked after auto props get assigned to the component context. */
  onAutoPropsAssigned?: () => void

  /**
   * @internal
   */
  __element: Element

  constructor(
    props: TProps,
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

  /** use arrow syntax to be called without using head.emit.bind(head) in Binder.ts. */
  emit = (event: string, args: Record<any, any>): void => {
    this.__element.dispatchEvent(
      new CustomEvent<Record<any, any>>(event, { detail: args }),
    )
  }

  unmount(): void {
    let next = this.start.nextSibling
    const end = this.end
    while (next && next !== end) {
      removeNode(next)
      next = next.nextSibling
    }
    callUnmounted(this)
  }
}
