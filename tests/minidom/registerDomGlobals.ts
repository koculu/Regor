import cssEscape from './cssEscape'
import { parseHtml } from './minidom'

type GlobalKey =
  | 'window'
  | 'document'
  | 'Node'
  | 'Element'
  | 'HTMLElement'
  | 'HTMLSlotElement'
  | 'DocumentFragment'
  | 'CustomEvent'
  | 'Event'
  | 'Comment'
  | 'Text'
  | 'HTMLTemplateElement'
  | 'CSS'

export function registerDomGlobals(
  window: unknown,
  document: unknown,
): () => void {
  const globals = globalThis as Record<string, unknown>
  const original: Partial<Record<GlobalKey, unknown>> = {}
  const keys: GlobalKey[] = [
    'window',
    'document',
    'Node',
    'Element',
    'HTMLElement',
    'HTMLSlotElement',
    'DocumentFragment',
    'CustomEvent',
    'Event',
    'Comment',
    'Text',
    'HTMLTemplateElement',
    'CSS',
  ]

  for (const key of keys) original[key] = globals[key]

  const win = window as Record<string, unknown>
  assignGlobal(globals, 'window', window)
  assignGlobal(globals, 'document', document)
  assignGlobal(globals, 'Node', win.Node)
  assignGlobal(globals, 'Element', win.Element)
  assignGlobal(globals, 'HTMLElement', win.HTMLElement)
  assignGlobal(
    globals,
    'HTMLSlotElement',
    (document as Document).createElement('slot').constructor,
  )
  assignGlobal(globals, 'DocumentFragment', win.DocumentFragment)
  assignGlobal(globals, 'CustomEvent', win.CustomEvent)
  assignGlobal(globals, 'Event', win.Event)
  assignGlobal(globals, 'Comment', createCommentConstructor(document))
  assignGlobal(globals, 'Text', win.Text)
  assignGlobal(
    globals,
    'HTMLTemplateElement',
    (document as Document).createElement('template').constructor,
  )

  const windowCss = win.CSS as { escape?: unknown } | undefined
  assignGlobal(
    globals,
    'CSS',
    windowCss && typeof windowCss.escape === 'function'
      ? windowCss
      : { escape: cssEscape },
  )

  return () => {
    for (const key of keys) globals[key] = original[key]
  }
}

function assignGlobal(
  globals: Record<string, unknown>,
  key: GlobalKey,
  value: unknown,
) {
  try {
    Object.defineProperty(globals, key, {
      value,
      configurable: true,
      writable: true,
    })
  } catch {
    globals[key] = value
  }
}

export function ensureDomGlobals(): () => void {
  const globals = globalThis as Record<string, unknown>
  if (globals.document && globals.window) return () => {}
  const { document, window } = parseHtml('<html><body></body></html>')
  return registerDomGlobals(window, document)
}

function createCommentConstructor(document: unknown): typeof Comment {
  const doc = document as Document
  const prototype = Object.getPrototypeOf(doc.createComment(''))
  const CommentShim = function Comment(this: Comment, data?: string) {
    return doc.createComment(data ?? '')
  } as unknown as typeof Comment
  CommentShim.prototype = prototype
  return CommentShim
}
