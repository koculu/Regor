import { expect, test } from 'vitest'

import {
  createApp,
  defineComponent,
  html,
  IRegorContext,
  Ref,
  ref,
  RegorConfig,
} from '../../src'
import { Binder } from '../../src/bind/Binder'
import { hasSwitch } from '../../src/bind/switch'
import { Parser } from '../../src/parser/Parser'
import { htmlEqual } from '../common/html-equal'
import { createDom } from '../minidom/createDom'

test('should render components with reactive properties', () => {
  const root = document.createElement('div')

  const myComponent = defineComponent(
    html`<div>{{ prop1 + '-' + prop2 }}</div>`,
    {
      context: () => ({
        prop1: ref('prop-1'),
        prop2: ref('prop-2'),
      }),
      props: ['prop1'],
    },
  )

  const app = createApp(
    {
      components: { myComponent },
      message: ref('ok'),
    },
    {
      element: root,
      template: html`<div>
        <MyComponent prop1="My Property 1"></MyComponent>
        <MyComponent :prop1="message"></MyComponent>
        <MyComponent :prop-1="message"></MyComponent
        ><!-- prop2 is not defined and if it is passed individually it will be considered as normal attribute.-->
        <MyComponent :prop2="message"></MyComponent>
        <!-- props that are not defined in props list can't be assigned individually, but can be assigned using :context -->
        <MyComponent
          :context="{ prop1: message, prop2: message }"
        ></MyComponent>
        <MyComponent
          :context="{ prop1: message, prop2: message }"
        ></MyComponent>
        <!-- r-bind in object form is dedicated for attribute fall-through. Don't use it for component property assignment, use :context instead. -->
        <MyComponent r-bind="{ prop1: message, prop2: message }"></MyComponent>
      </div>`,
    },
  )
  htmlEqual(
    root.innerHTML,
    html`<div>
      <!-- begin component: MYCOMPONENT-->
      <div>My Property 1-prop-2</div>
      <!-- end component: MYCOMPONENT-->
      <!-- begin component: MYCOMPONENT-->
      <div>ok-prop-2</div>
      <!-- end component: MYCOMPONENT-->
      <!-- begin component: MYCOMPONENT-->
      <div>ok-prop-2</div>
      <!-- end component: MYCOMPONENT-->
      <!-- prop2 is not defined and if it is passed individually it will be considered as normal attribute.-->
      <!-- begin component: MYCOMPONENT-->
      <div prop2="ok">prop-1-prop-2</div>
      <!-- end component: MYCOMPONENT-->
      <!-- props that are not defined in props list can't be assigned individually, but can be assigned using :context -->
      <!-- begin component: MYCOMPONENT-->
      <div>ok-ok</div>
      <!-- end component: MYCOMPONENT-->
      <!-- begin component: MYCOMPONENT-->
      <div>ok-ok</div>
      <!-- end component: MYCOMPONENT-->
      <!-- r-bind in object form is dedicated for attribute fall-through. Don't use it for component property assignment, use :context instead. -->
      <!-- begin component: MYCOMPONENT-->
      <div prop1="ok" prop2="ok">prop-1-prop-2</div>
      <!-- end component: MYCOMPONENT-->
    </div>`,
  )
  app.context.message.value = 'yes'
  htmlEqual(
    root.innerHTML,
    html`<div>
      <!-- begin component: MYCOMPONENT-->
      <div>My Property 1-prop-2</div>
      <!-- end component: MYCOMPONENT-->
      <!-- begin component: MYCOMPONENT-->
      <div>yes-prop-2</div>
      <!-- end component: MYCOMPONENT-->
      <!-- begin component: MYCOMPONENT-->
      <div>yes-prop-2</div>
      <!-- end component: MYCOMPONENT--><!-- prop2 is not defined and if it is passed individually it will be considered as normal attribute.-->
      <!-- begin component: MYCOMPONENT-->
      <div prop2="yes">prop-1-prop-2</div>
      <!-- end component: MYCOMPONENT-->
      <!-- props that are not defined in props list can't be assigned individually, but can be assigned using :context -->
      <!-- begin component: MYCOMPONENT-->
      <div>yes-yes</div>
      <!-- end component: MYCOMPONENT-->
      <!-- begin component: MYCOMPONENT-->
      <div>yes-yes</div>
      <!-- end component: MYCOMPONENT-->
      <!-- r-bind in object form is dedicated for attribute fall-through. Don't use it for component property assignment, use :context instead. -->
      <!-- begin component: MYCOMPONENT-->
      <div prop1="yes" prop2="yes">prop-1-prop-2</div>
      <!-- end component: MYCOMPONENT-->
    </div>`,
  )
})

test('should resolve camelCase dynamic prop bindings on components', () => {
  const root = document.createElement('div')

  const myComponent = defineComponent(html`<div>{{ wordOne }}</div>`, {
    context: (head) => ({
      wordOne: head.props.wordOne ?? 'fallback',
    }),
    props: ['wordOne'],
  })

  createApp(
    {
      components: { myComponent },
      value: ref('Calc'),
    },
    {
      element: root,
      template: html`<div>
        <MyComponent :wordOne="value"></MyComponent>
        <MyComponent :word-one="value"></MyComponent>
      </div>`,
    },
  )

  htmlEqual(
    root.innerHTML,
    html`<div>
      <!-- begin component: MYCOMPONENT-->
      <div>Calc</div>
      <!-- end component: MYCOMPONENT-->
      <!-- begin component: MYCOMPONENT-->
      <div>Calc</div>
      <!-- end component: MYCOMPONENT-->
    </div>`,
  )
})

