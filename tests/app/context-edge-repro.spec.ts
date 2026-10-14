import { expect, test, vi } from 'vitest'

import { createApp, defineComponent, drainUnbind, ref, sref } from '../../src'

test.each([':context', 'r-context'])(
  '%s on the mount root preserves root identity and cleanup',
  async (attribute) => {
    const container = document.createElement('div')
    const root = document.createElement('aside')
    root.setAttribute(attribute, 'user')
    root.setAttribute(':title', 'name')
    root.innerHTML = '<span r-text="name"></span>'
    container.appendChild(root)
    const name = ref('Ada')
    const context = { user: { name }, name: 'outer' }
    const app = createApp(context, { element: root })
    try {
      expect(root.querySelector('span')?.textContent).toBe('Ada')
      expect(root.getAttribute('title')).toBe('Ada')
      expect(container.firstChild).toBe(root)
      expect(app.context).toBe(context)
      expect(context.name).toBe('outer')
      name('Grace')
      expect(root.querySelector('span')?.textContent).toBe('Grace')
      expect(root.getAttribute('title')).toBe('Grace')
      app.unbind()
      name('After unbind')
      expect(root.querySelector('span')?.textContent).toBe('Grace')
      expect(root.getAttribute('title')).toBe('Grace')
      app.unmount()
      expect(container.firstChild).toBeNull()
    } finally {
      app.unbind()
      await drainUnbind()
    }
  },
)

test('repro: template context preserves and binds its content with browser template semantics', async () => {
  const originalCreateElement = document.createElement.bind(document)
  const createElement = vi
    .spyOn(document, 'createElement')
    .mockImplementation((tag, options) => {
      const element = originalCreateElement(tag, options)
      if (
        element instanceof HTMLTemplateElement &&
        element.childNodes === element.content.childNodes
      ) {
        // MiniDOM aliases these lists. Browsers keep template content separate.
        Object.defineProperty(element, 'childNodes', {
          value: [],
          writable: true,
        })
      }
      return element
    })
  const root = document.createElement('div')
  const app = createApp(
    { user: { name: 'Ada' } },
    {
      element: root,
      template:
        '<template :context="user"><span r-text="name"></span></template>',
    },
  )
  try {
    expect(root.querySelector('span')?.textContent).toBe('Ada')
    expect(root.querySelector('template')).toBeNull()
  } finally {
    app.unbind()
    createElement.mockRestore()
    await drainUnbind()
  }
})

test('repro: r-pre leaves nested context hosts untouched', async () => {
  const root = document.createElement('div')
  root.innerHTML =
    '<div r-pre><div :context="user"><span r-text="name"></span></div><card :context="user"></card></div>'
  const originalHtml = root.innerHTML
  const app = createApp(
    {
      user: { name: 'Ada' },
      components: { card: defineComponent('<strong>bound</strong>') },
    },
    { element: root },
  )
  try {
    expect(root.innerHTML).toBe(originalHtml)
  } finally {
    app.unbind()
    await drainUnbind()
  }
})

test('r-if on a context host reacts to that context without leaking to siblings', async () => {
  const root = document.createElement('div')
  const visible = ref(false)
  const name = ref('Ada')
  const app = createApp(
    { user: { visible, name }, visible: true, name: 'outer' },
    {
      element: root,
      template:
        '<div :context="user" r-if="visible"><span r-text="name"></span></div><b r-text="name"></b>',
    },
  )
  try {
    expect(root.querySelector('span')).toBeNull()
    visible(true)
    expect(root.querySelector('span')?.textContent).toBe('Ada')
    expect(root.querySelector('b')?.textContent).toBe('outer')
    name('Grace')
    expect(root.querySelector('span')?.textContent).toBe('Grace')
    visible(false)
    expect(root.querySelector('span')).toBeNull()
    visible(true)
    expect(root.querySelector('span')?.textContent).toBe('Grace')
  } finally {
    app.unbind()
    await drainUnbind()
  }
})

test('row context works with r-for and a reactive r-if on the same host', async () => {
  const root = document.createElement('div')
  const ada = { name: 'Ada', visible: ref(true) }
  const grace = { name: 'Grace', visible: ref(false) }
  const rows = sref([ada, grace])
  const app = createApp(
    { rows },
    {
      element: root,
      template:
        '<div r-for="row in rows" :context="row" r-if="visible"><span r-text="name"></span></div>',
    },
  )
  try {
    const names = () =>
      [...root.querySelectorAll('span')].map((element) => element.textContent)
    expect(names()).toEqual(['Ada'])
    grace.visible(true)
    expect(names()).toEqual(['Ada', 'Grace'])
    ada.visible(false)
    expect(names()).toEqual(['Grace'])
  } finally {
    app.unbind()
    await drainUnbind()
  }
})
