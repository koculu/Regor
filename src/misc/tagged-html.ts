export const html = (
  templates: TemplateStringsArray,
  ...args: any[]
): string => {
  let str = ''
  if (args.length === 0) return templates.join()
  templates.forEach((template, i) => {
    str += template + args[i]
  })
  return str
}

export const raw = html
