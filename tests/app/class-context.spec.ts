import { expect, test, vi } from 'vitest'

import {
  ComponentHead,
  computed,
  createApp,
  createComponent,
  html,
  observe,
  observeMany,
  observerCount,
  onMounted,
  onUnmounted,
  type Ref,
  ref,
  sref,
  useScope,
  watchEffect,
} from '../../src'

test('should create app from TypeScript class scope and keep directives reactive', async () => {
  interface TodoItem {
    id: number
    label: string
    done: boolean
  }

  class TodoApp {
    title = ref('Class Todo')
    query = ref('')
    showDoneOnly = ref(false)
    nextId = ref(3)
    items = ref<TodoItem[]>([
      { id: 1, label: 'Write docs', done: false },
      { id: 2, label: 'Ship release', done: true },
    ])
    lifecycle: string[] = []

    constructor() {
      onMounted(() => this.lifecycle.push('mounted'))
      onUnmounted(() => this.lifecycle.push('unmounted'))
    }

    addItem = (): void => {
      const id = this.nextId()
      this.items().push(ref<TodoItem>({ id, label: `Task ${id}`, done: false }))
      this.nextId(id + 1)
    }

    toggleDoneFilter = (): void => {
      this.showDoneOnly(!this.showDoneOnly())
    }
  }

  const root = document.createElement('div')
  const app = createApp(
    useScope(() => new TodoApp()),
    {
      element: root,
      template: html`<section>
        <input id="query" r-model="query, 'trim'" />
        <button id="toggle-filter" @click="toggleDoneFilter">toggle</button>
        <button id="add-item" @click="addItem">add</button>
        <p
          id="summary"
          :class="{ hot: items.length > 1 }"
          :style="{ fontWeight: items.length > 1 ? '700' : '400' }"
        >
          {{ title }} ({{ items.length }})
        </p>
        <p id="query-value">{{ query }}</p>
        <ul r-if="!showDoneOnly">
          <li r-for="item in items" :key="item.id" :class="{ done: item.done }">
            <input class="done-input" type="checkbox" r-model="item.done" />
            <span r-if="item.done">done</span>
            <span r-else>{{ item.label }}</span>
          </li>
        </ul>
        <p id="empty" r-show="showDoneOnly">empty</p>
      </section>`,
    },
  )

  expect(app.context.lifecycle).toStrictEqual(['mounted'])
  expect(root.querySelectorAll('li').length).toBe(2)
  expect(root.querySelector('#summary')?.classList.contains('hot')).toBe(true)
  expect((root.querySelector('#summary') as HTMLElement).style.fontWeight).toBe(
    '700',
  )

  const queryInput = root.querySelector('#query') as HTMLInputElement | null
  if (!queryInput) throw new Error('missing query input')
  queryInput.value = 'ship'
  queryInput.dispatchEvent(new Event('input'))
  expect(root.querySelector('#query-value')?.textContent).toBe('ship')

  const doneInput = root.querySelector('.done-input') as HTMLInputElement | null
  if (!doneInput) throw new Error('missing done checkbox')
  doneInput.checked = true
  doneInput.dispatchEvent(new Event('change'))
  expect(root.querySelector('li')?.classList.contains('done')).toBe(true)

  const toggleButton = root.querySelector(
    '#toggle-filter',
  ) as HTMLButtonElement | null
  if (!toggleButton) throw new Error('missing toggle button')
  toggleButton.click()
  expect(root.querySelectorAll('li').length).toBe(0)
  expect((root.querySelector('#empty') as HTMLElement).style.display).toBe('')

  const addButton = root.querySelector('#add-item') as HTMLButtonElement | null
  if (!addButton) throw new Error('missing add button')
  addButton.click()
  expect(root.querySelectorAll('li').length).toBe(0)

  queryInput.value = ''
  queryInput.dispatchEvent(new Event('input'))
  toggleButton.click()
  expect(root.querySelectorAll('li').length).toBe(3)

  app.unmount()
  await new Promise((resolve) => setTimeout(resolve, 10))
  expect(app.context.lifecycle).toStrictEqual(['mounted', 'unmounted'])
})

