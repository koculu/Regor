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

export const raw = html
