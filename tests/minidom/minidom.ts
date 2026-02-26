import cssEscape from './cssEscape'

const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])

const RAW_TEXT_ELEMENTS = new Set(['script', 'style', 'textarea'])

export enum NodeType {
  ELEMENT_NODE = 1,
  TEXT_NODE = 3,
  COMMENT_NODE = 8,
  DOCUMENT_NODE = 9,
  DOCUMENT_FRAGMENT_NODE = 11,
}

export type MiniWindow = {
  window: MiniWindow
  document: MiniDocument
  Node: typeof MiniNode
  Element: typeof MiniElement
  HTMLElement: typeof MiniHTMLElement
  HTMLSlotElement: typeof MiniHTMLSlotElement
  DocumentFragment: typeof MiniDocumentFragment
  HTMLTemplateElement: typeof MiniHTMLTemplateElement
  CustomEvent: typeof MiniCustomEvent
  Event: typeof MiniEvent
  MouseEvent: typeof MiniMouseEvent
  Comment: typeof MiniComment
  Text: typeof MiniText
  CSS: { escape: (value: string) => string }
  localStorage: MiniStorage
  sessionStorage: MiniStorage
}

export function parseHtml(html: string) {
  const document = new MiniDocument()
  const fragment = parseMiniDocumentFragment(html, document)
  document.appendChild(fragment)
  document.linkHtmlBody()
  const window = createWindow(document)
  return { document, window }
}
export function parseFragment(
  html: string,
  document?: Document,
): DocumentFragment {
  return parseMiniDocumentFragment(
    html,
    document as unknown as MiniDocument,
  ) as unknown as DocumentFragment
}

function parseMiniDocumentFragment(html: string, document?: MiniDocument) {
  const doc = document ?? new MiniDocument()
  const fragment = doc.createDocumentFragment() as MiniDocumentFragment
  parseInto(html, doc as MiniDocument, fragment)
  return fragment
}

function createWindow(document: MiniDocument): MiniWindow {
  const localStorage = new MiniStorage()
  const sessionStorage = new MiniStorage()
  const window: MiniWindow = {
    window: undefined as unknown as MiniWindow,
    document,
    Node: MiniNode,
    Element: MiniElement,
    HTMLElement: MiniHTMLElement,
    HTMLSlotElement: MiniHTMLSlotElement,
    DocumentFragment: MiniDocumentFragment,
    HTMLTemplateElement: MiniHTMLTemplateElement,
    CustomEvent: MiniCustomEvent,
    Event: MiniEvent,
    MouseEvent: MiniMouseEvent,
    Comment: MiniComment,
    Text: MiniText,
    CSS: { escape: cssEscape },
    localStorage,
    sessionStorage,
  }
  window.window = window
  return window
}

class MiniNode {
  static ELEMENT_NODE = NodeType.ELEMENT_NODE
  static TEXT_NODE = NodeType.TEXT_NODE
  static COMMENT_NODE = NodeType.COMMENT_NODE
  static DOCUMENT_NODE = NodeType.DOCUMENT_NODE
  static DOCUMENT_FRAGMENT_NODE = NodeType.DOCUMENT_FRAGMENT_NODE

  nodeType: NodeType
  parentNode: MiniNode | null = null
  _ownerDocument: MiniDocument | null = null
  childNodes: MiniNode[] = []
  private listeners?: Map<string, Set<(event: MiniEvent) => void>>

  constructor(type: NodeType) {
    this.nodeType = type
  }

  get nextSibling(): MiniNode | null {
    if (!this.parentNode) return null
    const siblings = this.parentNode.childNodes
    const index = siblings.indexOf(this)
    return index >= 0 ? (siblings[index + 1] ?? null) : null
  }

  get parentElement(): MiniElement | null {
    return this.parentNode instanceof MiniElement ? this.parentNode : null
  }

  get firstChild(): MiniNode | null {
    return this.childNodes[0] ?? null
  }

  get firstElementChild(): MiniElement | null {
    for (const child of this.childNodes) {
      if (child instanceof MiniElement) return child
    }
    return null
  }

  get lastChild(): MiniNode | null {
    return this.childNodes[this.childNodes.length - 1] ?? null
  }

  get lastElementChild(): MiniElement | null {
    for (let i = this.childNodes.length - 1; i >= 0; i -= 1) {
      const child = this.childNodes[i]
      if (child instanceof MiniElement) return child
    }
    return null
  }

  get ownerDocument(): MiniDocument | null {
    if (this instanceof MiniDocument) return this
    if (this._ownerDocument) return this._ownerDocument
    let node: MiniNode | null = this.parentNode
    while (node) {
      if (node instanceof MiniDocument) return node
      if (node._ownerDocument) return node._ownerDocument
      node = node.parentNode
    }
    return null
  }

  get previousSibling(): MiniNode | null {
    if (!this.parentNode) return null
    const siblings = this.parentNode.childNodes
    const index = siblings.indexOf(this)
    return index > 0 ? (siblings[index - 1] ?? null) : null
  }

  appendChild(node: MiniNode): MiniNode {
    return insertNode(this, node, null)
  }

  insertBefore(node: MiniNode, ref: MiniNode | null): MiniNode {
    return insertNode(this, node, ref)
  }

  removeChild(node: MiniNode) {
    const index = this.childNodes.indexOf(node)
    if (index === -1) return node
    this.childNodes.splice(index, 1)
    node.parentNode = null
    return node
  }

  replaceChildren(...nodes: MiniNode[]) {
    for (const child of [...this.childNodes]) {
      this.removeChild(child)
    }
    for (const node of nodes) {
      this.appendChild(node)
    }
  }

  remove() {
    this.parentNode?.removeChild(this)
  }

  replaceWith(...nodes: MiniNode[]) {
    const parent = this.parentNode
    if (!parent) return
    const ref = this.nextSibling
    parent.removeChild(this)
    for (const node of nodes) {
      parent.insertBefore(node, ref)
    }
  }

  contains(node: MiniNode | null): boolean {
    if (!node) return false
    let current: MiniNode | null = node
    while (current) {
      if (current === this) return true
      current = current.parentNode
    }
    return false
  }

  cloneNode(deep?: boolean): MiniNode {
    void deep
    return new MiniNode(this.nodeType)
  }

  get textContent(): string {
    return ''
  }

  set textContent(_value: string) {
    this.replaceChildren()
  }

  addEventListener(type: string, listener: (...args: unknown[]) => void): void {
    if (!type || !listener) return
    const normalizedType = String(type).toLowerCase()
    if (!this.listeners) this.listeners = new Map()
    let bucket = this.listeners.get(normalizedType)
    if (!bucket) {
      bucket = new Set()
      this.listeners.set(normalizedType, bucket)
    }
    bucket.add(listener as (event: MiniEvent) => void)
  }

  removeEventListener(
    type: string,
    listener: (...args: unknown[]) => void,
  ): void {
    if (!type || !listener || !this.listeners) return
    const normalizedType = String(type).toLowerCase()
    const bucket = this.listeners.get(normalizedType)
    if (!bucket) return
    bucket.delete(listener as (event: MiniEvent) => void)
    if (bucket.size === 0) this.listeners.delete(normalizedType)
    if (this.listeners.size === 0) this.listeners = undefined
  }

