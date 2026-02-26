---
title: Getting Started
sidebar:
  order: 3
---

Regor binds runtime behavior directly to DOM you already have, or to template
content you provide at mount time.

This means you can start from static HTML, mount only where needed, and scale
to multiple independent runtime islands on the same page.

## Install

```sh
yarn add regor
```

```sh
npm install regor
```

## Quick Start (TypeScript)

```ts
import { createApp, html, ref } from 'regor'

const app = createApp(
  {
    count: ref(0),
    inc() {
      this.count(this.count() + 1)
    },
  },
  {
    element: document.querySelector('#app')!,
    template: html`
      <section>
        <button @click="inc">Increment</button>
        <p>Count: <span r-text="count"></span></p>
      </section>
    `,
  },
)

// optional teardown
// app.unbind()
// app.unmount()
```

## CDN ESM

```html
<div id="app"></div>
<script type="module">
  import { createApp, ref } from 'https://unpkg.com/regor/dist/regor.es2022.esm.prod.js'

  createApp(
    {
      message: ref('Hello from CDN'),
    },
    {
      element: document.querySelector('#app'),
      template: '<h1 r-text="message"></h1>',
    },
  )
</script>
```

## Core Mount Modes

1. Bind existing markup in place:

```ts
createApp(
  { userName: ref('Ada') },
  { selector: '#profile-island' },
)
```

2. Replace root content from template string:

```ts
createApp(
  { title: ref('Home') },
  {
    selector: '#app',
    template: '<h1 r-text="title"></h1>',
  },
)
```

3. Replace root content from JSON template:

```ts
createApp(
  { label: ref('Save') },
  {
    element: document.querySelector('#app')!,
    json: { t: 'button', a: { 'r-text': 'label' } },
  },
)
```

## Reactivity Basics

`ref` for values and deep object conversion:

```ts
import { ref } from 'regor'

const count = ref(0)
count(1)
console.log(count())
```

`sref` for shallow object state:

```ts
import { sref } from 'regor'

const user = sref({ name: 'Ada', age: 30 })
user().name = 'Grace'
user({ ...user(), age: 31 })
```

Inside templates, refs are auto-unwrapped, so use `count`, `user.name`, not
`count()` or `.value`.

## Component Quick Example

```ts
import { createApp, createComponent, ref } from 'regor'

const UserCard = createComponent('<article><h3 r-text="name"></h3></article>', {
  props: ['name'],
  context: (head) => ({
    name: head.props.name ?? 'Anonymous',
  }),
})

createApp({
  components: { UserCard },
  activeName: ref('Ada Lovelace'),
})
```

```html
<UserCard :name="activeName"></UserCard>
```

## Template Syntax You Will Use Daily

1. `r-text="expr"` for text.
2. `:attr="expr"` or `r-bind:attr="expr"` for attributes.
3. `.prop="expr"` or `:prop.prop="expr"` for DOM properties.
4. `@event="handler"` for events.
5. `r-if` / `r-else-if` / `r-else` for conditional branches.
6. `r-for="item, #i in items"` for loops.
7. `:context="{ ... }"` / `r-context="{ ... }"` for object-style component input.
8. `{{ expr }}` and `[[ expr ]]` interpolation (enabled by default).

## Where To Go Next

1. [Overview](./overview)
2. [Guide](./guide)
3. [Directives](./directives)
4. [API Reference](./api)
5. [Guide: Mounting](./guide/mounting)