test('should create components from TypeScript classes with props and emits', async () => {
  type SavePayload = { title: string; selected: boolean }
  type CardProps = { title: Ref<string> }
  const componentLifecycle: string[] = []

  class CardComponentContext {
    title: Ref<string>
    selected = ref(false)
    $emit?: (event: string, args: Record<string, unknown>) => void

    constructor(head: ComponentHead<CardProps>) {
      this.title = head.props.title
      onMounted(() => componentLifecycle.push(`mounted:${this.title()}`))
      onUnmounted(() => componentLifecycle.push(`unmounted:${this.title()}`))
    }

    toggle = (): void => {
      this.selected(!this.selected())
    }

    save = (): void => {
      this.$emit?.('save', {
        title: this.title(),
        selected: this.selected(),
      })
    }
  }

  const cardComponent = createComponent<CardComponentContext>(
    html`<article :class="{ selected: selected }">
      <h4 r-text="title"></h4>
      <input class="editor" r-model="title, 'trim'" />
      <button class="toggle" @click="toggle">toggle</button>
      <button class="save" @click="save">save</button>
      <small r-if="selected">selected</small>
      <small r-else>idle</small>
    </article>`,
    {
      props: ['title'],
      context: (head) =>
        new CardComponentContext(head as ComponentHead<CardProps>),
    },
  )

  class BoardApp {
    components = { cardComponent }
    cards = ref([
      { id: 1, title: 'Alpha' },
      { id: 2, title: 'Beta' },
    ])
    saves = sref<string[]>([])

    onSave = (event: CustomEvent<SavePayload>): void => {
      const { title, selected } = event.detail
      this.saves([
        ...this.saves(),
        `${title}:${selected ? 'selected' : 'idle'}`,
      ])
    }
  }

  const root = document.createElement('div')
  const app = createApp(
    useScope(() => new BoardApp()),
    {
      element: root,
      template: html`<section>
        <CardComponent
          r-for="card in cards"
          :key="card.id"
          :title="card.title"
          @save="onSave($event)"
        ></CardComponent>
        <ul>
          <li r-for="entry in saves">{{ entry }}</li>
        </ul>
      </section>`,
    },
  )

  expect(root.querySelectorAll('article').length).toBe(2)
  expect(componentLifecycle).toStrictEqual(['mounted:Alpha', 'mounted:Beta'])

  const firstToggle = root.querySelector(
    'button.toggle',
  ) as HTMLButtonElement | null
  if (!firstToggle) throw new Error('missing first toggle button')
  firstToggle.click()

  const firstSave = root.querySelector(
    'button.save',
  ) as HTMLButtonElement | null
  if (!firstSave) throw new Error('missing first save button')
  firstSave.click()

  const editors = root.querySelectorAll(
    'input.editor',
  ) as NodeListOf<HTMLInputElement>
  if (editors.length < 2) throw new Error('missing editor inputs')
  editors[1].value = 'Beta 2'
  editors[1].dispatchEvent(new Event('input'))

  const saveButtons = root.querySelectorAll(
    'button.save',
  ) as NodeListOf<HTMLButtonElement>
  saveButtons[1].click()

  const saveTexts = [...root.querySelectorAll('li')].map((x) => x.textContent)
  expect(saveTexts).toStrictEqual(['Alpha:selected', 'Beta 2:idle'])
  expect(app.context.cards()[1]().title()).toBe('Beta 2')
  expect(root.querySelectorAll('article.selected').length).toBe(1)

  app.unmount()
  await new Promise((resolve) => setTimeout(resolve, 10))
  expect(componentLifecycle).toContain('unmounted:Alpha')
  expect(componentLifecycle).toContain('unmounted:Beta 2')
})

test('class method handlers receive args and $event', () => {
  class ClickApp {
    calls = sref<string[]>([])

    handle = (n: number, event: MouseEvent): void => {
      this.calls([...this.calls(), `${n}:${event.type}:${event.button}`])
    }
  }

  const root = document.createElement('div')
  const app = createApp(
    useScope(() => new ClickApp()),
    {
      element: root,
      template: html`<button @click="handle(7, $event)">click</button>`,
    },
  )

  const button = root.querySelector('button') as HTMLButtonElement | null
  if (!button) throw new Error('missing button')
  button.dispatchEvent(new MouseEvent('click', { button: 2 }))

  expect([...app.context.calls()]).toEqual(['7:click:2'])
})

