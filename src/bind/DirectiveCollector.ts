import { camelize, isHTMLElement } from '../common/common'
import { isNullOrWhitespace } from '../common/is-what'
import { type Binder } from './Binder'

export class DirectiveElement {
  name: string // r-on @click @submit r-on:click.prevent @submit.prevent  @[event-name].self.camel :src :className.prop .class-name.camel r-if r-for key

  /** Contains: ['@', 'submit'], ['r-on', 'click'], ['@', '[dynamicKey]'] */
  terms: string[] = []

  /** Contains directive flags. ['camel', 'prevent',...] */
  flags: string[] = []

  elements: HTMLElement[] = []

  constructor(name: string) {
    this.name = name
    this.__parse()
  }

  __parse(): void {
    let name = this.name
    const isPropShortcut = name.startsWith('.')
    if (isPropShortcut) name = ':' + name.slice(1)
    const firstFlagIndex = name.indexOf('.')
    const terms = (this.terms = (
      firstFlagIndex < 0 ? name : name.substring(0, firstFlagIndex)
    ).split(/[:@]/))
    if (isNullOrWhitespace(terms[0])) terms[0] = isPropShortcut ? '.' : name[0]

    if (firstFlagIndex >= 0) {
      const flags = (this.flags = name.slice(firstFlagIndex + 1).split('.'))
      if (flags.includes('camel')) {
        const index = terms.length - 1
        terms[index] = camelize(terms[index])
      }
      if (flags.includes('prop')) {
        terms[0] = '.'
      }
    }
  }
}

export type DirectiveMap = Map<string, DirectiveElement>

/**
 * @internal
 */
export class DirectiveCollector {
  __binder: Binder
  __prefixes: string[]

  constructor(binder: Binder) {
    this.__binder = binder
    this.__prefixes = binder.__config.__getPrefixes()
  }

  __collect(element: Element, isRecursive: boolean): DirectiveMap {
    const map = new Map<string, DirectiveElement>()
    if (!isHTMLElement(element)) return map
    const prefixes = this.__prefixes
    const processNode = (node: HTMLElement): void => {
      const names = node
        .getAttributeNames()
        .filter((name) => prefixes.some((p) => name.startsWith(p)))
      for (const name of names) {
        if (!map.has(name)) map.set(name, new DirectiveElement(name))
        const item = map.get(name) as DirectiveElement
        item.elements.push(node)
      }
    }
    processNode(element)
    if (!isRecursive) return map
    const nodes = element.querySelectorAll<HTMLElement>('*')
    for (const node of nodes) {
      processNode(node)
    }
    return map
  }
}
