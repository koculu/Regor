import { type ComponentHead } from '../app/ComponentHead'
import { type RegorConfig } from '../app/RegorConfig'

export type IsNull<T> = [T] extends [null] ? true : false

export type Equals<T, U> = T extends U ? (U extends T ? true : false) : false

type RawTypes =
  | string
  // eslint-disable-next-line @typescript-eslint/ban-types
  | Function
  | number
  | boolean
  | symbol
  | undefined
  | null
  | bigint
  | Map<unknown, unknown>
  | Set<unknown>
  | WeakMap<object, unknown>
  | WeakSet<object>
  | Node
  | EventTarget
  | Event
  | RawMarker
  | Date
  | RegExp
  | Promise<unknown>
  | Error

declare const RefSymbol: unique symbol

declare const RawSymbol: unique symbol

declare const ScopeSymbol: unique symbol

export type AnyRef = (
  newValue?: any,
  eventSource?: any,
) => any & { [RefSymbol]: true }

export type Ref<TValueType> = ((
  newValue?:
    | RefContent<TValueType>
    | Ref<RefParam<TValueType>>
    | SRef<RefContent<TValueType>>,
  eventSource?: any,
) => RefContent<TValueType>) & {
  value: RefContent<TValueType>
}

export type SRef<TValueType> = ((
  newValue?: TValueType | SRef<TValueType>,
  eventSource?: any,
) => SRefContent<TValueType>) & {
  value: SRefContent<TValueType>
}

export type ComputedRef<TValueType> = SRef<TValueType> & {
  stop: StopObserving
}

export interface RawMarker {
  [RawSymbol]: true
}

export type RefContent<TValueType> = TValueType extends undefined
  ? never
  : TValueType extends Ref<infer V1>
  ? RefContent<V1>
  : TValueType extends SRef<infer V2>
  ? V2
  : TValueType extends Array<infer V3>
  ? Array<Ref<RefParam<V3>>>
  : TValueType extends RawTypes
  ? TValueType
  : {
      [Key in keyof TValueType]: Key extends symbol
        ? TValueType[Key]
        : TValueType[Key] extends Ref<infer V4>
        ? Ref<RefParam<V4>>
        : TValueType[Key] extends SRef<infer V5>
        ? Ref<RefParam<V5>>
        : TValueType[Key] extends RawMarker
        ? TValueType[Key]
        : Ref<RefParam<TValueType[Key]>>
    }

export type RefParam<TValueType> = Equals<
  TValueType,
  MakeRefParam<TValueType>
> extends true
  ? TValueType
  : MakeRefParam<TValueType>

export type MakeRefParam<TValueType> = TValueType extends undefined
  ? never
  : TValueType extends Ref<infer V1>
  ? MakeRefParam<V1>
  : TValueType extends SRef<infer V2>
  ? MakeRefParam<V2>
  : TValueType extends Array<infer V3>
  ? Array<MakeRefParam<V3>>
  : TValueType extends RawTypes
  ? TValueType
  : {
      [Key in keyof TValueType]: TValueType[Key] extends Ref<infer V4>
        ? MakeRefParam<V4>
        : TValueType[Key] extends SRef<infer V5>
        ? MakeRefParam<V5>
        : MakeRefParam<TValueType[Key]>
    }

export type SRefContent<TValueType> = Equals<
  TValueType,
  MakeSRefContent<TValueType>
> extends true
  ? TValueType
  : MakeSRefContent<TValueType>

export type MakeSRefContent<TValueType> = TValueType extends undefined
  ? never
  : TValueType extends Ref<infer V1>
  ? RefContent<V1>
  : TValueType extends SRef<infer V2>
  ? V2
  : TValueType extends Array<infer V3>
  ? V3[]
  : TValueType extends RawTypes
  ? TValueType
  : TValueType

export type UnwrapRef<TRef> = TRef extends Ref<infer V1>
  ? RefContent<V1>
  : TRef extends SRef<infer V2>
  ? SRefContent<V2>
  : TRef

export type FlattenRef<TRef> = TRef extends Array<infer V1>
  ? Array<FlattenRef<V1>>
  : TRef extends Ref<infer V2>
  ? FlattenRef<V2>
  : TRef extends SRef<infer V3>
  ? FlattenRef<V3>
  : TRef extends AnyRef
  ? unknown
  : TRef extends RawTypes
  ? TRef
  : {
      [Key in keyof TRef]: FlattenRef<TRef[Key]>
    }

export type Flat<TValueType> = Equals<
  RefParam<TValueType>,
  FlattenRef<TValueType>
> extends true
  ? RefParam<TValueType>
  : FlattenRef<TValueType>

export type ObserveCallback<TValueType> = (
  newValue: TValueType,
  eventSource?: any,
) => void

export type StopObserving = () => void

export declare interface IRegorContext extends Record<any, any> {
  components?: Record<string, Component<any>>
  mounted?: () => void
  unmounted?: () => void
}

export type IsLazy = (i: number, d: number) => boolean

export type IsLazyKey = (key: string, d: number) => boolean

export interface Directive {
  isLazy?: IsLazy
  isLazyKey?: IsLazyKey
  collectRefObj?: boolean

  /** if once is enabled, the onChange is never triggered.
   * The refs in parseResult are still reactive. */
  once?: boolean