  dispatchEvent(event: MiniEvent): boolean {
    if (!event || !event.type) return true
    if (!event.target) event.target = this
    const normalizedType = event.type.toLowerCase()
    this.dispatchToListeners(normalizedType, event)
    if (!event.bubbles || event.propagationStopped)
      return !event.defaultPrevented

    let cursor = this.parentNode
    let hasAncestorListeners = false
    while (cursor) {
      if (cursor.hasListenersForType(normalizedType)) {
        hasAncestorListeners = true
        break
      }
      cursor = cursor.parentNode
    }
    if (!hasAncestorListeners) return !event.defaultPrevented

    cursor = this.parentNode
    while (cursor) {
      cursor.dispatchToListeners(normalizedType, event)
      if (event.propagationStopped) break
      cursor = cursor.parentNode
    }
    return !event.defaultPrevented
  }

  private hasListenersForType(type: string): boolean {
    const bucket = this.listeners?.get(type)
    return !!bucket && bucket.size > 0
  }

  private dispatchToListeners(type: string, event: MiniEvent): void {
    const bucket = this.listeners?.get(type)
    if (!bucket || bucket.size === 0) return
    event.currentTarget = this
    for (const listener of [...bucket]) {
      listener(event)
      if (event.immediatePropagationStopped) break
    }
  }

  get innerText(): string {
    return this.textContent
  }

  set innerText(value: string) {
    this.textContent = value
  }
}

class MiniDocument extends MiniNode {
  documentElement: MiniElement | null = null
  body: MiniElement | null = null

  constructor() {
    super(NodeType.DOCUMENT_NODE)
  }

  createElement(tagName: string) {
    const lower = tagName.toLowerCase()
    const el =
      lower === 'template'
        ? new MiniHTMLTemplateElement()
        : lower === 'slot'
          ? new MiniHTMLSlotElement()
          : new MiniHTMLElement(tagName)
    el._ownerDocument = this
    if (el instanceof MiniHTMLTemplateElement) {
      el.content._ownerDocument = this
    }
    return el
  }

  createElementNS(namespace: string, tagName: string) {
    const el = new MiniHTMLElement(tagName)
    el.namespaceURI = namespace
    el._ownerDocument = this
    return el
  }

  createTextNode(data: string) {
    const node = new MiniText(data)
    node._ownerDocument = this
    return node
  }

  createComment(data: string) {
    const node = new MiniComment(data)
    node._ownerDocument = this
    return node
  }

  createDocumentFragment() {
    const node = new MiniDocumentFragment()
    node._ownerDocument = this
    return node
  }

  createRange() {
    return {
      setStart() {},
      setEnd() {},
      collapse() {},
      selectNodeContents() {},
      createContextualFragment: (html: string) =>
        parseMiniDocumentFragment(html, this),
    }
  }

  querySelector(selector: string): MiniElement | null {
    return querySelectorFrom(this, selector, true)
  }

  querySelectorAll(selector: string): MiniElement[] {
    return querySelectorAllFrom(this, selector)
  }

  linkHtmlBody() {
    const html = this.querySelector('html')
    if (html && html instanceof MiniElement) {
      this.documentElement = html
      const body = html.querySelector('body')
      if (body && body instanceof MiniElement) {
        this.body = body
      }
    }
    if (!this.body) {
      const body = this.querySelector('body')
      if (body && body instanceof MiniElement) {
        this.body = body
      }
    }
  }

  override cloneNode(deep?: boolean): MiniNode {
    const clone = new MiniDocument()
    if (deep) {
      cloneChildNodesTo(clone, this.childNodes)
      clone.linkHtmlBody()
    }
    return clone
  }
}

class MiniDocumentFragment extends MiniNode {
  constructor() {
    super(NodeType.DOCUMENT_FRAGMENT_NODE)
  }

  querySelector(selector: string): MiniElement | null {
    return querySelectorFrom(this, selector, true)
  }

  querySelectorAll(selector: string): MiniElement[] {
    return querySelectorAllFrom(this, selector)
  }

  override cloneNode(deep?: boolean): MiniNode {
    const clone = new MiniDocumentFragment()
    if (deep) {
      cloneChildNodesTo(clone, this.childNodes)
    }
    return clone
  }
}

type MiniAttr = {
  name: string
  value: string
}

type MiniNamedNodeMap = {
  readonly length: number
  item: (index: number) => MiniAttr | null
  [Symbol.iterator]: () => Iterator<MiniAttr>
}

class MiniNamedNodeMapImpl implements MiniNamedNodeMap {
  __map: Map<string, string>
  __entries: MiniAttr[] = []
  __dirty = true

  constructor(attributeMap: Map<string, string>) {
    this.__map = attributeMap
  }

  invalidate(): void {
    this.__dirty = true
  }

  private refresh(): void {
    if (!this.__dirty) return
    this.__entries.length = 0
    for (const [name, value] of this.__map.entries()) {
      this.__entries.push({ name, value })
    }
    this.__dirty = false
  }

  get length() {
    return this.__map.size
  }

  item(index: number): MiniAttr | null {
    this.refresh()
    return this.__entries[index] ?? null
  }

  *[Symbol.iterator](): Iterator<MiniAttr> {
    this.refresh()
    for (let i = 0; i < this.__entries.length; ++i) {
      yield this.__entries[i]
    }
  }
}

class MiniElement extends MiniNode {
  tagName: string
  private __cachedTagNameLower?: string
  namespaceURI: string | null = null
  private attributeMap = new Map<string, string>()
  private _attributes?: MiniNamedNodeMap
  private syncingStyleFromAttribute = false
  private syncingStyleToAttribute = false
  private internalValue = ''
  private internalChecked = false
  private internalSelected = false
  private _classList?: ClassList
  private _style?: StyleDeclaration

  constructor(tagName: string) {
    super(NodeType.ELEMENT_NODE)
    this.tagName = tagName.toUpperCase()
  }

  get __tagNameLower(): string {
    let lower = this.__cachedTagNameLower
    if (lower === undefined) {
      lower = this.tagName.toLowerCase()
      this.__cachedTagNameLower = lower
    }
    return lower
  }

  isTagNameLower(lowerTagName: string): boolean {
    return this.__tagNameLower === lowerTagName
  }

  get attributes(): MiniNamedNodeMap {
    if (!this._attributes) {
      this._attributes = new MiniNamedNodeMapImpl(this.attributeMap)
    }
    return this._attributes
  }

  private invalidateAttributes(): void {
    ;(this._attributes as MiniNamedNodeMapImpl | undefined)?.invalidate()
  }

  get classList(): ClassList {
    if (!this._classList) this._classList = new ClassList(this)
    return this._classList
  }

  get style(): StyleDeclaration {
    if (!this._style) {
      this._style = createStyleDeclaration((cssText) =>
        this.syncStyleAttribute(cssText),
      ) as StyleDeclaration
    }
    return this._style
  }

