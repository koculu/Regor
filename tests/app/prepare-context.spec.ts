import { expect, test } from 'vitest'

import { createApp, defineComponent, drainUnbind } from '../../src'
import { prepareContext } from '../../src/app/prepareContext'
import { preprocess } from '../../src/app/preprocess-template'

test('marks context hosts only inside the supplied template fragment', () => {
  const outside = document.createElement('div')
  outside.setAttribute(':context', 'outside')
  document.body.appendChild(outside)
  try {
    const fragment = document
      .createRange()
      .createContextualFragment(
        preprocess(
          '<section r-context="a"><div :context="b"></div><SiteLogo :context="a"/><input :context="a"/><b title=" :context=example"></b></section>',
        ),
      )
    prepareContext(fragment)
    for (const tag of ['SECTION', 'DIV', 'INPUT', 'SITELOGO']) {
      const element = fragment.querySelector(tag)
      expect(element?.getAttribute(':is')).toBe(tag)
      expect(element?.hasAttribute('_rcontext')).toBe(true)
    }
    expect(fragment.querySelector('b')?.hasAttribute('_rcontext')).toBe(false)
    expect(outside.hasAttribute('_rcontext')).toBe(false)
  } finally {
    outside.remove()
  }
})

test('prepares context wrappers once within component templates', async () => {
  const panel = defineComponent(
    '<div :context="local"><span r-text="label"></span></div>',
    {
      context: () => ({ local: { label: 'scoped' } }),
    },
  )
  const root = document.createElement('div')
  const app = createApp(
    { components: { panel } },
    {
      element: root,
      template: '<panel/>',
    },
  )
  try {
    expect(root.querySelector('span')?.textContent).toBe('scoped')
  } finally {
    app.unbind()
    await drainUnbind()
  }
})