test('component binding matrix: declared props, undeclared attrs, :context, and r-bind object', () => {
  const root = document.createElement('div')

  const demoComponent = defineComponent(
    html`<article class="demo">
      <h4 class="title">{{ title }}</h4>
      <p class="extra">{{ extra }}</p>
      <p class="declared">{{ declaredOnly }}</p>
    </article>`,
    {
      context: () => ({
        title: ref('title-default'),
        extra: ref('extra-default'),
        declaredOnly: ref('declared-default'),
      }),
      props: ['title', 'declaredOnly'],
    },
  )

  const app = createApp(
    {
      components: { demoComponent },
      titleSrc: ref('title-1'),
      extraSrc: ref('extra-1'),
      declaredSrc: ref('declared-1'),
    },
    {
      element: root,
      template: html`<section>
        <DemoComponent
          id="declared"
          :title="titleSrc"
          :declared-only="declaredSrc"
        ></DemoComponent>
        <DemoComponent id="undeclared" :extra="extraSrc"></DemoComponent>
        <DemoComponent
          id="context"
          :context="{ title: titleSrc, extra: extraSrc }"
        ></DemoComponent>
        <DemoComponent
          id="contextSecond"
          :context="{ title: titleSrc, extra: extraSrc }"
        ></DemoComponent>
        <DemoComponent
          id="bindObject"
          r-bind="{ title: titleSrc, extra: extraSrc }"
        ></DemoComponent>
      </section>`,
    },
  )

  const text = (id: string, cls: string): string =>
    (
      root.querySelector(`#${id} .${cls}`) as HTMLElement | null
    )?.textContent?.trim() ?? ''
  const host = (id: string): HTMLElement | null =>
    root.querySelector(`#${id}`) as HTMLElement | null

  expect(text('declared', 'title')).toBe('title-1')
  expect(text('declared', 'declared')).toBe('declared-1')
  expect(text('declared', 'extra')).toBe('extra-default')

  expect(text('undeclared', 'title')).toBe('title-default')
  expect(text('undeclared', 'extra')).toBe('extra-default')
  expect(host('undeclared')?.getAttribute('extra')).toBe('extra-1')

  expect(text('context', 'title')).toBe('title-1')
  expect(text('context', 'extra')).toBe('extra-1')

  expect(text('contextSecond', 'title')).toBe('title-1')
  expect(text('contextSecond', 'extra')).toBe('extra-1')

  expect(text('bindObject', 'title')).toBe('title-default')
  expect(text('bindObject', 'extra')).toBe('extra-default')
  expect(host('bindObject')?.getAttribute('title')).toBe('title-1')
  expect(host('bindObject')?.getAttribute('extra')).toBe('extra-1')

  app.context.titleSrc('title-2')
  app.context.extraSrc('extra-2')
  app.context.declaredSrc('declared-2')

  expect(text('declared', 'title')).toBe('title-2')
  expect(text('declared', 'declared')).toBe('declared-2')
  expect(text('declared', 'extra')).toBe('extra-default')

  expect(text('undeclared', 'title')).toBe('title-default')
  expect(text('undeclared', 'extra')).toBe('extra-default')
  expect(host('undeclared')?.getAttribute('extra')).toBe('extra-2')

  expect(text('context', 'title')).toBe('title-2')
  expect(text('context', 'extra')).toBe('extra-2')

  expect(text('contextSecond', 'title')).toBe('title-2')
  expect(text('contextSecond', 'extra')).toBe('extra-2')

  expect(text('bindObject', 'title')).toBe('title-default')
  expect(text('bindObject', 'extra')).toBe('extra-default')
  expect(host('bindObject')?.getAttribute('title')).toBe('title-2')
  expect(host('bindObject')?.getAttribute('extra')).toBe('extra-2')
})

test('component supports r-context alias for :context', () => {
  const root = document.createElement('div')

  const myComponent = defineComponent(
    html`<div>
      <span class="title">{{ title }}</span>
      <span class="extra">{{ extra }}</span>
    </div>`,
    {
      context: () => ({
        title: ref('title-default'),
        extra: ref('extra-default'),
      }),
    },
  )

  const app = createApp(
    {
      components: { myComponent },
      titleSrc: ref('title-1'),
      extraSrc: ref('extra-1'),
    },
    {
      element: root,
      template: html`<MyComponent
        r-context="{ title: titleSrc, extra: extraSrc }"
      ></MyComponent>`,
    },
  )

  const getTitle = () => root.querySelector('.title')?.textContent?.trim()
  const getExtra = () => root.querySelector('.extra')?.textContent?.trim()

  expect(getTitle()).toBe('title-1')
  expect(getExtra()).toBe('extra-1')

  app.context.titleSrc('title-2')
  app.context.extraSrc('extra-2')
  expect(getTitle()).toBe('title-2')
  expect(getExtra()).toBe('extra-2')
})

test('proof: :context can drive component state, r-bind object cannot', () => {
  const root = document.createElement('div')

  const card = defineComponent(
    html`<div>
      <span class="mode">{{ canEdit ? 'edit' : 'view' }}</span>
      <span class="level">{{ accessLevel }}</span>
    </div>`,
    {
      context: () => ({
        canEdit: ref(false),
        accessLevel: ref('guest'),
      }),
    },
  )

  const app = createApp(
    {
      components: { card },
      flag: ref(true),
      level: ref('admin'),
    },
    {
      element: root,
      template: html`<section>
        <Card
          id="via-context"
          :context="{ canEdit: flag, accessLevel: level }"
        ></Card>
        <Card
          id="via-bind"
          r-bind="{ canEdit: flag, accessLevel: level }"
        ></Card>
      </section>`,
    },
  )

  const text = (id: string, cls: string): string =>
    (
      root.querySelector(`#${id} .${cls}`) as HTMLElement | null
    )?.textContent?.trim() ?? ''

  expect(text('via-context', 'mode')).toBe('edit')
  expect(text('via-context', 'level')).toBe('admin')

  // r-bind object only falls through as DOM attributes; component state stays default.
  expect(text('via-bind', 'mode')).toBe('view')
  expect(text('via-bind', 'level')).toBe('guest')

  app.context.flag(false)
  app.context.level('member')

  expect(text('via-context', 'mode')).toBe('view')
  expect(text('via-context', 'level')).toBe('member')

  expect(text('via-bind', 'mode')).toBe('view')
  expect(text('via-bind', 'level')).toBe('guest')
})