  getAttribute(name: string) {
    const key = name.toLowerCase()
    const value = this.attributeMap.get(key)
    return value === undefined ? null : value
  }

  setAttribute(name: string, value: string) {
    const key = name.toLowerCase()
    const normalized = value == null ? '' : String(value)
    if (key === 'style') {
      if (this.syncingStyleToAttribute) {
        const previous = this.attributeMap.get(key)
        if (previous === normalized) return
        this.attributeMap.set(key, normalized)
        this.invalidateAttributes()
        return
      }
      this.syncingStyleFromAttribute = true
      this.style.cssText = normalized
      this.syncingStyleFromAttribute = false
      const cssText = this.style.cssText
      if (cssText.length > 0) {
        const previous = this.attributeMap.get('style')
        if (previous !== cssText) {
          this.attributeMap.set('style', cssText)
          this.invalidateAttributes()
        }
      } else {
        if (this.attributeMap.delete('style')) this.invalidateAttributes()
      }
      return
    }
    const previous = this.attributeMap.get(key)
    if (previous === normalized) return
    this.attributeMap.set(key, normalized)
    this.invalidateAttributes()
    if (key === 'value') this.internalValue = normalized
    if (key === 'checked') this.internalChecked = true
    if (key === 'selected') this.internalSelected = true
  }

  removeAttribute(name: string) {
    const key = name.toLowerCase()
    if (key === 'style') {
      if (this.syncingStyleToAttribute) {
        if (this.attributeMap.delete(key)) this.invalidateAttributes()
        return
      }
      this.syncingStyleFromAttribute = true
      this.style.cssText = ''
      this.syncingStyleFromAttribute = false
      if (this.attributeMap.delete('style')) this.invalidateAttributes()
      return
    }
    if (this.attributeMap.delete(key)) this.invalidateAttributes()
    if (key === 'checked') this.internalChecked = false
    if (key === 'selected') this.internalSelected = false
  }

  private syncStyleAttribute(cssText: string) {
    if (this.syncingStyleFromAttribute) return
    this.syncingStyleToAttribute = true
    if (cssText.length > 0) {
      const previous = this.attributeMap.get('style')
      if (previous !== cssText) {
        this.attributeMap.set('style', cssText)
        this.invalidateAttributes()
      }
    } else {
      if (this.attributeMap.delete('style')) this.invalidateAttributes()
    }
    this.syncingStyleToAttribute = false
  }

  private resolveNsAttributeName(ns: string, name: string): string {
    const normalized = String(name ?? '').toLowerCase()
    if (normalized.includes(':')) return normalized

    // Minimal namespace support for SVG xlink usage.
    if (ns === 'http://www.w3.org/1999/xlink') return `xlink:${normalized}`
    return normalized
  }

  getAttributeNS(ns: string, name: string) {
    const resolved = this.resolveNsAttributeName(ns, name)
    const value = this.getAttribute(resolved)
    if (value != null) return value
    return this.getAttribute(name)
  }

  setAttributeNS(ns: string, name: string, value: string) {
    this.setAttribute(this.resolveNsAttributeName(ns, name), value)
  }

  removeAttributeNS(ns: string, name: string) {
    const resolved = this.resolveNsAttributeName(ns, name)
    this.removeAttribute(resolved)
    if (resolved !== name) this.removeAttribute(name)
  }

  hasAttribute(name: string) {
    return this.attributeMap.has(name.toLowerCase())
  }

  getAttributeNames() {
    return [...this.attributeMap.keys()]
  }

  get className() {
    return this.getAttribute('class') ?? ''
  }

  set className(value: string) {
    if (!value) {
      this.removeAttribute('class')
      return
    }
    this.setAttribute('class', String(value))
  }

  get id(): string {
    return this.getAttribute('id') ?? ''
  }

  set id(value: string) {
    if (!value) {
      this.removeAttribute('id')
      return
    }
    this.setAttribute('id', String(value))
  }

  get type(): string {
    return this.getAttribute('type') ?? ''
  }

  set type(value: string) {
    if (!value) this.removeAttribute('type')
    else this.setAttribute('type', String(value))
  }

  get width(): number {
    const value = this.getAttribute('width')
    if (value == null || value === '') return 0
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  set width(value: number) {
    if (value == null || Number.isNaN(value)) {
      this.removeAttribute('width')
      return
    }
    this.setAttribute('width', String(value))
  }

  get value(): string {
    if (this.tagName === 'OPTION') {
      const attrValue = this.getAttribute('value')
      if (attrValue != null) return attrValue
      return this.textContent
    }
    return this.internalValue
  }

  set value(value: unknown) {
    this.internalValue = value == null ? '' : String(value)
    if (this.tagName === 'OPTION')
      this.setAttribute('value', this.internalValue)
  }

  get checked(): boolean {
    return this.internalChecked
  }

  set checked(value: boolean) {
    this.internalChecked = !!value
    if (this.internalChecked) this.attributeMap.set('checked', '')
    else this.attributeMap.delete('checked')
  }

  get selected(): boolean {
    return this.internalSelected
  }

  set selected(value: boolean) {
    this.internalSelected = !!value
    if (this.internalSelected) this.attributeMap.set('selected', '')
    else this.attributeMap.delete('selected')
  }

  get multiple(): boolean {
    return this.hasAttribute('multiple')
  }

  set multiple(value: boolean) {
    if (value) this.setAttribute('multiple', '')
    else this.removeAttribute('multiple')
  }

  get options(): MiniElement[] {
    if (this.tagName !== 'SELECT') return []
    return this.querySelectorAll('option')
  }

  get selectedIndex(): number {
    const options = this.options
    for (let i = 0; i < options.length; i += 1) {
      if ((options[i] as MiniElement).selected) return i
    }
    return -1
  }

  set selectedIndex(value: number) {
    const options = this.options
    for (let i = 0; i < options.length; i += 1) {
      ;(options[i] as MiniElement).selected = i === value
    }
  }

  get nextElementSibling(): MiniElement | null {
    if (!this.parentNode) return null
    const siblings = this.parentNode.childNodes
    const index = siblings.indexOf(this)
    for (let i = index + 1; i < siblings.length; i += 1) {
      const node = siblings[i]
      if (node instanceof MiniElement) return node
    }
    return null
  }

  get previousElementSibling(): MiniElement | null {
    if (!this.parentNode) return null
    const siblings = this.parentNode.childNodes
    const index = siblings.indexOf(this)
    for (let i = index - 1; i >= 0; i -= 1) {
      const node = siblings[i]
      if (node instanceof MiniElement) return node
    }
    return null
  }

  get innerHTML(): string {
    return this.childNodes.map((node) => serializeNode(node)).join('')
  }

  set innerHTML(value: string) {
    const doc = this.ownerDocument ?? new MiniDocument()
    const fragment = parseMiniDocumentFragment(value, doc)
    this.replaceChildren(...fragment.childNodes)
  }

  get outerHTML(): string {
    return serializeNode(this)
  }

  override get textContent(): string {
    return collectTextContent(this)
  }

  override set textContent(value: string) {
    this.replaceChildren()
    if (value != null && value !== '') {
      const doc = this.ownerDocument ?? new MiniDocument()
      this.appendChild(doc.createTextNode(String(value)))
    }
  }

  querySelector(selector: string): MiniElement | null {
    return querySelectorFrom(this, selector, true)
  }

  querySelectorAll(selector: string): MiniElement[] {
    return querySelectorAllFrom(this, selector)
  }

  get children(): MiniElement[] {
    return this.childNodes.filter(
      (child): child is MiniElement => child instanceof MiniElement,
    )
  }

  matches(selector: string) {
    const compiledSelectors = getCompiledSelectors(selector)
    for (const compiled of compiledSelectors) {
      if (matchesCompiledSelector(this, compiled)) return true
    }
    return false
  }

  click(): void {
    this.dispatchEvent(
      new MiniMouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button: 0,
      }),
    )
  }

  override cloneNode(deep?: boolean): MiniNode {
    if (this instanceof MiniHTMLTemplateElement) {
      const clone = new MiniHTMLTemplateElement()
      clone._ownerDocument = this.ownerDocument
      clone.content._ownerDocument = clone._ownerDocument
      copyElementAttributes(this, clone)
      if (deep) {
        cloneChildNodesTo(clone.content, this.content.childNodes)
      }
      return clone
    }
    const clone = this.isTagNameLower('slot')
      ? new MiniHTMLSlotElement()
      : new MiniHTMLElement(this.tagName)
    clone.namespaceURI = this.namespaceURI
    clone._ownerDocument = this.ownerDocument
    copyElementAttributes(this, clone)
    if (deep) {
      cloneChildNodesTo(clone, this.childNodes)
    }
    return clone
  }
}

