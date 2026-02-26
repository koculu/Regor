---
title: TypeScript
sidebar:
  order: 40
---

Regor has strong TypeScript support across app context, component context, and component head typing.

## Why this matters

You can model app and component state with real TypeScript types (interfaces/classes), and keep runtime template syntax concise.

In template expressions, Regor resolves refs automatically, so you write `user.name` instead of `user.name.value` or `user.name()`.

## Typed app context with interfaces

```ts
import { createApp, html, type IRegorContext, type Ref, ref } from 'regor'

interface TodoItem {
  id: number
  label: string
}

interface MyApp extends IRegorContext {
  title: Ref<string>
  items: Ref<TodoItem[]>
}

createApp<MyApp>(
  {
    title: ref('Todos'),
    items: ref([{ id: 1, label: 'Ship' }]),
  },
  {
    element: document.querySelector('#app')!,
    template: html`<h1 r-text="title"></h1>
      <li r-for="item in items" :key="item.id" r-text="item.label"></li>`,
  },
)
```

## Typed class app context with `useScope`

```ts
import { createApp, html, ref, useScope } from 'regor'

class BoardApp {
  query = ref('')
  count = ref(0)
  increment = () => this.count(this.count() + 1)
}

createApp(
  useScope(() => new BoardApp()),
  {
    element: document.querySelector('#app')!,
    template: html`<input r-model="query" />
      <button @click="increment">+1</button>
      <p>{{ query }} - {{ count }}</p>`,
  },
)
```

## Typed component props and context with `ComponentHead<TProps>`

```ts
import { ComponentHead, createComponent, html, type Ref, ref } from 'regor'

type CardProps = {
  title: Ref<string>
}

class CardContext {
  title: Ref<string>
  selected = ref(false)

  constructor(head: ComponentHead<CardProps>) {
    this.title = head.props.title
  }
}

const Card = createComponent<CardContext>(
  html`<article :class="{ selected: selected }">
    <h3 r-text="title"></h3>
  </article>`,
  {
    props: ['title'],
    context: (head) => new CardContext(head),
  },
)
```

```html
<Card :title="user.name"></Card>
```

## Typed class components and behavior controls

You can type `head` in class constructors and use runtime behavior flags intentionally:

1. `head.autoProps` to disable automatic parent-input assignment.
2. `head.entangle` to choose two-way ref sync vs snapshot behavior.
3. `head.enableSwitch` for parent-context slot evaluation.

## See Also

1. [Components](/guide/components)
2. [createComponent API](/api/createComponent)
3. [createApp API](/api/createApp)
