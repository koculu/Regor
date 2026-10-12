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

const svgNames = new Map<string, string>(
  svgTags.split(',').map((tag) => [tag.toUpperCase(), tag]),
)

export const svgNamespace = 'http://www.w3.org/2000/svg'

export const createElement = (tag: string, isSVG = false): Element => {
  const svgName = isSVG ? svgNames.get(tag.toUpperCase()) : undefined
  return svgName
    ? document.createElementNS(svgNamespace, svgName)
    : document.createElement(tag)
}