class MiniHTMLElement extends MiniElement {}

class MiniHTMLTemplateElement extends MiniHTMLElement {
  content: MiniDocumentFragment

  constructor() {
    super('template')
    this.content = new MiniDocumentFragment()
    this.childNodes = this.content.childNodes
  }

  override cloneNode(deep?: boolean): MiniNode {
    const clone = new MiniHTMLTemplateElement()
    clone._ownerDocument = this.ownerDocument
    clone.content._ownerDocument = clone._ownerDocument
    copyElementAttributes(this, clone)
    if (deep) {
      cloneChildNodesTo(clone.content, this.content.childNodes)
    }
    return clone
  }
}

class MiniHTMLSlotElement extends MiniHTMLElement {
  constructor() {
    super('slot')
  }

  get name(): string {
    return this.getAttribute('name') ?? ''
  }

  set name(value: string) {
    if (!value) {
      this.removeAttribute('name')
      return
    }
    this.setAttribute('name', value)
  }
}

class MiniText extends MiniNode {
  data: string

  constructor(data: string) {
    super(NodeType.TEXT_NODE)
    this.data = data
  }

  override get textContent(): string {
    return this.data
  }

  override set textContent(value: string) {
    this.data = value ?? ''
  }

  override cloneNode(): MiniNode {
    return new MiniText(this.data)
  }
}

class MiniComment extends MiniNode {
  data: string

  constructor(data: string) {
    super(NodeType.COMMENT_NODE)
    this.data = data
  }

  override get textContent(): string {
    return this.data
  }

  override set textContent(value: string) {
    this.data = value ?? ''
  }

  override cloneNode(): MiniNode {
    return new MiniComment(this.data)
  }
}

class MiniEvent {
  type: string
  bubbles: boolean
  cancelable: boolean
  defaultPrevented: boolean
  target: MiniNode | null
  currentTarget: MiniNode | null
  propagationStopped: boolean
  immediatePropagationStopped: boolean

  constructor(
    type: string,
    init?: {
      bubbles?: boolean
      cancelable?: boolean
    },
  ) {
    this.type = type
    this.bubbles = !!init?.bubbles
    this.cancelable = !!init?.cancelable
    this.defaultPrevented = false
    this.target = null
    this.currentTarget = null
    this.propagationStopped = false
    this.immediatePropagationStopped = false
  }

  preventDefault(): void {
    if (this.cancelable) this.defaultPrevented = true
  }

  stopPropagation(): void {
    this.propagationStopped = true
  }

  stopImmediatePropagation(): void {
    this.immediatePropagationStopped = true
    this.propagationStopped = true
  }
}

class MiniCustomEvent extends MiniEvent {
  detail: unknown
  constructor(
    type: string,
    init?:
      | { detail?: unknown; bubbles?: boolean; cancelable?: boolean }
      | unknown,
  ) {
    if (init && typeof init === 'object' && !Array.isArray(init)) {
      const obj = init as {
        detail?: unknown
        bubbles?: boolean
        cancelable?: boolean
      }
      super(type, { bubbles: obj.bubbles, cancelable: obj.cancelable })
      this.detail = obj.detail
      return
    }
    super(type)
    this.detail = init
  }
}

class MiniMouseEvent extends MiniEvent {
  button: number
  constructor(
    type: string,
    init?: { button?: number; bubbles?: boolean; cancelable?: boolean },
  ) {
    super(type, init)
    this.button = init?.button ?? 0
  }
}

class MiniStorage {
  private map = new Map<string, string>()

  get length(): number {
    return this.map.size
  }

  clear(): void {
    this.map.clear()
  }

  getItem(key: string): string | null {
    return this.map.get(String(key)) ?? null
  }

  key(index: number): string | null {
    if (index < 0 || index >= this.map.size) return null
    return [...this.map.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.map.delete(String(key))
  }

  setItem(key: string, value: string): void {
    this.map.set(String(key), String(value))
  }
}

class ClassList {
  private el: MiniElement
  constructor(el: MiniElement) {
    this.el = el
  }

  private getTokens() {
    const raw = this.el.getAttribute('class') ?? ''
    return raw.split(/\s+/).filter(Boolean)
  }

  private setTokens(tokens: string[]) {
    if (tokens.length === 0) {
      this.el.removeAttribute('class')
      return
    }
    this.el.setAttribute('class', tokens.join(' '))
  }

  add(...tokens: string[]) {
    const current = new Set(this.getTokens())
    for (const token of tokens) {
      if (token) current.add(token)
    }
    this.setTokens([...current])
  }

  remove(...tokens: string[]) {
    const current = new Set(this.getTokens())
    for (const token of tokens) {
      current.delete(token)
    }
    this.setTokens([...current])
  }

  contains(token: string) {
    return this.getTokens().includes(token)
  }

