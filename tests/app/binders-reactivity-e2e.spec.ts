import { expect, test } from 'vitest'

import { createApp, createComponent, drainUnbind, html, ref } from '../../src'

type KeyedLabelSource = {
  payload: string
  label: string
}

type NameRow = {
  id: number
  name: string
}

type ViewState = {
  show: boolean
  rows: NameRow[]
}

type CardItem = {
  title: string
}

type LabelRow = {
  id: number
  label: string
}

type MetaSource = {
  payload: string
}

type TextStyleShowSource = {
  text: string
  active: boolean
  color: string
  visible: boolean
}

type FormState = {
  title: string
}

const withApp = async (
  context: Record<string, unknown>,
  template: string,
  run: (root: HTMLElement) => void | Promise<void>,
) => {
  const root = document.createElement('div')
  const app = createApp(context, {
    element: root,
    template: html`${template}`,
  })
  try {
    await run(root)
  } finally {
    app.unmount()
    await drainUnbind()
  }
}

test('e2e: dynamic r-bind option reacts to source replacement and detaches old source', async () => {
  const dynamicKey = ref('title')
  const source = ref<KeyedLabelSource>({
    payload: 'A',
    label: 'alpha',
  })

  await withApp(
    { dynamicKey, source },
    `<button
        id="btn"
        r-bind:_d_dynamic-key_d_="source.payload"
        r-text="source.label"
      ></button>`,
    (root) => {
      const btn = root.querySelector('#btn') as HTMLButtonElement | null
      if (!btn) throw new Error('missing #btn')

      expect(btn.getAttribute('title')).toBe('A')
      expect(btn.textContent).toBe('alpha')

      source().payload('B')
      source().label('beta')
      expect(btn.getAttribute('title')).toBe('B')
      expect(btn.textContent).toBe('beta')

      dynamicKey('data-id')
      expect(btn.getAttribute('title')).toBeNull()
      expect(btn.getAttribute('data-id')).toBe('B')

      const oldSource = source()
      source(
        ref<KeyedLabelSource>({
          payload: '42',
          label: 'gamma',
        }),
      )

      expect(btn.getAttribute('data-id')).toBe('42')
      expect(btn.textContent).toBe('gamma')

      source().payload('43')
      source().label('delta')
      expect(btn.getAttribute('data-id')).toBe('43')
      expect(btn.textContent).toBe('delta')

      // Old source must be detached after replacement.
      oldSource.payload('stale')
      oldSource.label('stale-label')
      dynamicKey('aria-label')
      expect(btn.getAttribute('data-id')).toBeNull()
      expect(btn.getAttribute('aria-label')).toBe('43')
      dynamicKey('data-id')
      expect(btn.getAttribute('data-id')).toBe('43')
      expect(btn.textContent).toBe('delta')
    },
  )
})

test('e2e: r-if + r-for stays reactive across source replacement', async () => {
  const view = ref<ViewState>({
    show: true,
    rows: [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ],
  })

  await withApp(
    { view },
    `<section>
        <ul r-if="view.show">
          <li r-for="row in view.rows" :key="row.id" r-text="row.name"></li>
        </ul>
        <p r-else id="empty">empty</p>
      </section>`,
    (root) => {
      const names = () =>
        [...root.querySelectorAll('li')].map((x) => x.textContent)
      const isEmpty = () => !!root.querySelector('#empty')

      expect(names()).toStrictEqual(['A', 'B'])
      expect(isEmpty()).toBe(false)

      view().show(false)
      expect(names()).toStrictEqual([])
      expect(isEmpty()).toBe(true)

      const oldView = view()
      view(
        ref<ViewState>({
          show: true,
          rows: [
            { id: 10, name: 'X' },
            { id: 11, name: 'Y' },
          ],
        }),
      )

      expect(names()).toStrictEqual(['X', 'Y'])
      expect(isEmpty()).toBe(false)

      view().rows()[0]().name('Z')
      expect(names()).toStrictEqual(['Z', 'Y'])

      // Old source must no longer drive UI.
      oldView.show(false)
      oldView.rows()[0]().name('OLD')
      expect(names()).toStrictEqual(['Z', 'Y'])
      expect(isEmpty()).toBe(false)
    },
  )
})

test('e2e: :is component switching keeps prop reactivity and detaches old sources', async () => {
  const currentCard = ref('cardA')
  const item = ref<CardItem>({ title: 'first' })

  const cardA = createComponent(
    html`<article class="a"><h3 r-text="item.title"></h3></article>`,
    {
      props: ['item'],
    },
  )
  const cardB = createComponent(
    html`<article class="b"><h3 r-text="item.title"></h3></article>`,
    {
      props: ['item'],
    },
  )

  await withApp(
    {
      currentCard,
      item,
      components: { cardA, cardB },
    },
    `<div :is="currentCard" :item="item"></div>`,
    (root) => {
      const title = () => root.querySelector('h3')?.textContent
      const cardClass = () => root.querySelector('article')?.className

      expect(cardClass()).toBe('a')
      expect(title()).toBe('first')

      item().title('second')
      expect(title()).toBe('second')

      currentCard('cardB')
      expect(cardClass()).toBe('b')
      expect(title()).toBe('second')

      const oldItem = item()
      item(ref<CardItem>({ title: 'third' }))
      expect(title()).toBe('third')

      oldItem.title('stale')
      expect(title()).toBe('third')
    },
  )
})

