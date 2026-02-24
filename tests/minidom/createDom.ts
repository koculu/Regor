import cssEscape from './cssEscape'
import { parseHtml, resetMiniDomCaches } from './minidom'

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
  | 'MouseEvent'
  | 'Comment'
  | 'Text'
  | 'HTMLTemplateElement'
  | 'CSS'
  | 'localStorage'
  | 'sessionStorage'

export function createDom(html: string): () => void {
  const { document, window } = parseHtml(html)
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
    'MouseEvent',
    'Comment',
    'Text',
    'HTMLTemplateElement',
    'CSS',
    'localStorage',
    'sessionStorage',
  ]

  for (const key of keys) original[key] = globals[key]

  const win = window as Record<string, unknown>
  assignGlobal(globals, 'window', window)
  assignGlobal(globals, 'document', document)
  assignGlobal(globals, 'Node', win.Node)
  assignGlobal(globals, 'Element', win.Element)
  assignGlobal(globals, 'HTMLElement', win.HTMLElement)
  assignGlobal(globals, 'HTMLSlotElement', win.HTMLSlotElement)
  assignGlobal(globals, 'DocumentFragment', win.DocumentFragment)
  assignGlobal(globals, 'CustomEvent', win.CustomEvent)
  assignGlobal(globals, 'Event', win.Event)
  assignGlobal(globals, 'MouseEvent', win.MouseEvent)
  assignGlobal(globals, 'Comment', win.Comment)
  assignGlobal(globals, 'Text', win.Text)
  assignGlobal(globals, 'HTMLTemplateElement', win.HTMLTemplateElement)

  const windowCss = win.CSS as { escape?: unknown } | undefined
  assignGlobal(
    globals,
    'CSS',
    windowCss && typeof windowCss.escape === 'function'
      ? windowCss
      : { escape: cssEscape },
  )
  assignGlobal(globals, 'localStorage', win.localStorage)
  assignGlobal(globals, 'sessionStorage', win.sessionStorage)

  return () => {
    for (const key of keys) globals[key] = original[key]
    resetMiniDomCaches()
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
  const globals = globalThis
  if (globals.document && globals.window) return () => {}
  return createDom('<html><body></body></html>')
}