  get length() {
    return this.getTokens().length
  }
}

type StyleMap = Record<string, string>
const STYLE_INDEX_PATTERN = /^\d+$/
const stylePropertyNameCache: Record<string, string> = Object.create(null)
type StyleDeclarationCore = {
  cssText: string
  readonly length: number
  item(index: number): string
  [Symbol.iterator](): IterableIterator<string>
  setProperty(name: string, value: string, priority?: string): void
  removeProperty(name: string): string
  getPropertyValue(name: string): string
}

function createStyleDeclaration(onChange?: (cssText: string) => void) {
  const state: StyleMap = {}
  const notify = () => {
    onChange?.(serializeStyleMap(state))
  }
  const api: StyleDeclarationCore = {
    get cssText() {
      return serializeStyleMap(state)
    },
    set cssText(value: string) {
      const next = parseStyleText(value)
      if (!replaceStyleState(state, next)) return
      notify()
    },
    get length() {
      return Object.keys(state).length
    },
    item(index: number) {
      if (!Number.isFinite(index) || index < 0) return ''
      return Object.keys(state)[Math.floor(index)] ?? ''
    },
    [Symbol.iterator]() {
      return Object.keys(state)[Symbol.iterator]()
    },
    setProperty(name: string, value: string, priority?: string) {
      if (!setNormalizedStyleProperty(state, name, value, priority)) return
      notify()
    },
    removeProperty(name: string) {
      const key = normalizeStylePropertyName(name)
      if (!key) return ''
      const previous = state[key] ?? ''
      if (previous.length === 0) return ''
      delete state[key]
      notify()
      return previous
    },
    getPropertyValue(name: string) {
      const key = normalizeStylePropertyName(name)
      if (!key) return ''
      return state[key] ?? ''
    },
  }

  return new Proxy(api, {
    get(target, prop, receiver) {
      if (typeof prop === 'string') {
        if (STYLE_INDEX_PATTERN.test(prop)) {
          return target.item(Number.parseInt(prop, 10))
        }
        if (prop in target) return Reflect.get(target, prop, receiver)
        const key = normalizeStylePropertyName(prop)
        if (key && key in state) return state[key]
        if (key) return ''
      }
      return Reflect.get(target, prop, receiver)
    },
    set(target, prop, value, receiver) {
      if (typeof prop === 'string') {
        if (prop in target) {
          return Reflect.set(target, prop, value, receiver)
        }
        if (STYLE_INDEX_PATTERN.test(prop)) return true
        if (!setNormalizedStyleProperty(state, prop, value)) return true
        notify()
        return true
      }
      return Reflect.set(target, prop, value, receiver)
    },
  })
}

function setNormalizedStyleProperty(
  state: StyleMap,
  name: string,
  value: unknown,
  priority?: string,
): boolean {
  const key = normalizeStylePropertyName(name)
  if (!key) return false
  const normalized = normalizeStyleValue(value, priority)
  if ((state[key] ?? '') === normalized) return false
  if (normalized.length === 0) {
    delete state[key]
  } else {
    state[key] = normalized
  }
  return true
}

function normalizeStylePropertyName(name: string): string {
  const key = String(name ?? '')
  const cached = stylePropertyNameCache[key]
  if (cached !== undefined) return cached
  const trimmed = key.trim()
  if (trimmed.length === 0) return ''
  let normalized = ''
  if (trimmed.startsWith('--')) normalized = trimmed
  else if (trimmed.includes('-')) normalized = trimmed.toLowerCase()
  else
    normalized = trimmed.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)
  stylePropertyNameCache[key] = normalized
  return normalized
}

function normalizeStyleValue(value: unknown, priority?: string): string {
  const normalized = value == null ? '' : String(value).trim()
  if (normalized.length === 0) return ''
  if (priority === 'important' && !/\s!important$/i.test(normalized)) {
    return `${normalized} !important`
  }
  return normalized
}

function parseStyleText(value: string): StyleMap {
  const next: StyleMap = {}
  const parts = String(value ?? '').split(';')
  for (const part of parts) {
    const normalized = part.trim()
    if (normalized.length === 0) continue
    const separator = normalized.indexOf(':')
    if (separator === -1) continue
    const key = normalizeStylePropertyName(normalized.slice(0, separator))
    if (!key) continue
    next[key] = normalized.slice(separator + 1).trim()
  }
  return next
}

function serializeStyleMap(state: StyleMap): string {
  const entries = Object.entries(state)
  if (entries.length === 0) return ''
  return entries.map(([key, value]) => `${key}: ${value}`).join('; ')
}

function replaceStyleState(state: StyleMap, next: StyleMap): boolean {
  const currentKeys = Object.keys(state)
  const nextKeys = Object.keys(next)
  if (currentKeys.length === nextKeys.length) {
    let same = true
    for (const key of nextKeys) {
      if (state[key] !== next[key]) {
        same = false
        break
      }
    }
    if (same) return false
  }
  for (const key of currentKeys) delete state[key]
  for (const key of nextKeys) state[key] = next[key]
  return true
}

type StyleDeclaration = ReturnType<typeof createStyleDeclaration> &
  HTMLElement['style']

function cloneChildNodesTo(target: MiniNode, nodes: MiniNode[]) {
  for (const child of nodes) {
    target.appendChild(child.cloneNode(true))
  }
}

function copyElementAttributes(source: MiniElement, target: MiniElement) {
  for (const name of source.getAttributeNames()) {
    target.setAttribute(name, source.getAttribute(name) ?? '')
  }
}

function insertNode(
  parent: MiniNode,
  node: MiniNode,
  ref: MiniNode | null,
): MiniNode {
  if (node instanceof MiniDocumentFragment) {
    const children = [...node.childNodes]
    node.replaceChildren()
    for (const child of children) {
      insertNode(parent, child, ref)
    }
    return node
  }

  if (node.childNodes.length > 0) {
    let cursor: MiniNode | null = parent
    while (cursor) {
      if (cursor === node) {
        throw new Error('Cannot insert an ancestor into its descendant')
      }
      cursor = cursor.parentNode
    }
  }

  if (node.parentNode) {
    node.parentNode.removeChild(node)
  }
  const index = ref ? parent.childNodes.indexOf(ref) : -1
  if (ref != null && index === -1) {
    throw new Error('Reference node is not a child of this parent')
  }
  if (ref == null) {
    parent.childNodes.push(node)
  } else {
    parent.childNodes.splice(index, 0, node)
  }
  node.parentNode = parent
  if (!node._ownerDocument && parent instanceof MiniDocument) {
    node._ownerDocument = parent
  } else if (!node._ownerDocument && parent._ownerDocument) {
    node._ownerDocument = parent._ownerDocument
  }
  return node
}

function parseInto(
  html: string,
  document: MiniDocument,
  root: MiniNode,
  inRawText = false,
) {
  let index = 0
  const stack: ParseStackEntry[] = [{ node: root, container: root }]

  while (index < html.length) {
    if (inRawText) {
      appendText(currentContainer(stack, root), html.slice(index), document)
      break
    }
    const lt = html.indexOf('<', index)
    if (lt === -1) {
      const text = html.slice(index)
      appendText(currentContainer(stack, root), text, document)
      break
    }
    if (lt > index) {
      appendText(currentContainer(stack, root), html.slice(index, lt), document)
      index = lt
    }

    const next = parseTagLikeAt({
      html,
      index,
      stack,
      root,
      document,
    })
    if (next !== null) {
      index = next
      continue
    }

    index += 1
  }
}

type ParseStackEntry = { node: MiniNode; container: MiniNode }

