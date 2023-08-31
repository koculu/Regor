import { test } from 'vitest'
import {
  IRegorContext,
  Ref,
  createApp,
  createComponent,
  html,
  ref,
} from '../../src'
import { htmlEqual } from '../common/html-equal'

test('should render components with reactive properties', () => {
  const root = document.createElement('<div>')

  const myComponent = createComponent(
    'MyComponent',
    () => ({
      prop1: ref('prop-1'),
      prop2: ref('prop-2'),
    }),
    {
      html: html`<div>{{ prop1 + '-' + prop2 }}</div>`,
    },
    {
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
      html: html`<div>
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

test('should render empty component', () => {
  const root = document.createElement('<div>')

  const myComponent = createComponent('MyComponent', () => ({}), {
    html: html``,
  })

  const app = createApp(
    {
      components: { myComponent },
    },
    {
      element: root,
      html: html`<MyComponent></MyComponent>`,
    },
  )
  htmlEqual(
    root.innerHTML,
    html`<!-- begin component: MYCOMPONENT--><!-- end component: MYCOMPONENT-->`,
  )
})

test('should render nested component with reactive properties', () => {
  const root = document.createElement('<div>')

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
    'MyComponent',
    (head) => ({
      item: head.props.item,
    }),
    {
      html: html`<div>
        name: {{ item.name }}
        <MyComponent r-for="child in item.children" :item="child"></MyComponent>
      </div>`,
    },
    {
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
      html: html`<MyComponent :item="treeItem"></MyComponent>`,
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
