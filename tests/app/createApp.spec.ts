import { expect, test } from 'vitest'

import { createApp, html, raw, ref, RegorConfig, useScope } from '../../src'

test('hello world', () => {
  const root = document.createElement('div')
  createApp(
    {
      message: ref('hello world'),
    },
    {
      element: root,
      template: html`<div>{{ message }}</div>`,
    },
  )

  expect(root.textContent).toBe('hello world')
})

test('click counter', () => {
  const root = document.createElement('div')
  const count = ref(0)
  createApp(
    {
      count,
    },
    {
      element: root,
      template: html`<div>count: {{ count }}</div>
        <button @click="count++">click me: {{ count }}</button>`,
    },
  )
  expect(root.querySelector('div > span')?.textContent).toBe('0')
  for (let i = 0; i < 10; ++i) {
    root.querySelector('button')?.click()
    expect(root.querySelector('div > span')?.textContent).toBe(`${i + 1}`)
  }
  expect(root.innerHTML).toBe(
    raw`<div>count: <span>10</span></div><button>click me: <span>10</span></button>`,
  )
})

test('interpolation supports bracket syntax', () => {
  const root = document.createElement('div')
  createApp(
    {
      message: ref('hello brackets'),
    },
    {
      element: root,
      template: html`<div>[[ message ]]</div>`,
    },
  )

  expect(root.textContent).toBe('hello brackets')
})

test('interpolation supports both syntaxes at once', () => {
  const root = document.createElement('div')
  createApp(
    {
      message: ref('hello'),
      target: ref('world'),
    },
    {
      element: root,
      template: html`<div>{{ message }} [[ target ]]</div>`,
    },
  )

  expect(root.textContent).toBe('hello world')
})

test('createApp mounts json template and supports unbind', () => {
  const root = document.createElement('div')
  root.appendChild(document.createElement('span'))
  const app = createApp(
    { msg: ref('json') },
    {
      element: root,
      json: {
        t: 'div',
        c: [{ d: 'ok' }],
      } as any,
    },
  )

  expect(root.textContent).toBe('ok')
  app.unbind()
})

test('createApp supports string templates and scope contexts', () => {
  class ScopeCtx {
    msg = ref('scope-ok')
  }
  const appRoot = document.createElement('div')
  appRoot.id = 'app'
  document.body.appendChild(appRoot)
  createApp(
    useScope(() => new ScopeCtx()),
    '<p>{{ msg }}</p>',
  )
  expect(appRoot.querySelector('p')?.textContent).toBe('scope-ok')
  appRoot.remove()

  const root = document.createElement('div')
  createApp(
    { msg: ref('inline') },
    { element: root, template: '<p>{{ msg }}</p>' },
  )
  expect(root.querySelector('p')?.textContent).toBe('inline')
})

test('createApp throws when selector root is missing and can disable interpolation', () => {
  expect(() =>
    createApp({}, { selector: '#__missing__regor_root__' }),
  ).toThrow()

  const root = document.createElement('div')
  const cfg = new RegorConfig()
  cfg.useInterpolation = false
  createApp(
    { msg: ref('x') },
    { element: root, template: '<p>{{ msg }}</p>' },
    cfg,
  )
  expect(root.querySelector('p')?.textContent).toBe('{{ msg }}')
})

test('createApp supports default #app selector and throws when no root source provided', () => {
  const appRoot = document.createElement('div')
  appRoot.id = 'app'
  document.body.appendChild(appRoot)
  try {
    const app = createApp({ msg: ref('auto-root') })
    expect(app.context.msg()).toBe('auto-root')
    app.unbind()
  } finally {
    appRoot.remove()
  }

  expect(() => createApp({}, { template: '<div>x</div>' } as any)).toThrow()
})