test('class getters used in template stay reactive', () => {
  class NameApp {
    firstName = ref('Ada')
    lastName = ref('Lovelace')

    get fullName(): string {
      return `${this.firstName()} ${this.lastName()}`
    }

    rename = (): void => {
      this.firstName('Grace')
      this.lastName('Hopper')
    }
  }

  const root = document.createElement('div')
  createApp(
    useScope(() => new NameApp()),
    {
      element: root,
      template: html`<p id="name">{{ fullName }}</p>
        <button id="rename" @click="rename">rename</button>`,
    },
  )

  expect(root.querySelector('#name')?.textContent).toBe('Ada Lovelace')
  const button = root.querySelector('#rename') as HTMLButtonElement | null
  if (!button) throw new Error('missing rename button')
  button.click()
  expect(root.querySelector('#name')?.textContent).toBe('Grace Hopper')
})

test('class component autoProps entangle can sync or isolate refs', () => {
  type ValueProp = { value: Ref<string> }

  class EntangledInputContext {
    value = ref('local-entangled')
  }

  class IsolatedInputContext {
    value = ref('local-isolated')

    constructor(head: ComponentHead<ValueProp>) {
      head.entangle = false
    }
  }

  const entangledInput = createComponent<EntangledInputContext>(
    html`<input class="entangled" r-model="value" />`,
    {
      props: ['value'],
      context: () => new EntangledInputContext(),
    },
  )

  const isolatedInput = createComponent<IsolatedInputContext>(
    html`<input class="isolated" r-model="value" />`,
    {
      props: ['value'],
      context: (head) =>
        new IsolatedInputContext(head as ComponentHead<ValueProp>),
    },
  )

  class AppContext {
    components = { entangledInput, isolatedInput }
    sharedA = ref('root-a')
    sharedB = ref('root-b')
  }

  const root = document.createElement('div')
  const app = createApp(
    useScope(() => new AppContext()),
    {
      element: root,
      template: html`<div>
        <EntangledInput :value="sharedA"></EntangledInput>
        <IsolatedInput :value="sharedB"></IsolatedInput>
      </div>`,
    },
  )

  const entangled = root.querySelector(
    'input.entangled',
  ) as HTMLInputElement | null
  const isolated = root.querySelector(
    'input.isolated',
  ) as HTMLInputElement | null
  if (!entangled || !isolated) throw new Error('missing test inputs')

  app.context.sharedA('from-parent')
  expect(entangled.value).toBe('from-parent')

  entangled.value = 'from-child'
  entangled.dispatchEvent(new Event('input'))
  expect(app.context.sharedA()).toBe('from-child')

  app.context.sharedB('from-parent')
  expect(isolated.value).toBe('local-isolated')

  isolated.value = 'child-local'
  isolated.dispatchEvent(new Event('input'))
  expect(app.context.sharedB()).toBe('from-parent')
})

test('nested class components run lifecycle hooks and unmount cleanly', async () => {
  const lifecycle = sref<string[]>([])

  class ChildContext {
    constructor() {
      onMounted(() => lifecycle([...lifecycle(), 'child-mounted']))
      onUnmounted(() => lifecycle([...lifecycle(), 'child-unmounted']))
    }
  }

  const childComponent = createComponent<ChildContext>(
    html`<small>child</small>`,
    {
      context: () => new ChildContext(),
    },
  )

  class ParentContext {
    components = { childComponent }

    constructor() {
      onMounted(() => lifecycle([...lifecycle(), 'parent-mounted']))
      onUnmounted(() => lifecycle([...lifecycle(), 'parent-unmounted']))
    }
  }

  const parentComponent = createComponent<ParentContext>(
    html`<div><ChildComponent></ChildComponent></div>`,
    {
      context: () => new ParentContext(),
    },
  )

  const root = document.createElement('div')
  const app = createApp(
    {
      components: { parentComponent },
    },
    {
      element: root,
      template: html`<ParentComponent></ParentComponent>`,
    },
  )

  expect([...lifecycle()]).toEqual(['child-mounted', 'parent-mounted'])

  app.unmount()
  await new Promise((resolve) => setTimeout(resolve, 10))

  expect(lifecycle().length).toBe(4)
  expect(lifecycle()).toContain('child-unmounted')
  expect(lifecycle()).toContain('parent-unmounted')
})