  /** Called on every value change. */
  onChange?: (
    el: HTMLElement,
    values: any[],
    previousValues?: any[],
    option?: any,
    previousOption?: any,
    flags?: string[],
  ) => void

  /** Called on binding. Returns unbinder.  */
  onBind?: (
    el: HTMLElement,
    parseResult: ParseResult,
    expr: string,
    option?: string,
    dynamicOption?: ParseResult,
    flags?: string[],
  ) => Unbinder
}

export interface BindData {
  unbinders: Unbinder[]
  data: Record<any, any>
}

export type Unbinder = () => void

export interface ParseResult {
  value: SRef<unknown[]>
  stop: StopObserving
  refs: Array<AnyRef | undefined>
  context: Record<any, any>
}

export type OnCleanup = (cleanup: () => void) => void

export interface JSONTemplate {
  /** tag-name */
  t?: string
  /** attributes */
  a?: Record<string, string>
  /** children */
  c?: JSONTemplate[]
  /** text node content */
  d?: string
  /** node type if node is COMMENT_NODE */
  n?: number
}

/**
 * Represents a template configuration for rendering a component or an app.
 * If used with 'createApp':
 * - Define either 'selector' or 'element' to specify the mounting point.
 * - Optionally, 'html' or 'json' can be defined to override the inner HTML of the mounting point.
 * - If neither 'html' nor 'json' template is defined, the mounting point's inner HTML remains unchanged.
 * If used with 'createComponent':
 * - Define only one option: 'selector', 'element', 'html', or 'json'. The single option defines the component's HTML template.
 */
export interface Template {
  /**
   * If used with 'createApp', specifies the target root element for mounting the application.
   * If used with 'createComponent', identifies the component template using a selector.
   */
  selector?: string

  /**
   * If used with 'createApp', represents the actual DOM element where the app will be mounted.
   * If used with 'createComponent', specifies the component template using an element.
   * Use this property if you already have a reference to the target element.
   */
  element?: Node

  /**
   *  If used with 'createApp', HTML template string that will replace the content of the root element defined by 'selector' or 'element'.
   * If used with 'createComponent', this template populates the content of the component.
   */
  template?: string

  /**
   * JSON-based template representation, enabling rendering within secure contexts.
   * Can be a single JSONTemplate object or an array of JSONTemplate objects.
   * This property is applicable to both 'createApp' and 'createComponent'.
   */
  json?: JSONTemplate | JSONTemplate[]

  /**
   * Indicates whether the component template contains SVG elements.
   * Enable this flag if SVG content is present to ensure proper rendering.
   * This property is applicable to both 'createApp' and 'createComponent'.
   */
  isSVG?: boolean
}

export interface App<TRegorContext extends IRegorContext> {
  context: TRegorContext
  unmount: () => void
  unbind: () => void
}

/**
 * Represents a component in the Regor framework.
 *
 * @typeparam TProps - The type of props accepted by the component.
 */
export interface Component<TProps = Record<any, any>> {
  /**
   * A function that returns the Regor context associated with the component.
   *
   * @param head - Provides information on component mount.
   * @returns The Regor context.
   */
  context: (head: ComponentHead<TProps>) => IRegorContext

  /**
   * The template for the component.
   */
  template: Node

  /**
   * Indicates whether the component's content should inherit attributes from its parent.
   */
  inheritAttrs?: boolean

  /**
   * An array of prop names accepted by the component.
   */
  props?: string[]

  /**
   * The default name of the component when registered in the RegorConfig using the addComponent method.
   * This property is not required if the component is used through app or component context.
   */
  defaultName?: string
}

export type OnMounted = () => void
export type OnUnmounted = () => void

export interface CreateComponentOptions<
  TProps = Record<any, any>,
> {
  useInterpolation?: boolean

  config?: RegorConfig

  /**
   * A function that defines the Regor context for the component.
   */
  context?: (head: ComponentHead<TProps>) => IRegorContext

  inheritAttrs?: boolean

  /**
   * Notes on component props:
   * The props defined in the props list can be used with :foo or r-bind:foo syntax.
   * <MyComponent :prop-kebab-1="1" r-bind:prop-kebab-2="x ? 1 : 0" :props="{ propFoo3: true, propFoo4: x ? 'a' : 'b' }></MyComponent>
   * It is required to define prop-kebab-1 and prop-kebab-2 in the props list camelized.
   * It is not required to define propFoo3 and propFoo4 in the props list because it uses :props binding. :props binding enables binding to any property of component regardless it is explicitly defined in props list.
   */
  props?: string[]

  /** The default name of the component.
   * It is required if the component is registered using the Regor config.addComponent method.
   * It is not required if the component being registered in app or component scope. */
  defaultName?: string
}

export interface Scope<TRegorContext> {
  context: TRegorContext
  unmount: () => void
  [ScopeSymbol]: true
}

/**
 * @internal
 */
export interface ComposableScope {
  onMounted: OnMounted[]
  onUnmounted: OnUnmounted[]
}

/**
 * @internal
 */
export type SRefSignature<TValueType> = (
  newValue?: TValueType,
  eventSource?: any,
  operation?: RefOperation,
  observer?: ObserveCallback<TValueType>,
) => any

/**
 * @internal
 */
export enum RefOperation {
  observe,
  trigger,
  observerCount,
  pause,
  resume,
}

/**
 * @internal
 */
export interface MountListItem {
  items: ChildNode[]
  value: any
  index: SRef<number>
  order: number
}