test('proof: r-bind single-prop updates component state only for declared props', () => {
  const root = document.createElement('div')

  const card = defineComponent(
    html`<div>
      <span class="title">{{ title }}</span>
      <span class="note">{{ note }}</span>
    </div>`,
    {
      props: ['title'],
      context: (head) => ({
        title: ref(head.props.title ?? 'title-default'),
        note: ref('note-default'),
      }),
    },
  )

  const app = createApp(
    {
      components: { card },
      titleSrc: ref('hello'),
      noteSrc: ref('n1'),
    },
    {
      element: root,
      template: html`<section>
        <Card id="declared" r-bind:title="titleSrc"></Card>
        <Card id="object-undeclared" r-bind="{ note: noteSrc }"></Card>
      </section>`,
    },
  )

  const text = (id: string, cls: string): string =>
    (
      root.querySelector(`#${id} .${cls}`) as HTMLElement | null
    )?.textContent?.trim() ?? ''

  expect(text('declared', 'title')).toBe('hello')
  expect(text('declared', 'note')).toBe('note-default')

  expect(text('object-undeclared', 'title')).toBe('title-default')
  expect(text('object-undeclared', 'note')).toBe('note-default')

  app.context.titleSrc('world')
  app.context.noteSrc('n2')

  expect(text('declared', 'title')).toBe('world')
  expect(text('declared', 'note')).toBe('note-default')

  // Object-form r-bind stays as fallthrough and does not become component state.
  expect(text('object-undeclared', 'title')).toBe('title-default')
  expect(text('object-undeclared', 'note')).toBe('note-default')
})

test(':context keeps explicit ref(...) entries reactive in object literals', () => {
  const root = document.createElement('div')

  const comp = defineComponent(
    html`<div>
      <span class="live">{{ live }}</span>
      <span class="once">{{ once }}</span>
    </div>`,
    {
      context: () => ({
        live: ref(0),
        once: ref(0),
      }),
    },
  )

  const app = createApp(
    {
      components: { comp },
      count: ref(1),
    },
    {
      element: root,
      template: html`<Comp
        :context="{ live: ref(count + 1), once: count + 1 }"
      ></Comp>`,
    },
  )

  const getLive = () => root.querySelector('.live')?.textContent?.trim()
  const getOnce = () => root.querySelector('.once')?.textContent?.trim()

  // live is passed as explicit ref(...), so it tracks parent updates.
  expect(getLive()).toBe('2')
  // once is primitive assignment to an existing local ref key.
  expect(getOnce()).toBe('2')

  app.context.count(5)
  expect(getLive()).toBe('6')
  expect(getOnce()).toBe('2')
})