test('class scope cleans up watchEffect/observe/observeMany on unmount', async () => {
  class ObserveApp {
    a = ref(1)
    b = ref(2)
    total = computed(() => this.a() + this.b())

    constructor() {
      watchEffect(() => {
        this.total()
      })
      observe(this.a, () => {})
      observeMany([this.a, this.b], () => {})
    }
  }

  const root = document.createElement('div')
  const app = createApp(
    useScope(() => new ObserveApp()),
    { element: root, template: html`<div>observe cleanup</div>` },
  )

  expect(observerCount(app.context.a)).toBeGreaterThanOrEqual(3)
  expect(observerCount(app.context.b)).toBeGreaterThanOrEqual(2)

  app.unmount()
  await new Promise((resolve) => setTimeout(resolve, 10))

  expect(observerCount(app.context.a)).toBe(0)
  expect(observerCount(app.context.b)).toBe(0)
})

test('class component supports :props and :props-once with class ref fields', () => {
  class LabelContext {
    liveLabel = ref('live-local')
    onceLabel = ref('once-local')
  }

  const labelsComponent = createComponent<LabelContext>(
    html`<div>
      <span class="live">{{ liveLabel }}</span>
      <span class="once">{{ onceLabel }}</span>
    </div>`,
    {
      context: () => new LabelContext(),
    },
  )

  class HostContext {
    components = { labelsComponent }
    selectedHost = ref({ hostname: 'alpha' })
  }

  const root = document.createElement('div')
  const app = createApp(
    useScope(() => new HostContext()),
    {
      element: root,
      template: html`<LabelsComponent
        :props="{ liveLabel: selectedHost.hostname }"
        :props-once="{ onceLabel: selectedHost.hostname }"
      ></LabelsComponent>`,
    },
  )

  const getLive = () => root.querySelector('.live')?.textContent
  const getOnce = () => root.querySelector('.once')?.textContent

  expect(getLive()).toBe('alpha')
  expect(getOnce()).toBe('alpha')

  app.context.selectedHost().hostname('beta')
  expect(getLive()).toBe('beta')
  expect(getOnce()).toBe('beta')

  app.context.selectedHost(ref({ hostname: 'gamma' }))
  expect(getLive()).toBe('gamma')
  expect(getOnce()).toBe('gamma')
})

test('class-based components support default slots with parent context', () => {
  class ShellContext {
    constructor(head: ComponentHead<ShellContext>) {
      head.enableSwitch = true
    }
  }

  const shellComponent = createComponent<ShellContext>(
    html`<section><slot></slot></section>`,
    {
      context: (head) => new ShellContext(head),
    },
  )

  class SlotHostApp {
    components = { shellComponent }
    message = ref('hello')
  }

  const root = document.createElement('div')
  const app = createApp(
    useScope(() => new SlotHostApp()),
    {
      element: root,
      template: html`<ShellComponent>
        <p class="message">{{ message }}</p>
      </ShellComponent>`,
    },
  )

  expect(root.querySelector('.message')?.textContent).toBe('hello')

  app.context.message('world')
  expect(root.querySelector('.message')?.textContent).toBe('world')
})