test('e2e: mixed binders detach after unmount (post-unmount source churn is safe)', async () => {
  const root = document.createElement('div')
  const show = ref(true)
  const rows = ref<LabelRow[]>([
    { id: 1, label: 'A' },
    { id: 2, label: 'B' },
  ])
  const dynamicKey = ref('title')
  const meta = ref<MetaSource>({ payload: 'x' })
  const currentCard = ref('cardA')

  const cardA = createComponent(
    html`<article class="a"><span r-text="meta.payload"></span></article>`,
    { props: ['meta'] },
  )
  const cardB = createComponent(
    html`<article class="b"><span r-text="meta.payload"></span></article>`,
    { props: ['meta'] },
  )

  const app = createApp(
    {
      show,
      rows,
      dynamicKey,
      meta,
      currentCard,
      components: { cardA, cardB },
    },
    {
      element: root,
      template: html`<section>
        <ul r-if="show">
          <li r-for="row in rows" :key="row.id" r-text="row.label"></li>
        </ul>
        <p r-else id="empty">empty</p>
        <button id="meta" r-bind:_d_dynamic-key_d_="meta.payload"></button>
        <div :is="currentCard" :meta="meta"></div>
      </section>`,
    },
  )

  expect(root.querySelectorAll('li').length).toBe(2)
  expect(root.querySelector('#meta')?.getAttribute('title')).toBe('x')
  expect(root.querySelector('article')?.className).toBe('a')

  app.unmount()
  await drainUnbind()
  const htmlAfterUnmount = root.innerHTML
  const listCountAfterUnmount = root.querySelectorAll('li').length
  const metaAfterUnmount = root.querySelector('#meta')?.getAttribute('title')
  const articleClassAfterUnmount = root.querySelector('article')?.className

  // Post-unmount source churn must not remount/update anything.
  show(false)
  rows().push(ref<LabelRow>({ id: 3, label: 'C' }))
  dynamicKey('data-id')
  meta().payload('y')
  currentCard('cardB')

  expect(root.innerHTML).toBe(htmlAfterUnmount)
  expect(root.querySelectorAll('li').length).toBe(listCountAfterUnmount)
  expect(root.querySelector('#meta')?.getAttribute('title')).toBe(
    metaAfterUnmount,
  )
  expect(root.querySelector('article')?.className).toBe(
    articleClassAfterUnmount,
  )
})

test('e2e: r-text/r-class/r-style/r-show stay reactive after source replacement', async () => {
  const source = ref<TextStyleShowSource>({
    text: 'alpha',
    active: true,
    color: 'red',
    visible: true,
  })

  await withApp(
    { source },
    `<section>
        <p id="text" r-text="source.text"></p>
        <p id="class" :class="{ active: source.active }">x</p>
        <p id="style" :style="{ color: source.color }">x</p>
        <p id="show" r-show="source.visible">visible</p>
      </section>`,
    (root) => {
      const text = root.querySelector('#text') as HTMLElement | null
      const classEl = root.querySelector('#class') as HTMLElement | null
      const styleEl = root.querySelector('#style') as HTMLElement | null
      const showEl = root.querySelector('#show') as HTMLElement | null
      if (!text || !classEl || !styleEl || !showEl)
        throw new Error('missing nodes')

      expect(text.textContent).toBe('alpha')
      expect(classEl.classList.contains('active')).toBe(true)
      expect(styleEl.style.color).toBe('red')
      expect(showEl.style.display).toBe('')

      source().text('beta')
      source().active(false)
      source().color('blue')
      source().visible(false)
      expect(text.textContent).toBe('beta')
      expect(classEl.classList.contains('active')).toBe(false)
      expect(styleEl.style.color).toBe('blue')
      expect(showEl.style.display).toBe('none')

      const oldSource = source()
      source(
        ref<TextStyleShowSource>({
          text: 'gamma',
          active: true,
          color: 'green',
          visible: true,
        }),
      )
      expect(text.textContent).toBe('gamma')
      expect(classEl.classList.contains('active')).toBe(true)
      expect(styleEl.style.color).toBe('green')
      expect(showEl.style.display).toBe('')

      // Ensure detached old source does not affect current DOM bindings.
      oldSource.text('stale')
      oldSource.active(false)
      oldSource.color('black')
      oldSource.visible(false)
      expect(text.textContent).toBe('gamma')
      expect(classEl.classList.contains('active')).toBe(true)
      expect(styleEl.style.color).toBe('green')
      expect(showEl.style.display).toBe('')
    },
  )
})

test('e2e: r-model input stays linked to latest source object after replacement', async () => {
  const form = ref<FormState>({ title: 'A' })

  await withApp(
    { form },
    `<section>
        <input id="title-input" r-model="form.title" />
        <p id="title-text" r-text="form.title"></p>
      </section>`,
    (root) => {
      const input = root.querySelector(
        '#title-input',
      ) as HTMLInputElement | null
      const text = root.querySelector('#title-text') as HTMLElement | null
      if (!input || !text) throw new Error('missing input/text')

      expect(input.value).toBe('A')
      expect(text.textContent).toBe('A')

      input.value = 'B'
      input.dispatchEvent(new Event('input'))
      expect(form().title()).toBe('B')
      expect(text.textContent).toBe('B')

      const oldForm = form()
      form(ref<FormState>({ title: 'C' }))
      expect(input.value).toBe('C')
      expect(text.textContent).toBe('C')

      input.value = 'D'
      input.dispatchEvent(new Event('input'))
      expect(form().title()).toBe('D')
      expect(text.textContent).toBe('D')

      // Old source should be detached and remain unchanged by new writes.
      expect(oldForm.title()).toBe('B')
      oldForm.title('STALE')
      expect(input.value).toBe('D')
      expect(text.textContent).toBe('D')
      expect(form().title()).toBe('D')
    },
  )
})