type ParseTagLikeInput = {
  html: string
  index: number
  stack: ParseStackEntry[]
  root: MiniNode
  document: MiniDocument
}

function parseTagLikeAt(input: ParseTagLikeInput): number | null {
  const { html, index, stack, root, document } = input
  const comment = parseCommentTag(
    html,
    index,
    currentContainer(stack, root),
    document,
  )
  if (comment !== null) return comment

  const doctype = parseDoctypeTag(html, index)
  if (doctype !== null) return doctype

  if (html[index + 1] === '/') {
    return parseClosingTag(html, index, stack)
  }
  return parseOpeningTag(html, index, stack, root, document)
}

function currentContainer(stack: ParseStackEntry[], root: MiniNode): MiniNode {
  return stack[stack.length - 1]?.container ?? root
}

function parseCommentTag(
  html: string,
  index: number,
  parent: MiniNode,
  document: MiniDocument,
): number | null {
  if (!html.startsWith('<!--', index)) return null
  const end = html.indexOf('-->', index + 4)
  const content =
    end === -1 ? html.slice(index + 4) : html.slice(index + 4, end)
  parent.appendChild(document.createComment(content))
  return end === -1 ? html.length : end + 3
}

function parseDoctypeTag(html: string, index: number): number | null {
  if (
    !html.startsWith('<!DOCTYPE', index) &&
    !html.startsWith('<!doctype', index)
  ) {
    return null
  }
  const end = html.indexOf('>', index + 2)
  return end === -1 ? html.length : end + 1
}

function parseClosingTag(
  html: string,
  index: number,
  stack: ParseStackEntry[],
): number {
  const closeEnd = html.indexOf('>', index + 2)
  const tagName = html
    .slice(index + 2, closeEnd === -1 ? html.length : closeEnd)
    .trim()
    .toLowerCase()
  for (let i = stack.length - 1; i > 0; i -= 1) {
    const node = stack[i].node
    if (!(node instanceof MiniElement)) continue
    stack.pop()
    if (node.isTagNameLower(tagName)) break
  }
  return closeEnd === -1 ? html.length : closeEnd + 1
}

function parseOpeningTag(
  html: string,
  index: number,
  stack: ParseStackEntry[],
  root: MiniNode,
  document: MiniDocument,
): number | null {
  const tagMatch = /^<\s*([a-zA-Z0-9:_-]+)/.exec(html.slice(index))
  if (!tagMatch) return null

  const tagName = tagMatch[1].toLowerCase()
  const start = index + tagMatch[0].length
  const { attrs, end, selfClosing } = parseAttributes(html, start)
  const element = document.createElement(tagName)
  for (const [key, value] of attrs.entries()) {
    element.setAttribute(key, value)
  }
  currentContainer(stack, root).appendChild(element)

  if (selfClosing || VOID_ELEMENTS.has(tagName)) return end
  if (RAW_TEXT_ELEMENTS.has(tagName)) {
    return parseRawTextContent(html, end, tagName, element, document)
  }

  if (element instanceof MiniHTMLTemplateElement) {
    stack.push({ node: element, container: element.content })
  } else {
    stack.push({ node: element, container: element })
  }
  return end
}

function parseRawTextContent(
  html: string,
  index: number,
  tagName: string,
  element: MiniElement,
  document: MiniDocument,
): number {
  const close = html.toLowerCase().indexOf(`</${tagName}`, index)
  const rawText = close === -1 ? html.slice(index) : html.slice(index, close)
  appendText(element, rawText, document)
  if (close === -1) return html.length
  const closeEnd = html.indexOf('>', close + tagName.length + 2)
  return closeEnd === -1 ? html.length : closeEnd + 1
}

function appendText(parent: MiniNode, text: string, document: MiniDocument) {
  if (!text) return
  if (RAW_TEXT_ELEMENTS.has((parent as MiniElement).tagName?.toLowerCase?.())) {
    parent.appendChild(document.createTextNode(text))
    return
  }
  const decoded = decodeEntities(text)
  parent.appendChild(document.createTextNode(decoded))
}

function parseAttributes(input: string, start: number) {
  const attrs = new Map<string, string>()
  let i = start
  let selfClosing = false
  while (i < input.length) {
    const ch = input[i]
    if (ch === '>') {
      i += 1
      break
    }
    if (ch === '/' && input[i + 1] === '>') {
      selfClosing = true
      i += 2
      break
    }
    if (/\s/.test(ch)) {
      i += 1
      continue
    }
    const nameStart = i
    while (i < input.length && /[^\s=/>]/.test(input[i])) i += 1
    const name = input.slice(nameStart, i).toLowerCase()
    while (i < input.length && /\s/.test(input[i])) i += 1
    let value = ''
    if (input[i] === '=') {
      i += 1
      while (i < input.length && /\s/.test(input[i])) i += 1
      const quote = input[i]
      if (quote === '"' || quote === "'") {
        i += 1
        const endQuote = input.indexOf(quote, i)
        const raw = input.slice(i, endQuote === -1 ? input.length : endQuote)
        value = decodeEntities(raw)
        i = endQuote === -1 ? input.length : endQuote + 1
      } else {
        const valueStart = i
        while (i < input.length && /[^\s>/]/.test(input[i])) i += 1
        value = decodeEntities(input.slice(valueStart, i))
        if (input[i] === '/' && input[i + 1] === '>') {
          selfClosing = true
          i += 2
          attrs.set(name, value)
          break
        }
      }
    }
    if (nameStart === i) {
      i += 1
      continue
    }
    attrs.set(name, value)
  }
  return { attrs, end: i, selfClosing }
}