test('class r-model binding survives multiple prop target replacements in nested components', () => {
  type ModelProp = { model: Ref<string> }

  class LeafInputContext {
    model: Ref<string>

    constructor(head: ComponentHead<ModelProp>) {
      this.model = head.props.model
    }
  }

  const leafInput = createComponent<LeafInputContext>(
    html`<input id="leaf-input" r-model="model" />`,
    {
      props: ['model'],
      context: (head) => new LeafInputContext(head as ComponentHead<ModelProp>),
    },
  )

  class MiddleInputContext {
    components = { leafInput }
    model: Ref<string>

    constructor(head: ComponentHead<ModelProp>) {
      this.model = head.props.model
    }
  }

  const middleInput = createComponent<MiddleInputContext>(
    html`<LeafInput :model="model"></LeafInput>`,
    {
      props: ['model'],
      context: (head) =>
        new MiddleInputContext(head as ComponentHead<ModelProp>),
    },
  )

  class HostApp {
    components = { middleInput }
    selectedHost = ref({ hostname: 'alpha' })
  }

  const root = document.createElement('div')
  const app = createApp(
    useScope(() => new HostApp()),
    {
      element: root,
      template: html`<MiddleInput
        :model="selectedHost.hostname"
      ></MiddleInput>`,
    },
  )

  const input = root.querySelector('#leaf-input') as HTMLInputElement | null
  if (!input) throw new Error('missing leaf input')

  expect(input.value).toBe('alpha')

  app.context.selectedHost(ref({ hostname: 'beta' }))
  expect(input.value).toBe('beta')
  input.value = 'beta-child'
  input.dispatchEvent(new Event('input'))
  expect(app.context.selectedHost().hostname()).toBe('beta-child')

  app.context.selectedHost(ref({ hostname: 'gamma' }))
  expect(input.value).toBe('gamma')
  app.context.selectedHost().hostname('gamma-parent')
  expect(input.value).toBe('gamma-parent')
  input.value = 'gamma-child'
  input.dispatchEvent(new Event('input'))
  expect(app.context.selectedHost().hostname()).toBe('gamma-child')
})

test('known issue: named slot content should render with class component context', () => {
  class ShellContext {
    constructor(head: ComponentHead<ShellContext>) {
      head.enableSwitch = true
    }
  }

  const shellComponent = createComponent<ShellContext>(
    html`<section>
      <slot></slot>
      <slot name="abc"></slot>
      <slot name="extra"></slot>
    </section>`,
    {
      context: (head) => new ShellContext(head),
    },
  )

  class SlotHostApp {
    components = { shellComponent }
    message = ref('hello')
    extra = ref('x')
  }

  const root = document.createElement('div')
  createApp(
    useScope(() => new SlotHostApp()),
    {
      element: root,
      template: html`<ShellComponent>
        <p class="message">default slot {{ message }}</p>
        <template name="abc"><p class="message">{{ message }}</p></template>
        <template name="extra">
          <em class="extra">{{ extra }}</em>
        </template>
      </ShellComponent>`,
    },
  )
  const messages = [...root.querySelectorAll('.message')].map((x) =>
    x.textContent?.trim(),
  )
  expect(messages).toContain('default slot hello')
  expect(messages).toContain('hello')
  expect(root.querySelector('.extra')?.textContent).toBe('x')
})

test.fails(
  'known issue: r-for with r-if on same node should update without binder errors',
  () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      class ListApp {
        show = ref(true)
        items = ref([{ name: 'a' }, { name: 'b' }])

        toggle = (): void => {
          this.show(!this.show())
        }

        add = (): void => {
          this.items().push(ref({ name: 'c' }))
        }
      }

      const root = document.createElement('div')
      createApp(
        useScope(() => new ListApp()),
        {
          element: root,
          template: html`<section>
            <button id="toggle" @click="toggle">toggle</button>
            <button id="add" @click="add">add</button>
            <p r-for="item in items" r-if="show">{{ item.name }}</p>
          </section>`,
        },
      )

      expect(root.querySelectorAll('p').length).toBe(2)
      ;(root.querySelector('#toggle') as HTMLButtonElement).click()
      expect(root.querySelectorAll('p').length).toBe(0)
      ;(root.querySelector('#add') as HTMLButtonElement).click()
      ;(root.querySelector('#toggle') as HTMLButtonElement).click()

      // Expected behavior after fix: no internal binder error and 3 items rendered.
      expect(errorSpy).not.toHaveBeenCalled()
      expect(root.querySelectorAll('p').length).toBe(3)
    } finally {
      errorSpy.mockRestore()
    }
  },
)
