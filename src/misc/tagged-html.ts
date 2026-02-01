/**
 * Template tag that simply concatenates template strings and expressions. It
 * is mainly provided for symmetry with `raw` and does not perform any HTML
 * escaping.
 */
export const html = (
  templates: TemplateStringsArray,
  ...args: any[]
): string => {
  let result = ''
  const tpl = templates
  const a = args
  const tplLen = tpl.length
  const argLen = a.length

  for (let i = 0; i < tplLen; ++i) {
    result += tpl[i]
    if (i < argLen) {
      result += a[i]
    }
  }

  return result
}

/**
 * Alias of {@link html} provided for clarity when embedding raw HTML strings.
 */
export const raw = html
