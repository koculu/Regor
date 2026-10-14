import { expect, test } from 'vitest'

import { createApp, drainUnbind } from '../../src'

const template = `
  <aside :context="pageContext">
    <span class="qualified">{{ pageContext.resolvePublicHref('/') }}</span>
    <span class="scoped">{{ resolvePublicHref('/') }}</span>
    <span class="qualified">{{ pageContext.site.logo.icon }}</span>
    <span class="scoped">{{ site.logo.icon }}</span>
    <span class="qualified">{{ pageContext.pageInfo.frontmatter }}</span>
    <span class="scoped">{{ pageInfo.frontmatter }}</span>
  </aside>
`

test.each(['template', 'existing DOM'] as const)(
  'parent :context supplies fields when mounting %s',
  async (mode) => {
    const root = document.createElement('div')
    const pageContext = {
      resolvePublicHref: (path: string) => path,
      site: { logo: { icon: 'tabler:binary-tree' } },
      pageInfo: { frontmatter: { title: 'Dashboard' } },
    }
    // PureStack's renderApp parses the HTML first, then passes only element.
    if (mode === 'existing DOM') root.innerHTML = template
    const app = createApp(
      { pageContext },
      mode === 'template' ? { element: root, template } : { element: root },
    )
    try {
      const read = (selector: string) =>
        [...root.querySelectorAll(selector)].map(
          (element) => element.textContent,
        )
      const expected = ['/', 'tabler:binary-tree', '{"title":"Dashboard"}']

      expect(read('.qualified')).toEqual(expected)
      expect(read('.scoped')).toEqual(expected)
    } finally {
      app.unbind()
      await drainUnbind()
    }
  },
)