function decodeEntities(value: string) {
  const safeCodePoint = (code: number) => {
    if (!Number.isFinite(code)) return '\uFFFD'
    if (code < 0 || code > 0x10ffff) return '\uFFFD'
    return String.fromCodePoint(code)
  }
  return value
    .replace(/&#x([0-9a-fA-F]+);?/g, (_, hex: string) =>
      safeCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#([0-9]+);?/g, (_, dec: string) =>
      safeCodePoint(Number.parseInt(dec, 10)),
    )
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function escapeText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function collectTextContent(node: MiniNode): string {
  if (node instanceof MiniText) return node.data
  if (node instanceof MiniComment) return ''
  if (node instanceof MiniHTMLTemplateElement) {
    return node.content.childNodes
      .map((child) => collectTextContent(child))
      .join('')
  }
  return node.childNodes.map((child) => collectTextContent(child)).join('')
}

function escapeAttribute(value: string) {
  return escapeText(value).replace(/"/g, '&quot;')
}

function serializeNode(node: MiniNode, rawText = false): string {
  if (node instanceof MiniText)
    return rawText ? node.data : escapeText(node.data)
  if (node instanceof MiniComment) return `<!--${node.data}-->`
  if (node instanceof MiniDocumentFragment || node instanceof MiniDocument) {
    return node.childNodes.map((child) => serializeNode(child)).join('')
  }
  if (node instanceof MiniHTMLTemplateElement) {
    const attrs = serializeAttributes(node)
    const content = node.content.childNodes
      .map((child) => serializeNode(child))
      .join('')
    return `<template${attrs}>${content}</template>`
  }
  if (node instanceof MiniElement) {
    const tag = node.__tagNameLower
    const attrs = serializeAttributes(node)
    const isRaw = RAW_TEXT_ELEMENTS.has(tag)
    const children = node.childNodes
      .map((child) => serializeNode(child, isRaw))
      .join('')
    if (VOID_ELEMENTS.has(tag)) return `<${tag}${attrs}>`
    return `<${tag}${attrs}>${children}</${tag}>`
  }
  return ''
}

function serializeAttributes(el: MiniElement) {
  const names = el.getAttributeNames()
  if (names.length === 0) return ''
  return names
    .map((name) => {
      const value = el.getAttribute(name)
      if (value == null || value === '') return ` ${name}`
      return ` ${name}="${escapeAttribute(String(value))}"`
    })
    .join('')
}

type SelectorPart = {
  tag: string | null
  id: string | null
  classes: string[]
  attrs: Array<{ name: string; value?: string }>
  notParts: SelectorPart[]
}

type SelectorStep = {
  part: SelectorPart
  combinatorToPrev: ' ' | '>' | null
}

type FastSelector =
  | { kind: 'any' }
  | { kind: 'tag'; tag: string }
  | { kind: 'attr'; name: string; value?: string }
  | { kind: 'tagAttr'; tag: string; name: string; value?: string }

type CompiledSelector = {
  chain: SelectorStep[]
  fast: FastSelector | null
}

const selectorListCache = new Map<string, CompiledSelector[]>()

export function resetMiniDomCaches() {
  selectorListCache.clear()
  const doc = globalThis.document as
    | (Document & { head?: ParentNode | null; body?: ParentNode | null })
    | undefined
  doc?.head?.replaceChildren()
  doc?.body?.replaceChildren()
  globalThis.localStorage?.clear()
  globalThis.sessionStorage?.clear()
}

function getCompiledSelectors(selector: string) {
  const key = selector.trim()
  const cached = selectorListCache.get(key)
  if (cached) return cached
  const compiled = splitSelectorList(key)
    .map((sel) => {
      const chain = parseSelectorChain(sel)
      return {
        chain,
        fast: toFastSelector(chain),
      }
    })
    .filter((entry) => entry.chain.length > 0)
  selectorListCache.set(key, compiled)
  return compiled
}

function toFastSelector(chain: SelectorStep[]): FastSelector | null {
  if (chain.length !== 1) return null
  if (chain[0].combinatorToPrev !== null) return null
  const part = chain[0].part
  if (part.notParts.length > 0) return null
  if (part.id) return null
  if (part.classes.length > 0) return null
  if (part.attrs.length > 1) return null

  if (part.attrs.length === 0) {
    if (part.tag === '*') return { kind: 'any' }
    if (part.tag) return { kind: 'tag', tag: part.tag }
    return null
  }

  const attr = part.attrs[0]
  if (part.tag && part.tag !== '*') {
    return {
      kind: 'tagAttr',
      tag: part.tag,
      name: attr.name,
      value: attr.value,
    }
  }
  return {
    kind: 'attr',
    name: attr.name,
    value: attr.value,
  }
}

function matchesFastSelector(el: MiniElement, fast: FastSelector) {
  if (fast.kind === 'any') return true
  if (fast.kind === 'tag') return el.isTagNameLower(fast.tag)
  if (fast.kind === 'attr') {
    if (!el.hasAttribute(fast.name)) return false
    if (fast.value === undefined) return true
    return el.getAttribute(fast.name) === fast.value
  }
  if (!el.isTagNameLower(fast.tag)) return false
  if (!el.hasAttribute(fast.name)) return false
  if (fast.value === undefined) return true
  return el.getAttribute(fast.name) === fast.value
}

function matchesCompiledSelector(el: MiniElement, compiled: CompiledSelector) {
  if (compiled.fast) return matchesFastSelector(el, compiled.fast)
  return matchesSelectorChain(el, compiled.chain)
}

function findFirstMatchingElement(
  root: MiniNode,
  match: (el: MiniElement) => boolean,
) {
  let found: MiniElement | null = null
  forEachElement(root, (el) => {
    if (!match(el)) return false
    found = el
    return true
  })
  if (found) return found
  return null
}

function querySelectorFrom(
  root: MiniNode,
  selector: string,
  firstOnly: true,
): MiniElement | null
function querySelectorFrom(
  root: MiniNode,
  selector: string,
  firstOnly: false,
): MiniElement[]
function querySelectorFrom(
  root: MiniNode,
  selector: string,
  firstOnly: boolean,
): MiniElement | MiniElement[] | null {
  if (!firstOnly) return querySelectorAllFrom(root, selector, false)
  const compiledSelectors = getCompiledSelectors(selector)
  if (compiledSelectors.length === 0) return null
  return findFirstMatchingElement(root, (el) =>
    compiledSelectors.some((compiled) => matchesCompiledSelector(el, compiled)),
  )
}

function querySelectorAllFrom(
  root: MiniNode,
  selector: string,
  filterTemplates = true,
) {
  const rawSelector = selector.trim()
  if (rawSelector === '*') {
    const all: MiniElement[] = []
    forEachElement(root, (el) => {
      all.push(el)
      return false
    })
    return all
  }
  const compiledSelectors = getCompiledSelectors(rawSelector)
  if (compiledSelectors.length === 0) return []
  const shouldFilterTemplate = filterTemplates && rawSelector === 'template'
  const isTemplateVisible = (el: MiniElement): boolean => {
    if (!el.isTagNameLower('template')) return true
    if (el.hasAttribute('name')) return false
    const attrs = el.attributes
    for (let i = 0; i < attrs.length; ++i) {
      const name = attrs.item(i)?.name
      if (name?.startsWith('#')) return false
    }
    return true
  }
  const results: MiniElement[] = []
  if (compiledSelectors.length === 1) {
    const compiled = compiledSelectors[0]
    forEachElement(root, (el) => {
      if (
        matchesCompiledSelector(el, compiled) &&
        (!shouldFilterTemplate || isTemplateVisible(el))
      ) {
        results.push(el)
      }
      return false
    })
  } else {
    forEachElement(root, (el) => {
      for (let i = 0; i < compiledSelectors.length; ++i) {
        if (!matchesCompiledSelector(el, compiledSelectors[i])) continue
        if (!shouldFilterTemplate || isTemplateVisible(el)) {
          results.push(el)
        }
        break
      }
      return false
    })
  }
  return results
}

function forEachElement(
  root: MiniNode,
  iteratee: (el: MiniElement) => boolean,
) {
  const stack: MiniNode[] = []
  let size = 0
  const pushChildren = (node: MiniNode) => {
    const children = node.childNodes
    for (let i = children.length - 1; i >= 0; i -= 1) {
      stack[size++] = children[i]
    }
  }
  if (root instanceof MiniDocument || root instanceof MiniDocumentFragment) {
    pushChildren(root)
  } else if (root instanceof MiniElement) {
    pushChildren(root)
  }

  while (size > 0) {
    const node = stack[--size]
    if (!(node instanceof MiniElement)) continue
    if (iteratee(node)) return
    if (node instanceof MiniHTMLTemplateElement) continue
    pushChildren(node)
  }
}

function splitSelectorList(selector: string) {
  const result: string[] = []
  let start = 0
  let depth = 0
  for (let i = 0; i < selector.length; i += 1) {
    const ch = selector[i]
    if (ch === '[' || ch === '(') depth += 1
    else if (ch === ']' || ch === ')') depth = Math.max(0, depth - 1)
    else if (ch === ',' && depth === 0) {
      result.push(selector.slice(start, i).trim())
      start = i + 1
    }
  }
  const tail = selector.slice(start).trim()
  if (tail) result.push(tail)
  return result
}

function parseSelectorChain(selector: string) {
  const parts: SelectorStep[] = []
  let current = ''
  let depth = 0
  let pending: ' ' | '>' | null = null
  let i = 0

  const pushCurrent = () => {
    const trimmed = current.trim()
    if (!trimmed) return
    parts.push({
      part: parseSelectorPart(trimmed),
      combinatorToPrev: pending,
    })
    current = ''
    pending = ' '
  }

  while (i < selector.length) {
    const ch = selector[i]
    if (ch === '[' || ch === '(') depth += 1
    if (ch === ']' || ch === ')') depth = Math.max(0, depth - 1)

    if (depth === 0 && (ch === '+' || ch === '~')) {
      return []
    }

    if (depth === 0 && ch === '>') {
      pushCurrent()
      pending = '>'
      i += 1
      while (i < selector.length && /\s/.test(selector[i])) i += 1
      continue
    }

    if (depth === 0 && /\s/.test(ch)) {
      pushCurrent()
      pending = pending ?? ' '
      i += 1
      while (i < selector.length && /\s/.test(selector[i])) i += 1
      continue
    }

    current += ch
    i += 1
  }

  pushCurrent()
  if (parts.length > 0 && parts[0]?.combinatorToPrev) {
    parts[0].combinatorToPrev = null
  }
  return parts
}

function parseSelectorPart(part: string): SelectorPart {
  const notParts: SelectorPart[] = []
  let base = ''
  let i = 0

  while (i < part.length) {
    if (part.startsWith(':not(', i)) {
      const end = part.indexOf(')', i + 5)
      const raw = part.slice(i + 5, end === -1 ? part.length : end).trim()
      const parsed = parseSimpleSelectorPart(raw)
      if (parsed) notParts.push(parsed)
      i = end === -1 ? part.length : end + 1
      continue
    }
    base += part[i]
    i += 1
  }

  const basePart = parseSimpleSelectorPart(base.trim()) ?? {
    tag: null,
    id: null,
    classes: [],
    attrs: [],
    notParts: [],
  }
  basePart.notParts = notParts
  return basePart
}

function parseSimpleSelectorPart(part: string): SelectorPart | null {
  if (!part) {
    return {
      tag: null,
      id: null,
      classes: [],
      attrs: [],
      notParts: [],
    }
  }
  if (/[\s>+~,]/.test(part)) return null
  let tag: string | null = null
  let id: string | null = null
  const classes: string[] = []
  const attrs: Array<{ name: string; value?: string }> = []
  let i = 0

  if (part.startsWith('*')) {
    tag = '*'
    i += 1
  } else if (/[a-zA-Z]/.test(part[0])) {
    const start = i
    while (i < part.length && /[a-zA-Z0-9:_-]/.test(part[i])) i += 1
    tag = part.slice(start, i).toLowerCase()
  }

  while (i < part.length) {
    const ch = part[i]
    if (ch === '#') {
      i += 1
      const start = i
      while (i < part.length && /[a-zA-Z0-9_-]/.test(part[i])) i += 1
      id = part.slice(start, i)
      continue
    }
    if (ch === '.') {
      i += 1
      const start = i
      while (i < part.length && /[a-zA-Z0-9_-]/.test(part[i])) i += 1
      classes.push(part.slice(start, i))
      continue
    }
    if (ch === '[') {
      const end = part.indexOf(']', i + 1)
      const raw = part.slice(i + 1, end === -1 ? part.length : end)
      const attr = parseAttributeSelector(raw)
      if (attr) attrs.push(attr)
      i = end === -1 ? part.length : end + 1
      continue
    }
    i += 1
  }

  return {
    tag,
    id,
    classes,
    attrs,
    notParts: [],
  }
}

function parseAttributeSelector(raw: string) {
  let trimmed = raw.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    trimmed = trimmed.slice(1, -1).trim()
  }
  const eq = trimmed.indexOf('=')
  if (eq === -1) {
    return { name: unescapeSelector(trimmed) }
  }
  const name = unescapeSelector(trimmed.slice(0, eq).trim())
  let value = trimmed.slice(eq + 1).trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }
  return { name, value }
}

