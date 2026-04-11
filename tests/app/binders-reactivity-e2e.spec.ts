import { expect, test } from 'vitest'

import {
  createApp,
  defineComponent,
  drainUnbind,
  html,
  ref,
  type RefOrValue,
  sref,
} from '../../src'

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

type TitleCard = {
  showTitle: RefOrValue<boolean>
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

  const cardA = defineComponent(
    html`<article class="a"><h3 r-text="item.title"></h3></article>`,
    {
      props: ['item'],
    },
  )
  const cardB = defineComponent(
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

test('e2e: component prop reactivity keeps disabled state in sync', async () => {
  const busy = ref(false)
  const pendingDeleteHostname = ref('host-1')

  const btn = defineComponent(
    html`<button id="btn" :disabled="disabled">Delete</button>`,
    {
      props: ['disabled'],
      context: (head) => {
        return {
          disabled: head.props.disabled,
        }
      },
    },
  )

  await withApp(
    {
      busy,
      pendingDeleteHostname,
      components: { btn },
    },
    `<Btn :disabled="ref(busy || !pendingDeleteHostname)"></Btn>`,
    (root) => {
      const button = root.querySelector('button') as HTMLButtonElement | null
      if (!button) throw new Error('missing button')

      expect(button.hasAttribute('disabled')).toBe(false)

      busy(true)
      expect(button.hasAttribute('disabled')).toBe(true)

      busy(false)
      expect(button.hasAttribute('disabled')).toBe(false)

      pendingDeleteHostname('')
      expect(button.hasAttribute('disabled')).toBe(true)

      pendingDeleteHostname('host-2')
      expect(button.hasAttribute('disabled')).toBe(false)
    },
  )
})

test('e2e: component r-if respects literal false prop passed from app', async () => {
  const titleCard = defineComponent<TitleCard>(
    html`<article>
      <h3 id="component-title" r-if="showTitle" r-text="title"></h3>
    </article>`,
    {
      props: ['showTitle', 'title'],
      context: (head) => ({
        showTitle: head.props.showTitle,
        title: head.props.title,
      }),
    },
  )

  await withApp(
    {
      components: { titleCard },
    },
    html`<TitleCard showTitle="false" title="Title"></TitleCard>`,
    (root) => {
      expect(root.querySelector('#component-title')).toBeNull()
    },
  )
})

test('e2e: component r-show respects literal false prop passed from app', async () => {
  const titleCard = defineComponent<TitleCard>(
    html`<article>
      <h3 id="component-title-show" r-show="showTitle" r-text="title"></h3>
    </article>`,
    {
      props: ['showTitle', 'title'],
      context: (head) => ({
        showTitle: head.props.showTitle,
        title: head.props.title,
      }),
    },
  )

  await withApp(
    {
      components: { titleCard },
    },
    html`<TitleCard showTitle="false" title="Title"></TitleCard>`,
    (root) => {
      const title = root.querySelector(
        '#component-title-show',
      ) as HTMLElement | null
      if (!title) throw new Error('missing #component-title-show')

      expect(title.style.display).toBe('none')
      expect(title.textContent).toBe('Title')
    },
  )
})

test('e2e: omitted optional component prop stays undefined even when parent has same name', async () => {
  const title = ref('Child title')
  const note = ref('parent note')

  const noteCard = defineComponent(
    html`<article>
      <h3 id="title" r-text="title"></h3>
      <p id="note" r-text="note"></p>
    </article>`,
    {
      props: ['title', 'note'],
      context: (head) => {
        head.autoProps = true
        return {
          title: head.props.title,
          // `note` is intentionally omitted. With auto props enabled, the
          // declared-but-missing prop should still exist on the child context
          // as `undefined`, so parent `note` does not leak in by name.
        }
      },
    },
  )

  await withApp(
    {
      title,
      note,
      components: { noteCard },
    },
    `<NoteCard :title="title"></NoteCard>`,
    (root) => {
      const titleEl = root.querySelector('#title') as HTMLElement | null
      const noteEl = root.querySelector('#note') as HTMLElement | null
      if (!titleEl || !noteEl) throw new Error('missing rendered note card')

      expect(titleEl.textContent).toBe('Child title')
      expect(noteEl.textContent ?? '').toBe('')

      note('updated parent note')
      expect(noteEl.textContent ?? '').toBe('')
    },
  )
})

test('e2e: omitted kebab-case declared prop is isolated through camelized child key', async () => {
  const title = ref('Child title')
  const pendingDeleteHostname = ref('parent-host')

  const hostCard = defineComponent(
    html`<article>
      <h3 id="title-kebab" r-text="title"></h3>
      <p id="pending-kebab" r-text="pendingDeleteHostname"></p>
    </article>`,
    {
      props: ['title', 'pending-delete-hostname'],
      context: (head) => {
        head.autoProps = true
        return {
          title: head.props.title,
          // `pendingDeleteHostname` is intentionally omitted here. The declared
          // prop name is kebab-case, but the child template reads camelCase.
          // The auto-props isolation path must camelize the declared prop name
          // before materializing the missing field as `undefined`.
        }
      },
    },
  )

  await withApp(
    {
      title,
      pendingDeleteHostname,
      components: { hostCard },
    },
    `<HostCard :title="title"></HostCard>`,
    (root) => {
      const titleEl = root.querySelector('#title-kebab') as HTMLElement | null
      const pendingEl = root.querySelector(
        '#pending-kebab',
      ) as HTMLElement | null
      if (!titleEl || !pendingEl) throw new Error('missing rendered host card')

      expect(titleEl.textContent).toBe('Child title')
      expect(pendingEl.textContent ?? '').toBe('')

      pendingDeleteHostname('updated-parent-host')
      expect(pendingEl.textContent ?? '').toBe('')
    },
  )
})

test('e2e: omitted optional component prop resolves from parent when autoProps is disabled', async () => {
  const title = ref('Child title')
  const note = ref('parent note')

  const noteCard = defineComponent(
    html`<article>
      <h3 id="title-off" r-text="title"></h3>
      <p id="note-off" r-text="note"></p>
    </article>`,
    {
      props: ['title', 'note'],
      context: (head) => {
        head.autoProps = false
        return {
          title: head.props.title,
          // `note` is intentionally omitted. With autoProps disabled, the
          // component context never gets a local `note` field, so lookup can
          // still fall through to the parent context.
        }
      },
    },
  )

  await withApp(
    {
      title,
      note,
      components: { noteCard },
    },
    `<NoteCard :title="title"></NoteCard>`,
    (root) => {
      const titleEl = root.querySelector('#title-off') as HTMLElement | null
      const noteEl = root.querySelector('#note-off') as HTMLElement | null
      if (!titleEl || !noteEl) throw new Error('missing rendered note card')

      expect(titleEl.textContent).toBe('Child title')
      expect(noteEl.textContent).toBe('parent note')

      note('updated parent note')
      expect(noteEl.textContent).toBe('updated parent note')
    },
  )
})

test('e2e: nested :model component props keep bridge sync across replacements', async () => {
  const selectedHost = ref({ hostname: 'alpha' })

  const leafInput = defineComponent(
    html`<input id="leaf-input" type="text" r-model="model" />`,
    ['model'],
  )
  const middleInput = defineComponent(
    html`<LeafInput :model="model"></LeafInput>`,
    {
      props: ['model'],
      context: () => ({
        components: { leafInput },
      }),
    },
  )
  const outerInput = defineComponent(
    html`<MiddleInput :model="model"></MiddleInput>`,
    {
      props: ['model'],
      context: () => ({
        components: { middleInput },
      }),
    },
  )

  await withApp(
    {
      selectedHost,
      components: { outerInput },
    },
    `<OuterInput :model="selectedHost.hostname"></OuterInput>`,
    (root) => {
      const input = root.querySelector('#leaf-input') as HTMLInputElement | null
      if (!input) throw new Error('missing #leaf-input')

      expect(input.value).toBe('alpha')

      selectedHost().hostname('parent-alpha')
      expect(input.value).toBe('parent-alpha')

      input.value = 'child-alpha'
      input.dispatchEvent(new Event('input'))
      expect(selectedHost().hostname()).toBe('child-alpha')

      const oldHost1 = selectedHost()
      selectedHost(ref({ hostname: 'beta' }))
      expect(input.value).toBe('beta')

      selectedHost().hostname('parent-beta')
      expect(input.value).toBe('parent-beta')

      input.value = 'child-beta'
      input.dispatchEvent(new Event('input'))
      expect(selectedHost().hostname()).toBe('child-beta')

      oldHost1.hostname('stale-alpha')
      expect(input.value).toBe('child-beta')
      expect(selectedHost().hostname()).toBe('child-beta')

      const oldHost2 = selectedHost()
      selectedHost(ref({ hostname: 'gamma' }))
      expect(input.value).toBe('gamma')

      oldHost2.hostname('stale-beta')
      expect(input.value).toBe('gamma')

      selectedHost().hostname('parent-gamma')
      expect(input.value).toBe('parent-gamma')

      input.value = 'child-gamma'
      input.dispatchEvent(new Event('input'))
      expect(selectedHost().hostname()).toBe('child-gamma')
      expect(oldHost2.hostname()).toBe('stale-beta')
    },
  )
})

test('e2e: existing bridge keeps linked ref active when binding switches to plain value', async () => {
  const state = sref<{ model: string | ReturnType<typeof ref<string>> }>({
    model: ref('alpha'),
  })

  const inputField = defineComponent(
    html`<input id="switching-input" type="text" r-model="model" />`,
    ['model'],
  )

  await withApp(
    {
      state,
      components: { inputField },
    },
    `<InputField :model="state.model"></InputField>`,
    (root) => {
      const input = root.querySelector(
        '#switching-input',
      ) as HTMLInputElement | null
      if (!input) throw new Error('missing #switching-input')

      expect(input.value).toBe('alpha')

      const oldLiveModel = state().model as ReturnType<typeof ref<string>>
      oldLiveModel('beta')
      expect(input.value).toBe('beta')

      state({ model: 'fallback' })
      expect(input.value).toBe('fallback')
      expect(oldLiveModel()).toBe('fallback')

      state({ model: 'fallback-2' })
      expect(input.value).toBe('fallback-2')
      expect(oldLiveModel()).toBe('fallback-2')

      input.value = 'child-local'
      input.dispatchEvent(new Event('input'))
      expect(oldLiveModel()).toBe('child-local')
      expect(input.value).toBe('child-local')

      state({ model: 'fallback-3' })
      expect(input.value).toBe('fallback-3')
      expect(oldLiveModel()).toBe('fallback-3')

      oldLiveModel('stale-live')
      expect(input.value).toBe('stale-live')

      const nextLiveModel = ref('gamma')
      state({ model: nextLiveModel })
      expect(input.value).toBe('gamma')

      nextLiveModel('gamma-2')
      expect(input.value).toBe('gamma-2')

      input.value = 'child-gamma'
      input.dispatchEvent(new Event('input'))
      expect(nextLiveModel()).toBe('child-gamma')

      oldLiveModel('old-detached')
      expect(input.value).toBe('child-gamma')
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

  const cardA = defineComponent(
    html`<article class="a"><span r-text="meta.payload"></span></article>`,
    { props: ['meta'] },
  )
  const cardB = defineComponent(
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
    html`<section>
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