test('should preserve context values when autoProps is enabled', () => {
  const root = document.createElement('div')

  const normalize = (href?: string): string => {
    if (!href) return ''
    return href.replace(/^\.\//, '/')
  }

  const myComponent = defineComponent<{ href?: string }>(
    html`<a :href="href"></a>`,
    {
      props: ['href'],
      context: (head) => ({
        href: normalize(head.props.href),
      }),
    },
  )

  createApp(
    {
      components: { myComponent },
    },
    {
      element: root,
      template: html`<MyComponent href="./getting-started"></MyComponent>`,
    },
  )

  htmlEqual(
    root.innerHTML,
    html`<!-- begin component: MYCOMPONENT--><a href="/getting-started"></a
      ><!-- end component: MYCOMPONENT-->`,
  )
})
test('should render empty component', () => {
  const root = document.createElement('div')

  const myComponent = defineComponent(html``)

  createApp(
    {
      components: { myComponent },
    },
    {
      element: root,
      template: html`<MyComponent></MyComponent>`,
    },
  )
  htmlEqual(
    root.innerHTML,
    html`<!-- begin component: MYCOMPONENT--><!-- end component: MYCOMPONENT-->`,
  )
})

test('should render components with kebab-case tags', () => {
  const root = document.createElement('div')

  const myComponent = defineComponent(html`<div>kebab</div>`)

  createApp(
    {
      components: { myComponent },
    },
    {
      element: root,
      template: html`<my-component></my-component>`,
    },
  )

  htmlEqual(
    root.innerHTML,
    html`<!-- begin component: MY-COMPONENT-->
      <div>kebab</div>
      <!-- end component: MY-COMPONENT-->`,
  )
})

test('should render nested component with reactive properties', () => {
  const root = document.createElement('div')

  interface MyApp extends IRegorContext {
    treeItem: Ref<TreeItem>
  }

  interface MyComponent extends IRegorContext {
    item: Ref<TreeItem>
  }

  interface TreeItem {
    name: string
    children: TreeItem[]
  }

  const myComponent = defineComponent<MyComponent>(
    html`<div>
      name: {{ item.name }}
      <MyComponent r-for="child in item.children" :item="child"></MyComponent>
    </div>`,
    {
      context: (head) => ({
        item: head.props.item,
      }),
      props: ['item'],
    },
  )

  const createTreeItem = (name: string): Ref<TreeItem> => {
    return ref({
      name: name,
      children: [] as TreeItem[],
    })
  }

  const treeItem = createTreeItem('root')
  treeItem()
    .children()
    .push(
      createTreeItem('child 1'),
      createTreeItem('child 2'),
      createTreeItem('child 3'),
    )

  createApp<MyApp>(
    {
      components: { myComponent },
      treeItem,
    },
    {
      element: root,
      template: html`<MyComponent :item="treeItem"></MyComponent>`,
    },
  )

  htmlEqual(
    root.innerHTML,
    html`<!-- begin component: MYCOMPONENT-->
      <div>
        name: <span>root</span>
        <!--__begin__ r-for => child in item.children--><!-- begin component: MYCOMPONENT-->
        <div>
          name: <span>child 1</span>
          <!--__begin__ r-for => child in item.children--><!--__end__ r-for => child in item.children-->
        </div>
        <!-- end component: MYCOMPONENT--><!-- begin component: MYCOMPONENT-->
        <div>
          name: <span>child 2</span>
          <!--__begin__ r-for => child in item.children--><!--__end__ r-for => child in item.children-->
        </div>
        <!-- end component: MYCOMPONENT--><!-- begin component: MYCOMPONENT-->
        <div>
          name: <span>child 3</span>
          <!--__begin__ r-for => child in item.children--><!--__end__ r-for => child in item.children-->
        </div>
        <!-- end component: MYCOMPONENT--><!--__end__ r-for => child in item.children-->
      </div>
      <!-- end component: MYCOMPONENT-->`,
  )

  treeItem().name('new root')
  treeItem()
    .children()
    .forEach((child, i) => child().name('new child ' + (i + 1)))

  htmlEqual(
    root.innerHTML,
    html`<!-- begin component: MYCOMPONENT-->
      <div>
        name: <span>new root</span>
        <!--__begin__ r-for => child in item.children--><!-- begin component: MYCOMPONENT-->
        <div>
          name: <span>new child 1</span>
          <!--__begin__ r-for => child in item.children--><!--__end__ r-for => child in item.children-->
        </div>
        <!-- end component: MYCOMPONENT--><!-- begin component: MYCOMPONENT-->
        <div>
          name: <span>new child 2</span>
          <!--__begin__ r-for => child in item.children--><!--__end__ r-for => child in item.children-->
        </div>
        <!-- end component: MYCOMPONENT--><!-- begin component: MYCOMPONENT-->
        <div>
          name: <span>new child 3</span>
          <!--__begin__ r-for => child in item.children--><!--__end__ r-for => child in item.children-->
        </div>
        <!-- end component: MYCOMPONENT--><!--__end__ r-for => child in item.children-->
      </div>
      <!-- end component: MYCOMPONENT-->`,
  )
})

test('defineComponent supports template element and selector sources', () => {
  const source = document.createElement('template')
  source.innerHTML = '<div class="from-element">x</div>'
  const fromElement = defineComponent({ element: source })
  expect(
    (fromElement.template as ParentNode).querySelector('.from-element'),
  ).toBeTruthy()

  const host = document.createElement('div')
  host.innerHTML =
    '<template id="cc-select"><span class="from-selector">y</span></template>'
  document.body.appendChild(host)
  try {
    const fromSelector = defineComponent({ selector: '#cc-select' })
    expect(
      (fromSelector.template as ParentNode).querySelector('.from-selector'),
    ).toBeTruthy()
  } finally {
    host.remove()
  }
})

test('defineComponent throws for missing selector template', () => {
  expect(() =>
    defineComponent({ selector: '#__regor_component_missing__' }),
  ).toThrow()
})

test('defineComponent supports json templates and svg upgrade path', () => {
  const fromJson = defineComponent({
    json: { t: 'div', c: [{ d: 'json-ok' }] },
  })
  expect(
    (fromJson.template as ParentNode).querySelector('div')?.textContent,
  ).toContain('json-ok')

  const fromSvg = defineComponent({
    template:
      '<div isSVG><svg><circle cx="1" cy="1" r="1"></circle></svg></div>',
    isSVG: true,
  })
  const svg = (fromSvg.template as ParentNode).querySelector('svg')
  expect(svg).toBeTruthy()
})

test('component inheritAttrs merges class and style from host onto inheritor root', () => {
  const root = document.createElement('div')
  const boxComp = defineComponent(html`<div r-inherit class="base">box</div>`)

  createApp(
    { components: { boxComp } },
    {
      element: root,
      template: html`<BoxComp
        class="host-a host-b"
        style="color: red; margin-top: 5px"
      ></BoxComp>`,
    },
  )

  const div = root.querySelector('div') as HTMLDivElement
  expect(div.classList.contains('base')).toBe(true)
  expect(div.classList.contains('host-a')).toBe(true)
  expect(div.classList.contains('host-b')).toBe(true)
  expect(div.style.color).toBe('red')
  expect(div.style.marginTop).toBe('5px')
})

test('component attribute fallthrough merges host :class with root :class binding', () => {
  const root = document.createElement('div')
  const btn = defineComponent(
    html`<button class="btn" :class="btnClasses"><slot></slot></button>`,
    {
      context: () => ({
        btnClasses: ref(['btn-primary', { 'btn-large': true }]),
      }),
    },
  )
  const myBtnClasses = ref<(string | Record<string, boolean>)[]>([
    'myBtnActive',
    { myBtnDisabled: false },
  ])

  createApp(
    {
      components: { btn },
      myBtnClasses,
    },
    {
      element: root,
      template: html`<Btn class="myBtn" :class="myBtnClasses">test</Btn>`,
    },
  )

  const button = root.querySelector('button') as HTMLButtonElement
  expect(button.classList.contains('btn')).toBe(true)
  expect(button.classList.contains('myBtn')).toBe(true)
  expect(button.classList.contains('myBtnActive')).toBe(true)
  expect(button.classList.contains('btn-primary')).toBe(true)
  expect(button.classList.contains('btn-large')).toBe(true)
  expect(button.classList.length).toBe(5)
  expect(button.textContent?.trim()).toBe('test')

  myBtnClasses(
    ref<(string | Record<string, boolean>)[]>([
      'myBtnNext',
      { myBtnDisabled: true },
    ]),
  )

  expect(button.classList.contains('btn')).toBe(true)
  expect(button.classList.contains('btn-primary')).toBe(true)
  expect(button.classList.contains('btn-large')).toBe(true)
  expect(button.classList.contains('myBtn')).toBe(true)
  expect(button.classList.contains('myBtnActive')).toBe(false)
  expect(button.classList.contains('myBtnNext')).toBe(true)
  expect(button.classList.contains('myBtnDisabled')).toBe(true)
  expect(button.classList.length).toBe(6)
})

test('component declared class prop still merges host class fallthrough', () => {
  const root = document.createElement('div')
  const btn = defineComponent(
    html`<button class="btn" :class="btnClasses"><slot></slot></button>`,
    {
      props: ['class'],
      context: () => ({
        btnClasses: ref(['btn-primary', { 'btn-large': true }]),
      }),
    },
  )
  const myBtnClasses = ref<(string | Record<string, boolean>)[]>([
    'myBtnActive',
    { myBtnDisabled: false },
  ])

  createApp(
    {
      components: { btn },
      myBtnClasses,
    },
    {
      element: root,
      template: html`<Btn class="myBtn" :class="myBtnClasses">test</Btn>`,
    },
  )

  const button = root.querySelector('button') as HTMLButtonElement
  expect(button.classList.contains('btn')).toBe(true)
  expect(button.classList.contains('myBtn')).toBe(true)
  expect(button.classList.contains('myBtnActive')).toBe(true)
  expect(button.classList.contains('btn-primary')).toBe(true)
  expect(button.classList.contains('btn-large')).toBe(true)
  expect(button.classList.length).toBe(5)

  myBtnClasses(
    ref<(string | Record<string, boolean>)[]>([
      'myBtnNext',
      { myBtnDisabled: true },
    ]),
  )

  expect(button.classList.contains('btn')).toBe(true)
  expect(button.classList.contains('btn-primary')).toBe(true)
  expect(button.classList.contains('btn-large')).toBe(true)
  expect(button.classList.contains('myBtn')).toBe(true)
  expect(button.classList.contains('myBtnActive')).toBe(false)
  expect(button.classList.contains('myBtnNext')).toBe(true)
  expect(button.classList.contains('myBtnDisabled')).toBe(true)
  expect(button.classList.length).toBe(6)
})

test('component merges host style with component :style binding from context', () => {
  const root = document.createElement('div')
  const boxComp = defineComponent(html`<div :style="localStyle">box</div>`, {
    context: () => ({
      localStyle: {
        backgroundColor: 'blue',
        borderTopWidth: '2px',
        borderTopStyle: 'solid',
      },
    }),
  })

  createApp(
    { components: { boxComp } },
    {
      element: root,
      template: html`<BoxComp style="color: red; margin-top: 5px"></BoxComp>`,
    },
  )

  const div = root.querySelector('div') as HTMLDivElement
  expect(div.style.backgroundColor).toBe('blue')
  expect(div.style.borderTopWidth).toBe('2px')
  expect(div.style.borderTopStyle).toBe('solid')
  expect(div.style.color).toBe('red')
  expect(div.style.marginTop).toBe('5px')
})

test('component attribute fallthrough merges host :style with root :style binding', () => {
  const root = document.createElement('div')
  const btn = defineComponent(
    html`<button style="font-weight: 700" :style="btnStyle">
      <slot></slot>
    </button>`,
    {
      context: () => ({
        btnStyle: {
          backgroundColor: 'blue',
          borderTopWidth: '2px',
          borderTopStyle: 'solid',
        },
      }),
    },
  )
  const myBtnStyle = ref<Record<string, unknown>[]>([
    { padding: '2px', marginTop: ref('4px') },
  ])

  createApp(
    {
      components: { btn },
      myBtnStyle,
    },
    {
      element: root,
      template: html`<Btn style="color: red" :style="myBtnStyle">test</Btn>`,
    },
  )

  const button = root.querySelector('button') as HTMLButtonElement
  expect(button.style.fontWeight).toBe('700')
  expect(button.style.color).toBe('red')
  expect(button.style.padding).toBe('2px')
  expect(button.style.marginTop).toBe('4px')
  expect(button.style.backgroundColor).toBe('blue')
  expect(button.style.borderTopWidth).toBe('2px')
  expect(button.style.borderTopStyle).toBe('solid')
  expect(button.textContent?.trim()).toBe('test')

  myBtnStyle(
    ref<Record<string, unknown>[]>([
      { marginTop: ref('6px'), borderTopWidth: '1px' },
    ]),
  )

  expect(button.style.fontWeight).toBe('700')
  expect(button.style.color).toBe('red')
  expect(button.style.padding).toBe('')
  expect(button.style.marginTop).toBe('6px')
  expect(button.style.borderTopWidth).toBe('1px')
  expect(button.style.borderTopStyle).toBe('solid')
  expect(button.style.backgroundColor).toBe('blue')
})

test('component declared style prop still merges host style fallthrough', () => {
  const root = document.createElement('div')
  const btn = defineComponent(
    html`<button style="font-weight: 700" :style="btnStyle">
      <slot></slot>
    </button>`,
    {
      props: ['style'],
      context: () => ({
        btnStyle: {
          backgroundColor: 'blue',
          borderTopWidth: '2px',
          borderTopStyle: 'solid',
        },
      }),
    },
  )
  const myBtnStyle = ref<Record<string, unknown>[]>([
    { padding: '2px', marginTop: ref('4px') },
  ])

  createApp(
    {
      components: { btn },
      myBtnStyle,
    },
    {
      element: root,
      template: html`<Btn style="color: red" :style="myBtnStyle">test</Btn>`,
    },
  )

  const button = root.querySelector('button') as HTMLButtonElement
  expect(button.style.fontWeight).toBe('700')
  expect(button.style.color).toBe('red')
  expect(button.style.padding).toBe('2px')
  expect(button.style.marginTop).toBe('4px')
  expect(button.style.backgroundColor).toBe('blue')
  expect(button.style.borderTopWidth).toBe('2px')
  expect(button.style.borderTopStyle).toBe('solid')

  myBtnStyle(
    ref<Record<string, unknown>[]>([
      { marginTop: ref('6px'), borderTopWidth: '1px' },
    ]),
  )

  expect(button.style.fontWeight).toBe('700')
  expect(button.style.color).toBe('red')
  expect(button.style.padding).toBe('')
  expect(button.style.marginTop).toBe('6px')
  expect(button.style.borderTopWidth).toBe('1px')
  expect(button.style.borderTopStyle).toBe('solid')
  expect(button.style.backgroundColor).toBe('blue')
})

test('component inheritAttrs ignores empty class tokens from host', () => {
  const root = document.createElement('div')
  const boxComp = defineComponent(html`<div r-inherit class="base">box</div>`)

  expect(() =>
    createApp(
      { components: { boxComp } },
      {
        element: root,
        template: html`<BoxComp class="host-a host-b"></BoxComp>`,
      },
    ),
  ).not.toThrow()

  const div = root.querySelector('div') as HTMLDivElement
  expect(div.classList.contains('base')).toBe(true)
  expect(div.classList.contains('host-a')).toBe(true)
  expect(div.classList.contains('host-b')).toBe(true)
  expect(div.classList.length).toBe(3)
})

test('component attribute fallthrough can carry :r-teleport to component root', () => {
  const cleanup = createDom(
    '<html><body><div id="app"></div><div id="teleport-host"></div></body></html>',
  )
  try {
    const root = document.querySelector('#app') as HTMLElement
    const teleComp = defineComponent(
      html`<section class="tele-root">teleported</section>`,
    )

    createApp(
      {
        components: { teleComp },
        target: '#teleport-host',
      },
      {
        element: root,
        template: html`<main>
          <TeleComp
            :r-teleport="target"
            class="from-host"
            data-origin="host"
          ></TeleComp>
        </main>`,
      },
    )

    const host = document.querySelector('#teleport-host') as HTMLElement
    const moved = host.querySelector('.tele-root') as HTMLElement | null
    expect(moved).toBeTruthy()
    expect(moved?.classList.contains('from-host')).toBe(true)
    expect(moved?.getAttribute('data-origin')).toBe('host')
    expect(root.innerHTML).toContain("teleported => '#teleport-host'")
  } finally {
    cleanup()
  }
})

test('nested component tree teleports when parent host binds :r-teleport', () => {
  const cleanup = createDom(
    '<html><body><div id="app"></div><div id="teleport-host"></div></body></html>',
  )
  try {
    const root = document.querySelector('#app') as HTMLElement

    const childComp = defineComponent(
      html`<span class="nested-child">nested payload</span>`,
    )
    const parentComp = defineComponent(
      html`<section class="parent-root" r-inherit>
        <ChildComp></ChildComp>
      </section>`,
    )

    createApp(
      {
        components: { parentComp, childComp },
        target: '#teleport-host',
      },
      {
        element: root,
        template: html`<main>
          <ParentComp
            :r-teleport="target"
            class="from-parent-host"
            data-parent="yes"
          ></ParentComp>
        </main>`,
      },
    )

    const host = document.querySelector('#teleport-host') as HTMLElement
    const moved = host.querySelector('.parent-root') as HTMLElement | null
    const nested = host.querySelector('.nested-child') as HTMLElement | null

    expect(moved).toBeTruthy()
    expect(moved?.classList.contains('from-parent-host')).toBe(true)
    expect(moved?.getAttribute('data-parent')).toBe('yes')
    expect(nested?.textContent?.trim()).toBe('nested payload')
    expect(root.innerHTML).toContain("teleported => '#teleport-host'")
  } finally {
    cleanup()
  }
})

test('nested component tree teleports when parent binds :r-teleport on ChildComp', () => {
  const cleanup = createDom(
    '<html><body><div id="app"></div><div id="teleport-host"></div></body></html>',
  )
  try {
    const root = document.querySelector('#app') as HTMLElement

    const childComp = defineComponent(
      html`<article class="child-root">
        <span class="inner-child">inner payload</span>
      </article>`,
    )
    const parentComp = defineComponent(
      html`<section class="parent-shell">
        <ChildComp
          :r-teleport="target"
          class="child-from-parent"
          data-from-parent="yes"
        ></ChildComp>
      </section>`,
      {
        context: () => ({
          target: '#teleport-host',
        }),
      },
    )

    createApp(
      {
        components: { parentComp, childComp },
      },
      {
        element: root,
        template: html`<main><ParentComp></ParentComp></main>`,
      },
    )
    const host = document.querySelector('#teleport-host') as HTMLElement
    const moved = host.querySelector('.child-root') as HTMLElement | null
    const nested = host.querySelector('.inner-child') as HTMLElement | null

    expect(moved).toBeTruthy()
    expect(moved?.classList.contains('child-from-parent')).toBe(true)
    expect(moved?.getAttribute('data-from-parent')).toBe('yes')
    expect(nested?.textContent?.trim()).toBe('inner payload')
    expect(root.querySelector('.parent-shell')).toBeTruthy()
    expect(root.innerHTML).toContain("teleported => '#teleport-host'")
  } finally {
    cleanup()
  }
})

test('r-teleport fallthrough can target markup rendered by another nested component tree lazily', () => {
  const cleanup = createDom('<html><body><div id="app"></div></body></html>')
  try {
    const root = document.querySelector('#app') as HTMLElement

    const firstChild = defineComponent(
      html`<article class="first-child-root">
        <span class="first-payload">from first</span>
      </article>`,
    )
    const firstParent = defineComponent(
      html`<section class="first-parent-shell">
        <FirstChild
          :r-teleport="target"
          class="first-fallthrough"
          data-flow="from-parent-1"
        ></FirstChild>
      </section>`,
      {
        context: () => ({
          target: '#second-child-target',
        }),
      },
    )

    const secondChild = defineComponent(
      html`<div id="second-child-target" class="second-child-target">
        <p class="second-static">target host</p>
      </div>`,
    )
    const secondParent = defineComponent(
      html`<section class="second-parent-shell">
        <SecondChild></SecondChild>
      </section>`,
    )

    createApp(
      {
        components: { firstParent, firstChild, secondParent, secondChild },
      },
      {
        element: root,
        // render second tree first so teleport target exists before first child bind
        template: html`<main>
          <FirstParent></FirstParent>
          <SecondParent></SecondParent>
        </main>`,
      },
    )
    const target = root.querySelector('#second-child-target') as HTMLElement
    const moved = target.querySelector(
      '.first-child-root',
    ) as HTMLElement | null
    expect(moved).toBeTruthy()
    expect(moved?.classList.contains('first-fallthrough')).toBe(true)
    expect(moved?.getAttribute('data-flow')).toBe('from-parent-1')
    expect(target.querySelector('.first-payload')?.textContent?.trim()).toBe(
      'from first',
    )
    expect(root.querySelector('.first-parent-shell')).toBeTruthy()
    expect(root.innerHTML).toContain("teleported => '#second-child-target'")
  } finally {
    cleanup()
  }
})

test('component template supports self-closing child components', () => {
  const root = document.createElement('div')

  const Icon = defineComponent(html`<span>icon</span>`)
  const btn = defineComponent(
    html`<button>
      <Icon /><span><slot></slot></span><Icon />
    </button>`,
  )

  createApp(
    {
      components: { Icon, btn },
    },
    {
      element: root,
      template: html`<btn>Save</btn>`,
    },
  )

  const icons = root.querySelectorAll('button > span')
  expect(icons).toHaveLength(3)
  expect(icons[0]?.textContent?.trim()).toBe('icon')
  expect(icons[1]?.textContent?.trim()).toBe('Save')
  expect(icons[2]?.textContent?.trim()).toBe('icon')
})

test('component named slot fallback renders when slot content is not provided', () => {
  const root = document.createElement('div')
  const slotComp = defineComponent(
    html`<section>
      <slot name="extra"><em class="fallback-extra">fallback-extra</em></slot>
    </section>`,
  )

  createApp(
    { components: { slotComp } },
    {
      element: root,
      template: html`<SlotComp></SlotComp>`,
    },
  )

  expect(root.querySelector('.fallback-extra')?.textContent).toBe(
    'fallback-extra',
  )
})

test('component with slot-only root expands default slot content', () => {
  const root = document.createElement('div')
  const onlySlot = defineComponent(html`<slot></slot>`)

  createApp(
    { components: { onlySlot } },
    {
      element: root,
      template: html`<OnlySlot
        ><strong class="inside">inside</strong></OnlySlot
      >`,
    },
  )

  expect(root.querySelector('.inside')?.textContent).toBe('inside')
})

test('component named slot falls back to slot body when name is missing in host templates', () => {
  const root = document.createElement('div')
  const comp = defineComponent(
    html`<section>
      <slot name="missing"><em class="slot-fallback">fallback</em></slot>
    </section>`,
  )
  createApp(
    { components: { comp } },
    {
      element: root,
      template: html`<Comp><span class="default-only">default</span></Comp>`,
    },
  )
  expect(root.querySelector('.slot-fallback')?.textContent).toBe('fallback')
})

test('default slot ignores named-only template shortcuts and keeps element children', () => {
  const root = document.createElement('div')
  const shell = defineComponent(html`<section><slot></slot></section>`)
  createApp(
    { components: { shell } },
    {
      element: root,
      template: html`<Shell>
        <template #named><b class="named">named</b></template>
        <i class="plain">plain</i>
      </Shell>`,
    },
  )
  expect(root.querySelector('.named')).toBeNull()
  expect(root.querySelector('.plain')?.textContent).toBe('plain')
})

test('slot switch contexts are released on unmount', async () => {
  const root = document.createElement('div')
  const shell = defineComponent(html`<section><slot></slot></section>`, {
    context: (head) => {
      head.enableSwitch = true
      return {}
    },
  })

  const app = createApp(
    { components: { shell } },
    {
      element: root,
      template: html`<Shell><p class="s">slot</p></Shell>`,
    },
  )

  expect(hasSwitch()).toBe(true)
  app.unmount()
  await new Promise((resolve) => setTimeout(resolve, 5))
  expect(hasSwitch()).toBe(false)
})

test('enableSwitch controls whether slot bindings use parent or component context', () => {
  const root = document.createElement('div')

  const shellNoSwitch = defineComponent(
    html`<section><slot></slot></section>`,
    {
      context: () => ({
        message: ref('from-component-no-switch'),
      }),
    },
  )

  const shellWithSwitch = defineComponent(
    html`<section><slot></slot></section>`,
    {
      context: (head) => {
        head.enableSwitch = true
        return {
          message: ref('from-component-with-switch'),
        }
      },
    },
  )

  const app = createApp(
    {
      components: { shellNoSwitch, shellWithSwitch },
      message: ref('from-parent'),
    },
    {
      element: root,
      template: html`<div>
        <ShellNoSwitch>
          <p class="no-switch">{{ message }}</p>
        </ShellNoSwitch>
        <ShellWithSwitch>
          <p class="with-switch">{{ message }}</p>
        </ShellWithSwitch>
      </div>`,
    },
  )

  expect(root.querySelector('.no-switch')?.textContent?.trim()).toBe(
    'from-component-no-switch',
  )
  expect(root.querySelector('.with-switch')?.textContent?.trim()).toBe(
    'from-parent',
  )

  app.context.message('from-parent-next')
  expect(root.querySelector('.no-switch')?.textContent?.trim()).toBe(
    'from-component-no-switch',
  )
  expect(root.querySelector('.with-switch')?.textContent?.trim()).toBe(
    'from-parent-next',
  )
})

test('defineComponent supports disabling interpolation and direct element children scan', () => {
  const rootEl = document.createElement('div')
  rootEl.innerHTML = '<p>{{ msg }}</p>'
  const comp = defineComponent({ element: rootEl }, { useInterpolation: false })
  const template = comp.template as ParentNode
  expect(template.querySelector('p')?.textContent).toBe('{{ msg }}')
})

test('component slot shorthand #name on slot element resolves named templates', () => {
  const root = document.createElement('div')
  const shell = defineComponent(
    html`<section>
      <slot #abc><i class="fallback">fallback</i></slot>
    </section>`,
  )

  createApp(
    { components: { shell } },
    {
      element: root,
      template: html`<Shell>
        <template #abc><b class="named">named-slot</b></template>
      </Shell>`,
    },
  )

  expect(root.querySelector('.named')?.textContent).toBe('named-slot')
  expect(root.querySelector('.fallback')).toBeNull()
})

test('registered-only component lookup works without context components', () => {
  const root = document.createElement('div')
  const cfg = new RegorConfig()
  const regOnly = defineComponent('<div class="reg-only">ok</div>', {
    defaultName: 'RegOnly',
  })
  cfg.addComponent(regOnly)

  createApp(
    {},
    {
      element: root,
      template: '<RegOnly></RegOnly>',
    },
    cfg,
  )

  expect(root.querySelector('.reg-only')?.textContent).toBe('ok')
})

test('dashed context component key is safely skipped when lookup key camelizes differently', () => {
  const root = document.createElement('div')
  const dashComp = defineComponent('<div class="dash">x</div>')

  createApp(
    {
      components: {
        'my-comp': dashComp,
      } as any,
    },
    {
      element: root,
      template: '<my-comp></my-comp>',
    },
  )

  // unresolved component remains untouched
  expect(root.querySelector('my-comp')).toBeTruthy()
})

test('component binder handles components mounted under parent nodes without parentElement', () => {
  const cfg = new RegorConfig()
  const regOnly = defineComponent('<div class="frag">ok</div>', {
    defaultName: 'FragOnly',
  })
  cfg.addComponent(regOnly)
  const parser = new Parser([{}], cfg)
  const binder = new Binder(parser)

  const frag = document.createDocumentFragment()
  const el = document.createElement('frag-only')
  frag.appendChild(el)

  expect(() =>
    (binder as any).__componentBinder.__bindAll(frag as any),
  ).not.toThrow()
  expect(frag.querySelector('frag-only')).toBeTruthy()
})

test('component props binding accepts .prop and r-bind:prop paths', () => {
  const root = document.createElement('div')
  const comp = defineComponent(html`<div class="msg">{{ msg }}</div>`, {
    props: ['msg'],
    context: (head) => ({
      msg: head.props.msg,
    }),
  })

  createApp(
    {
      components: { comp },
      dotMsg: ref('dot'),
      bindMsg: ref('bind'),
    },
    {
      element: root,
      template: html`<div>
        <Comp .msg="dotMsg"></Comp>
        <Comp r-bind:msg="bindMsg"></Comp>
      </div>`,
    },
  )

  const texts = [...root.querySelectorAll('.msg')].map((x) => x.textContent)
  expect(texts).toContain('dot')
  expect(texts).toContain('bind')
})

test('component context fallback to empty object works when context() returns undefined', () => {
  const root = document.createElement('div')
  const undefCtx = defineComponent('<div class="ctx-undef">ok</div>', {
    context: () => undefined as any,
  })

  createApp(
    {
      components: { undefCtx },
    },
    {
      element: root,
      template: '<UndefCtx></UndefCtx>',
    },
  )

  expect(root.querySelector('.ctx-undef')?.textContent).toBe('ok')
})

test('component autoProps can be disabled', () => {
  const root = document.createElement('div')
  const comp = defineComponent(html`<div class="no-auto">{{ msg }}</div>`, {
    props: ['msg'],
    context: (head) => {
      head.autoProps = false
      return {
        msg: ref('local'),
      }
    },
  })

  createApp(
    {
      components: { comp },
      external: ref('external'),
    },
    {
      element: root,
      template: '<Comp :msg="external"></Comp>',
    },
  )

  expect(root.querySelector('.no-auto')?.textContent).toBe('local')
})

test('component inheritAttrs false keeps host attrs off child root', () => {
  const root = document.createElement('div')
  const comp = defineComponent('<div class="base">x</div>', {
    inheritAttrs: false,
  })

  createApp(
    { components: { comp } },
    {
      element: root,
      template: '<Comp class="host-class" :context="{ a: 1, b: 2 }"></Comp>',
    },
  )

  const child = root.querySelector('.base') as HTMLElement
  expect(child.classList.contains('host-class')).toBe(false)
})

test('component context with default slot r-for', () => {
  const root = document.createElement('div')
  const tabsItems = ref(['tab1', 'tab2', 'tab3'])
  class Tabs {
    title = 'My Tabs'
    items = tabsItems
  }
  interface TabPane {
    id: string
  }

  const tabs = defineComponent('<div>Tabs: <slot></slot></div>', {
    context: () => new Tabs(),
  })
  const tabPane = defineComponent<TabPane>('<div>TabPane: <slot></slot></div>')

  createApp(
    { components: { tabs, tabPane } },
    {
      element: root,
      template:
        '<div><Tabs><TabPane r-for="id in items">{{ id }} - {{ title }}</TabPane></Tabs></div>',
    },
  )

  const getPaneTexts = (): string[] =>
    [...root.querySelectorAll('div > div > div')]
      .map((x) => x.textContent?.replace(/\s+/g, ' ').trim() ?? '')
      .filter((x) => x.startsWith('TabPane:'))

  expect(root.innerHTML).toContain('__begin__ r-for => id in items')
  expect(root.innerHTML).toContain('__end__ r-for => id in items')
  expect(getPaneTexts()).toEqual([
    'TabPane: tab1 - My Tabs',
    'TabPane: tab2 - My Tabs',
    'TabPane: tab3 - My Tabs',
  ])

  tabsItems([ref('next-1'), ref('next-2')])

  expect(getPaneTexts()).toEqual([
    'TabPane: next-1 - My Tabs',
    'TabPane: next-2 - My Tabs',
  ])
})

test('component context with default slot template r-for', () => {
  const root = document.createElement('div')
  const tabsItems = ref(['tab1', 'tab2', 'tab3'])
  class Tabs {
    title = 'My Tabs'
    items = tabsItems
  }
  interface TabPane {
    id: string
  }

  const tabs = defineComponent('<div>Tabs: <slot></slot></div>', {
    context: () => new Tabs(),
  })
  const tabPane = defineComponent<TabPane>('<div>TabPane: <slot></slot></div>')

  createApp(
    { components: { tabs, tabPane } },
    {
      element: root,
      template:
        '<div><Tabs><template r-for="id in items"><TabPane>{{ id }} - {{ title }}</TabPane></template></Tabs></div>',
    },
  )

  const getPaneTexts = (): string[] =>
    [...root.querySelectorAll('div > div > div')]
      .map((x) => x.textContent?.replace(/\s+/g, ' ').trim() ?? '')
      .filter((x) => x.startsWith('TabPane:'))

  expect(root.innerHTML).toContain('__begin__ r-for => id in items')
  expect(root.innerHTML).toContain('__end__ r-for => id in items')
  expect(getPaneTexts()).toEqual([
    'TabPane: tab1 - My Tabs',
    'TabPane: tab2 - My Tabs',
    'TabPane: tab3 - My Tabs',
  ])

  tabsItems([ref('next-1'), ref('next-2')])

  expect(getPaneTexts()).toEqual([
    'TabPane: next-1 - My Tabs',
    'TabPane: next-2 - My Tabs',
  ])
})