function unescapeSelector(value: string) {
  return value.replace(/\\(.)/g, '$1')
}

function matchesSelectorChain(el: MiniElement, chain: SelectorStep[]) {
  const matchAt = (node: MiniNode | null, index: number): boolean => {
    if (!(node instanceof MiniElement)) return false
    const step = chain[index]
    if (!matchesSelectorPart(node, step.part)) return false
    if (index === 0) return true
    const combinator = step.combinatorToPrev ?? ' '
    if (combinator === '>') {
      return matchAt(node.parentNode, index - 1)
    }
    let parent = node.parentNode
    while (parent) {
      if (parent instanceof MiniElement && matchAt(parent, index - 1))
        return true
      parent = parent.parentNode
    }
    return false
  }

  if (chain.length === 0) return false
  return matchAt(el, chain.length - 1)
}

function matchesSelectorPart(el: MiniElement, part: SelectorPart) {
  if (!matchesSelectorPartBasic(el, part)) return false
  for (const notPart of part.notParts) {
    if (matchesSelectorPartBasic(el, notPart)) return false
  }
  return true
}

function matchesSelectorPartBasic(el: MiniElement, part: SelectorPart) {
  const tag = part.tag
  if (tag && tag !== '*' && !el.isTagNameLower(tag)) return false
  if (part.id) {
    const id = el.getAttribute('id')
    if (id !== part.id) return false
  }
  if (part.classes.length > 0) {
    const classAttr = el.getAttribute('class') ?? ''
    const tokens = classAttr.split(/\s+/).filter(Boolean)
    for (const cls of part.classes) {
      if (!tokens.includes(cls)) return false
    }
  }
  for (const attr of part.attrs) {
    if (!el.hasAttribute(attr.name)) return false
    if (attr.value !== undefined && el.getAttribute(attr.name) !== attr.value) {
      return false
    }
  }
  return true
}

export {
  MiniComment,
  MiniDocument,
  MiniDocumentFragment,
  MiniElement,
  MiniHTMLElement,
  MiniHTMLTemplateElement,
  MiniNode,
  MiniText,
}
