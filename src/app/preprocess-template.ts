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

export const preprocess = (template: string): string => {
  let i = 0
  const out: string[] = []
  const stack: Array<{ replacementHost: string | null; effectiveTag: string }> =
    []
  let tbodyDepth = 0

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
        if (top.effectiveTag === 'tbody') --tbodyDepth
      } else {
        out.push(rawTag)
      }
      i = tagEnd + 1
      continue
    }

    const selfClosing = rawTag.charCodeAt(rawTag.length - 2) === 47 // '/>'
    const parent = stack[stack.length - 1]
    let replacementHost: string | null = null
    if (tbodyDepth === 0) {
      if (tagName === 'tr') replacementHost = 'trx'
      else if (tagName === 'td') replacementHost = 'tdx'
    } else if (parent?.effectiveTag === 'tbody') {
      replacementHost = tagName === 'tr' ? null : 'tr'
    } else if (parent?.effectiveTag === 'tr') {
      replacementHost = tagName === 'td' || tagName === 'th' ? null : 'td'
    }

    if (replacementHost) {
      const isAlias = replacementHost === 'trx' || replacementHost === 'tdx'
      out.push(
        `${rawTag.slice(0, range.start)}${replacementHost} is="${isAlias ? `r-${tagName}` : `regor:${tagName}`}"${rawTag.slice(range.end)}`,
      )
    } else if (
      selfClosing &&
      parent?.effectiveTag === 'tr' &&
      tagName.length > 0 &&
      tagName.charCodeAt(0) >= 65 &&
      tagName.charCodeAt(0) <= 90
    ) {
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
            : replacementHost || tagName
      stack.push({
        replacementHost,
        effectiveTag,
      })
      if (effectiveTag === 'tbody') ++tbodyDepth
    }

    i = tagEnd + 1
  }

  return out.join('')
}
