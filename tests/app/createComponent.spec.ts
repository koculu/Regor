import { expect, test } from 'vitest'

import {
  createApp,
  createComponent,
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

test('should render components with reactive properties', () => {
  const root = document.createElement('div')

  const myComponent = createComponent(
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
        <!-- props that are not defined in props list can't be assigned individually, but can be assigned using :props and :props-once-->
        <MyComponent :props="{ prop1: message, prop2: message }"></MyComponent>
        <MyComponent
          :props-once="{ prop1: message, prop2: message }"
        ></MyComponent>
        <!-- r-bind in object form is dedicated for attribute fall-through. Don't use it for component property assignment, use :props and :props-once instead. -->
        <MyComponent r-bind="{ prop1: message, prop2: message }"></MyComponent>
      </div>`,
    },
  )
  htmlEqual(
    root.innerHTML,
    html`<div>
      <!-- begin component: MYCOMPONENT-->
      <div>prop-1-prop-2</div>
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
      <!-- props that are not defined in props list can't be assigned individually, but can be assigned using :props and :props-once-->
      <!-- begin component: MYCOMPONENT-->
      <div>ok-ok</div>
      <!-- end component: MYCOMPONENT-->
      <!-- begin component: MYCOMPONENT-->
      <div>ok-ok</div>
      <!-- end component: MYCOMPONENT-->
      <!-- r-bind in object form is dedicated for attribute fall-through. Don't use it for component property assignment, use :props and :props-once instead. -->
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
      <div>prop-1-prop-2</div>
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
      <!-- props that are not defined in props list can't be assigned individually, but can be assigned using :props and :props-once-->
      <!-- begin component: MYCOMPONENT-->
      <div>yes-yes</div>
      <!-- end component: MYCOMPONENT-->
      <!-- begin component: MYCOMPONENT-->
      <div>yes-yes</div>
      <!-- end component: MYCOMPONENT-->
      <!-- r-bind in object form is dedicated for attribute fall-through. Don't use it for component property assignment, use :props and :props-once instead. -->
      <!-- begin component: MYCOMPONENT-->
      <div prop1="yes" prop2="yes">prop-1-prop-2</div>
      <!-- end component: MYCOMPONENT-->
    </div>`,
  )
})

test('should resolve camelCase dynamic prop bindings on components', () => {
  const root = document.createElement('div')

  const myComponent = createComponent(html`<div>{{ wordOne }}</div>`, {
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

test('should preserve context values when autoProps is enabled', () => {
  const root = document.createElement('div')

  const normalize = (href?: string): string => {
    if (!href) return ''
    return href.replace(/^\.\//, '/')
  }

  const myComponent = createComponent<{ href?: string }>(
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

  const myComponent = createComponent(html``)

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

  const myComponent = createComponent(html`<div>kebab</div>`)

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

  const myComponent = createComponent<MyComponent>(
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

test('createComponent supports template element and selector sources', () => {
  const source = document.createElement('template')
  source.innerHTML = '<div class="from-element">x</div>'
  const fromElement = createComponent({ element: source })
  expect(
    (fromElement.template as ParentNode).querySelector('.from-element'),
  ).toBeTruthy()

  const host = document.createElement('div')
  host.innerHTML =
    '<template id="cc-select"><span class="from-selector">y</span></template>'
  document.body.appendChild(host)
  try {
    const fromSelector = createComponent({ selector: '#cc-select' })
    expect(
      (fromSelector.template as ParentNode).querySelector('.from-selector'),
    ).toBeTruthy()
  } finally {
    host.remove()
  }
})

test('createComponent throws for missing selector template', () => {
  expect(() =>
    createComponent({ selector: '#__regor_component_missing__' }),
  ).toThrow()
})

test('createComponent supports json templates and svg upgrade path', () => {
  const fromJson = createComponent({
    json: { t: 'div', c: [{ d: 'json-ok' }] },
  })
  expect(
    (fromJson.template as ParentNode).querySelector('div')?.textContent,
  ).toContain('json-ok')

  const fromSvg = createComponent({
    template:
      '<div isSVG><svg><circle cx="1" cy="1" r="1"></circle></svg></div>',
    isSVG: true,
  })
  const svg = (fromSvg.template as ParentNode).querySelector('svg')
  expect(svg).toBeTruthy()
})

test('component inheritAttrs merges class and style from host onto inheritor root', () => {
  const root = document.createElement('div')
  const boxComp = createComponent(html`<div r-inherit class="base">box</div>`)

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

test('component named slot fallback renders when slot content is not provided', () => {
  const root = document.createElement('div')
  const slotComp = createComponent(
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
  const onlySlot = createComponent(html`<slot></slot>`)

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
  const comp = createComponent(
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
  const shell = createComponent(html`<section><slot></slot></section>`)
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
  const shell = createComponent(html`<section><slot></slot></section>`, {
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

test('createComponent supports disabling interpolation and direct element children scan', () => {
  const rootEl = document.createElement('div')
  rootEl.innerHTML = '<p>{{ msg }}</p>'
  const comp = createComponent({ element: rootEl }, { useInterpolation: false })
  const template = comp.template as ParentNode
  expect(template.querySelector('p')?.textContent).toBe('{{ msg }}')
})

test('component slot shorthand #name on slot element resolves named templates', () => {
  const root = document.createElement('div')
  const shell = createComponent(
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
  const regOnly = createComponent('<div class="reg-only">ok</div>', {
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
  const dashComp = createComponent('<div class="dash">x</div>')

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
  const regOnly = createComponent('<div class="frag">ok</div>', {
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
  const comp = createComponent(html`<div class="msg">{{ msg }}</div>`, {
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
  const undefCtx = createComponent('<div class="ctx-undef">ok</div>', {
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
  const comp = createComponent(html`<div class="no-auto">{{ msg }}</div>`, {
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
  const comp = createComponent('<div class="base">x</div>', {
    inheritAttrs: false,
  })

  createApp(
    { components: { comp } },
    {
      element: root,
      template:
        '<Comp class="host-class" :props="{ a: 1 }" :props-once="{ b: 2 }"></Comp>',
    },
  )

  const child = root.querySelector('.base') as HTMLElement
  expect(child.classList.contains('host-class')).toBe(false)
})
