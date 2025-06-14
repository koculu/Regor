import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

export default defineConfig({
  site: 'https:/tenray.io/',
  base: '/regor/',
  trailingSlash: 'ignore',
  integrations: [
    starlight({
      title: 'Regor',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/koculu/regor',
        },
      ],
      pagefind: true,
    }),
  ],
  outDir: './docs-dist',
  markdown: {
    remarkPlugins: [],
    rehypePlugins: [
      () => {
        return (node) => {
          return stripMdExtensions(node)
        }
      },
    ],
  },
})

interface Properties {
  href?: string
}

interface Node {
  type: string
  children?: Node[]
  properties?: Properties
}

function stripMdExtensions(node: Node) {
  const href = node?.properties?.href
  if (href) {
    if (href.endsWith('.md')) {
      node.properties!.href = href.slice(0, href.length - 3).toLocaleLowerCase()
    } else if (href.endsWith('mdx')) {
      node.properties!.href = href.slice(0, href.length - 4).toLocaleLowerCase()
    } else {
      node.properties!.href = href.toLocaleLowerCase()
    }
    //Rooted urls should contain base url.
    if (href.startsWith('/') && !href.startsWith('/regor')) {
      node.properties!.href = '/regor' + node.properties!.href
    }
    console.log(node.properties!.href)
    return
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      stripMdExtensions(child)
    }
  }
}
