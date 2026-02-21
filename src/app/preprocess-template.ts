/**
 * Template preprocessor for table semantics + component interoperability.
 *
 * Why this exists:
 * HTML parsers enforce strict table content models. Custom component tags such as
 * <TableRow />, <TableCell />, or alias hosts like <trx is="r-tr"> can be dropped,
 * re-parented, or parsed unexpectedly when they appear in table-related positions.
 * This preprocessor rewrites raw template text before DOM parsing so table structures
 * remain valid and binders can reliably mount components.
 *
 * High-level behavior:
 * 1) Single-pass scan over the template string.
 *    - We find each `<...>` tag, keep text between tags untouched, and preserve comments.
 * 2) Maintain a lightweight tag stack to infer structural context.
 *    - Each stack entry stores:
 *      - replacementHost: rewritten host tag name (or null if unchanged)
 *      - effectiveTag: semantic tag used for context decisions
 *    - Closing tags are emitted using the rewritten host when applicable.
 * 3) Apply table-focused rewrites based on current context.
 *
 * Context model:
 * - `tableScopeDepth > 0` means we are inside one of: table, thead, tbody, tfoot.
 * - Outside table scope (tableScopeDepth === 0):
 *   - `<tr> -> <trx is="r-tr">`
 *   - `<td> -> <tdx is="r-td">`
 *   - `<th> -> <thx is="r-th">`
 *   This aliasing avoids invalid native table nodes in non-table contexts while still
 *   enabling later runtime conversion through DynamicBinder.
 *
 * - Inside row parent containers (thead/tbody/tfoot):
 *   - Direct child non-<tr> tags are rewritten to:
 *     <tr is="regor:OriginalTag">
 *   - Direct <tr> stays as <tr>.
 *
 * - Inside <table> direct children:
 *   - Allowed unchanged: caption, colgroup, thead, tbody, tfoot, tr.
 *   - Any other direct child is rewritten to:
 *     <tr is="regor:OriginalTag">
 *
 * - Inside <tr> direct children:
 *   - <td> and <th> stay as-is.
 *   - Any other direct child is rewritten to:
 *     <td is="regor:OriginalTag">
 *
 * Self-closing normalization under <tr>:
 * - For self-closing tags directly under effective <tr>, we emit explicit closing tags:
 *   `<X ... /> -> <X ...></X>`
 * - This avoids parser collapsing/mis-nesting issues in table rows when custom tags are
 *   authored as self-closing components.
 *
 * Notes on implementation strategy:
 * - This is intentionally string-based and fast (no intermediate DOM parsing).
 * - It is designed for pragmatic table/component compatibility, not full HTML parsing.
 * - Quotes inside tag attributes are respected when searching for tag end (`>`).
 * - Special tags like `<! ...>` and `<? ...>` are passed through unchanged.
 */
const isNameChar = (ch: string): boolean => {
  const c = ch.charCodeAt(0)
  return (
    (c >= 48 && c <= 57) ||
    (c >= 65 && c <= 90) ||
    (c >= 97 && c <= 122) ||
    ch === '-' ||
    ch === '_' ||
    ch === ':'
  )
}

const findTagEnd = (text: string, start: number): number => {
  let quote = ''
  for (let i = start; i < text.length; ++i) {
    const ch = text[i]
    if (quote) {
      if (ch === quote) quote = ''
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (ch === '>') return i
  }
  return -1
}

const parseTagNameRange = (
  tagText: string,
  isClosing: boolean,
): { start: number; end: number } | null => {
  let i = isClosing ? 2 : 1
  while (i < tagText.length && (tagText[i] === ' ' || tagText[i] === '\n')) ++i
  if (i >= tagText.length || !isNameChar(tagText[i])) return null
  const start = i
  while (i < tagText.length && isNameChar(tagText[i])) ++i
  return { start, end: i }
}

const tableScopeTags = new Set(['table', 'thead', 'tbody', 'tfoot'])
const rowParentTags = new Set(['thead', 'tbody', 'tfoot'])
const tableDirectAllowed = new Set([
  'caption',
  'colgroup',
  'thead',
  'tbody',
  'tfoot',
  'tr',
])

export const preprocess = (template: string): string => {
  let i = 0
  const out: string[] = []
  const stack: Array<{ replacementHost: string | null; effectiveTag: string }> =
    []
  let tableScopeDepth = 0

  while (i < template.length) {
    const lt = template.indexOf('<', i)
    if (lt === -1) {
      out.push(template.slice(i))
      break
    }

    out.push(template.slice(i, lt))

    if (template.startsWith('<!--', lt)) {
      const end = template.indexOf('-->', lt + 4)
      if (end === -1) {
        out.push(template.slice(lt))
        break
      }
      out.push(template.slice(lt, end + 3))
      i = end + 3
      continue
    }

    const tagEnd = findTagEnd(template, lt)
    if (tagEnd === -1) {
      out.push(template.slice(lt))
      break
    }

    const rawTag = template.slice(lt, tagEnd + 1)
    const isClosing = rawTag.startsWith('</')
    const isSpecial = rawTag.startsWith('<!') || rawTag.startsWith('<?')

    if (isSpecial) {
      out.push(rawTag)
      i = tagEnd + 1
      continue
    }

    const range = parseTagNameRange(rawTag, isClosing)
    if (!range) {
      out.push(rawTag)
      i = tagEnd + 1
      continue
    }

    const tagName = rawTag.slice(range.start, range.end)

    if (isClosing) {
      const top = stack[stack.length - 1]
      if (top) {
        stack.pop()
        out.push(top.replacementHost ? `</${top.replacementHost}>` : rawTag)
        if (tableScopeTags.has(top.effectiveTag)) --tableScopeDepth
      } else {
        out.push(rawTag)
      }
      i = tagEnd + 1
      continue
    }

    const selfClosing = rawTag.charCodeAt(rawTag.length - 2) === 47 // '/>'
    const parent = stack[stack.length - 1]
    let replacementHost: string | null = null
    if (tableScopeDepth === 0) {
      if (tagName === 'tr') replacementHost = 'trx'
      else if (tagName === 'td') replacementHost = 'tdx'
      else if (tagName === 'th') replacementHost = 'thx'
    } else if (rowParentTags.has(parent?.effectiveTag ?? '')) {
      replacementHost = tagName === 'tr' ? null : 'tr'
    } else if (parent?.effectiveTag === 'table') {
      replacementHost = tableDirectAllowed.has(tagName) ? null : 'tr'
    } else if (parent?.effectiveTag === 'tr') {
      replacementHost = tagName === 'td' || tagName === 'th' ? null : 'td'
    }

    if (replacementHost) {
      const isAlias =
        replacementHost === 'trx' ||
        replacementHost === 'tdx' ||
        replacementHost === 'thx'
      out.push(
        `${rawTag.slice(0, range.start)}${replacementHost} is="${isAlias ? `r-${tagName}` : `regor:${tagName}`}"${rawTag.slice(range.end)}`,
      )
    } else if (selfClosing && parent?.effectiveTag === 'tr') {
      out.push(`${rawTag.slice(0, rawTag.length - 2)}></${tagName}>`)
    } else {
      out.push(rawTag)
    }

    if (!selfClosing) {
      const effectiveTag =
        replacementHost === 'trx'
          ? 'tr'
          : replacementHost === 'tdx'
            ? 'td'
            : replacementHost === 'thx'
              ? 'th'
              : replacementHost || tagName
      stack.push({
        replacementHost,
        effectiveTag,
      })
      if (tableScopeTags.has(effectiveTag)) ++tableScopeDepth
    }

    i = tagEnd + 1
  }

  return out.join('')
}
