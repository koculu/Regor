import { warningHandler } from '..'
import { type Directive, type Component } from '../api/types'
import { capitalize } from '../common/common'
import { attrDirective } from '../directives/attr'
import { classDirective } from '../directives/class'
import { htmlDirective } from '../directives/html'
import { modelDirective } from '../directives/model'
import { onDirective } from '../directives/on'
import { propDirective } from '../directives/prop'
import { refDirective } from '../directives/ref'
import { showDirective } from '../directives/show'
import { styleDirective } from '../directives/style'
import { teleportDirective } from '../directives/teleport'
import { textDirective } from '../directives/text'
import { valueDirective } from '../directives/value'
import { flatten } from '../misc/flatten'
import { ref } from '../reactivity/ref'
import { sref } from '../reactivity/sref'

export class RegorConfig {
  static getDefault(): RegorConfig {
    return (
      RegorConfig.__defaultConfig ??
      (RegorConfig.__defaultConfig = new RegorConfig())
    )
  }

  /**
   * @internal
   */
  __directiveMap: Record<string, Directive> = {}

  /**
   * @internal
   * These are predefined names referenced in Regor source.
   * If you modify these values, modify also directiveMap matching keys.
   */
  __builtInNames: Record<string, string> = {}

  /**
   * @internal
   */
  __getPrefixes = (): string[] =>
    Object.keys(this.__directiveMap).filter(
      (x) => x.length === 1 || !x.startsWith(':'),
    )

  /**
   * @internal
   * Keep upper cased component names because html markup is case insensitive. */
  __components = new Map<string, Component>()

  /**
   * @internal
   * Keep upper cased component names because html markup is case insensitive. */
  __componentsUpperCase = new Map<string, Component>()

  /**
   * @internal
   */
  static __defaultConfig: RegorConfig

  /**
   * @internal
   */
  static __defaultGlobalKeys =
    'Infinity,undefined,NaN,isFinite,isNaN,parseFloat,parseInt,decodeURI,' +
    'decodeURIComponent,encodeURI,encodeURIComponent,Math,Number,Date,Array,' +
    'Object,Boolean,String,RegExp,Map,Set,JSON,Intl,BigInt,console'

  forGrowThreshold = 10

  globalContext: Record<string, any>

  useInterpolation = true

  constructor(globalContext?: Record<any, any>) {
    this.setDirectives('r-')
    if (globalContext) {
      this.globalContext = globalContext
      return
    }
    this.globalContext = this.__createGlobalContext()
  }

  /**
   * @internal
   */
  __createGlobalContext(): Record<string, any> {
    const obj: Record<string, any> = {}
    const global = globalThis as Record<string, any>
    for (const key of RegorConfig.__defaultGlobalKeys.split(',')) {
      obj[key] = global[key]
    }
    obj.ref = ref
    obj.sref = sref
    obj.flatten = flatten
    return obj
  }

  addComponent<TProps = Record<any, any>>(
    ...components: Array<Component<TProps>>
  ): void {
    for (const component of components) {
      if (!component.defaultName) {
        warningHandler.warning(
          "Registered component's default name is not defined",
          component,
        )
        continue
      }
      this.__components.set(capitalize(component.defaultName), component)
      this.__componentsUpperCase.set(
        capitalize(component.defaultName).toLocaleUpperCase(),
        component,
      )
    }
  }

  setDirectives(prefix: string): void {
    this.__directiveMap = {
      '.': propDirective,
      ':': attrDirective,
      '@': onDirective,
      [`${prefix}on`]: onDirective,
      [`${prefix}bind`]: attrDirective,
      [`${prefix}html`]: htmlDirective,
      [`${prefix}text`]: textDirective,
      [`${prefix}show`]: showDirective,
      [`${prefix}model`]: modelDirective,
      ':style': styleDirective,
      [`${prefix}bind:style`]: styleDirective,
      ':class': classDirective,
      [`${prefix}bind:class`]: styleDirective,
      ':ref': refDirective,
      ':value': valueDirective,
      teleport: teleportDirective,
    }

    /** These are predefined names referenced in Regor source.
     * If you modify these values, modify also directiveMap matching keys.
     */
    this.__builtInNames = {
      for: `${prefix}for`,
      if: `${prefix}if`,
      else: `${prefix}else`,
      elseif: `${prefix}else-if`,
      pre: `${prefix}pre`,
      inherit: `${prefix}inherit`,
      text: `${prefix}text`,
      props: ':props',
      propsOnce: ':props-once',
      bind: `${prefix}bind`,
      on: `${prefix}on`,
      keyBind: ':key',
      key: 'key',
      is: ':is',
      teleport: `${prefix}teleport`,
      /*
       * While using the setAttribute method in standard HTML, it's important to note that attribute names cannot include the '[' and ']' characters.
       * Thankfully, Regor provides an elegant solution by automatically converting these characters within the HTML template into a suitable string, but only when necessary to adhere to HTML standards.
       */
      dynamic: '_d_',
    }
  }

  updateDirectives(
    updater: (
      directiveMap: Record<string, Directive>,
      builtInNames: Record<string, string>,
    ) => void,
  ): void {
    updater(this.__directiveMap, this.__builtInNames)
  }
}
