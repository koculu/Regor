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
import { ComponentHead, defineComponent, html, type Ref, ref } from 'regor'

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

const Card = defineComponent<CardContext>(
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

## Typed runtime prop validation with `head.validateProps(...)`

`validateProps(...)` is typed from `ComponentHead<T>`, so editor completion can suggest known prop keys while you write the schema.

Use the built-in validators through `pval`:

```ts
import { ComponentHead, defineComponent, html, pval } from 'regor'

type EditorCard = {
  title: string
  count?: number
  mode: 'create' | 'edit'
  summary?: string
}

const EditorCard = defineComponent<EditorCard>(
  html`<article>{{ summary }}</article>`,
  {
    props: ['title', 'count', 'mode'],
    context: (head: ComponentHead<EditorCard>) => {
      head.validateProps({
        title: pval.isString,
        count: pval.optional(pval.isNumber),
        mode: pval.oneOf(['create', 'edit'] as const),
      })

      return {
        ...head.props,
        summary: `${head.props.title}:${head.props.mode}:${head.props.count ?? 'none'}`,
      }
    },
  },
)
```

For dynamic single-prop bindings that arrive as refs, type the prop accordingly and validate with `pval.refOf(...)`:

```ts
import { ComponentHead, defineComponent, html, pval, type Ref } from 'regor'

type TitleCard = {
  title: Ref<string>
  summary?: string
}

const TitleCard = defineComponent<TitleCard>(
  html`<h3>{{ summary }}</h3>`,
  {
    props: ['title'],
    context: (head: ComponentHead<TitleCard>) => {
      head.validateProps({
        title: pval.refOf(pval.isString),
      })

      return {
        ...head.props,
        summary: head.props.title(),
      }
    },
  },
)
```

You can also write custom validators:

```ts
import { pval, type PropValidator } from 'regor'

const isNonEmptyString: PropValidator<string> = (value, name) => {
  if (typeof value !== 'string' || value.trim() === '') {
    pval.fail(name, 'expected non-empty string')
  }
}
```

## Typed class components and behavior controls

You can type `head` in class constructors and use runtime behavior flags intentionally:

1. `head.autoProps` to disable automatic parent-input assignment.
2. `head.entangle` to choose two-way ref sync vs snapshot behavior.
3. `head.enableSwitch` for parent-context slot evaluation.
4. `head.findContext(ServiceClass, occurrence?)` for optional parent context lookup.
5. `head.requireContext(ServiceClass, occurrence?)` for required parent context lookup.

Example:

```ts
class AppServices {
  readonly apiBase = '/v1'
}

class ChildContext {
  apiBase: string

  constructor(head: ComponentHead<object>) {
    const services = head.requireContext(AppServices)
    this.apiBase = services.apiBase
  }
}
```

## See Also

1. [Components](/guide/components)
2. [defineComponent API](/api/defineComponent)
3. [pval API](/api/pval)
4. [createApp API](/api/createApp)
5. [contextRegistry API](/api/contextRegistry)
