import { type JSONTemplate } from '../api/types'
import { isArray } from '../common/is-what'
import { isTemplate, normalizeAttributeName } from '../common/common'
import { RegorConfig } from '../app/RegorConfig'

const svgTags =
  'svg,animate,animateMotion,animateTransform,circle,clipPath,color-profile,' +
  'defs,desc,discard,ellipse,feBlend,feColorMatrix,feComponentTransfer,' +
  'feComposite,feConvolveMatrix,feDiffuseLighting,feDisplacementMap,' +
  'feDistantLight,feDropShadow,feFlood,feFuncA,feFuncB,feFuncG,feFuncR,' +
  'feGaussianBlur,feImage,feMerge,feMergeNode,feMorphology,feOffset,' +
  'fePointLight,feSpecularLighting,feSpotLight,feTile,feTurbulence,filter,' +
  'foreignObject,g,hatch,hatchpath,image,line,linearGradient,marker,mask,' +
  'mesh,meshgradient,meshpatch,meshrow,metadata,mpath,path,pattern,' +
  'polygon,polyline,radialGradient,rect,set,solidcolor,stop,switch,symbol,' +
  'text,textPath,title,tspan,unknown,use,view'

const svgSet = new Set<string>(svgTags.toUpperCase().split(','))

const svgNamespace = 'http://www.w3.org/2000/svg'

const appendChild = (parent: Node, el: Node): void => {
  if (isTemplate(parent)) parent.content.appendChild(el)
  else parent.appendChild(el)
}

const render = (
  json: JSONTemplate,
  parent: Node,
  isSVG: boolean,
  config: RegorConfig,
): void => {
  const tag = json.t
  if (tag) {
    const el =
      isSVG && svgSet.has(tag.toUpperCase())
        ? document.createElementNS(svgNamespace, tag.toLowerCase())
        : document.createElement(tag)
    const attributes = json.a
    if (attributes) {
      for (const attr of Object.entries(attributes)) {
        let name = attr[0]
        let value = attr[1]
        if (name.startsWith('#')) {
          // slot component shortcut attributes starts with '#'
          // DOM setAttribute does not allow setting attribute names starting with '#'
          // To expand that convert # shortcuts to the name attributes.
          value = name.substring(1)
          name = 'name'
        }
        el.setAttribute(normalizeAttributeName(name, config), value)
      }
    }
    const children = json.c
    if (children) {
      for (const child of children) render(child, el, isSVG, config)
    }
    appendChild(parent, el)
    return
  }
  const textData = json.d
  if (textData) {
    let node: Node | undefined
    switch (json.n ?? Node.TEXT_NODE) {
      case Node.COMMENT_NODE:
        node = document.createComment(textData)
        break
      case Node.TEXT_NODE:
        node = document.createTextNode(textData)
        break
    }
    if (node) appendChild(parent, node)
    else throw new Error('unsupported node type.')
  }
}

export const toFragment = (
  json: JSONTemplate | JSONTemplate[],
  isSVG?: boolean,
  config?: RegorConfig,
): DocumentFragment => {
  config ??= RegorConfig.getDefault()
  const result = document.createDocumentFragment()
  if (!isArray(json)) {
    render(json, result, !!isSVG, config)
    return result
  }
  for (const item of json) {
    render(item, result, !!isSVG, config)
  }

  return result
}
