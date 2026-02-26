---
title: Components
sidebar:
  order: 30
---

This guide documents how Regor components work in runtime, based on current implementation and tests.

## Create a Component

```ts
import { createComponent, html } from 'regor'

export const UserCard = createComponent(
  html`<article><h3 r-text="title"></h3></article>`,
  { props: ['title'] },
)
```

`createComponent(template, options)` supports:

1. Template from string: `createComponent('<div>...</div>')`
2. Template object with `template`
3. Template object with `element`
4. Template object with `selector`
5. Template object with `json`

Interpolation is enabled by default (`useInterpolation: true`).

## Register and Use Components

Register via app context:

```ts
createApp({
  components: { UserCard },
})
```

or via `RegorConfig.addComponent(...)` (registered/global style).

Tags resolve in component map using component name and kebab-case variant.

```html
<UserCard :title="activeUser.name" /> <user-card :title="activeUser.name" />
```

## Component Context and `ComponentHead`

Component context is created by `options.context(head)`.
`head` is `ComponentHead` and exposes:

1. `head.props`: resolved incoming props object.
2. `head.emit(event, detail)`: dispatches `CustomEvent` from host element.
3. `head.autoProps` (default `true`): auto-assigns props into component context fields.
4. `head.entangle` (default `true`): if both sides are refs, parent and component refs are two-way entangled during auto-props.
5. `head.enableSwitch` (default `false`): enables slot context switching to parent for slot templates.
6. `head.onAutoPropsAssigned`: callback after auto props assignment.
7. `head.unmount()`: removes mounted nodes in component range and calls unmounted hooks.

### Emit Example

```ts
class CardContext {
  title = ref('local')
  $emit?: (event: string, args: Record<string, unknown>) => void
  save = () => this.$emit?.('save', { title: this.title() })
}

const Card = createComponent('<button @click="save">Save</button>', {
  context: () => new CardContext(),
})
```

In parent:

```html
<Card @save="onSave($event)" />
```

## How Component Inputs Are Routed

On a component host tag, Regor routes bindings through two different channels:

1. **Component input channel**: values end up in `head.props` and can become component state.
2. **Attribute fallthrough channel**: values are copied as DOM attributes/class/style to rendered output root.

### 1) Declared single-prop bindings (component input channel)

Use:

1. `:x="..."`
2. `.x="..."`
3. `r-bind:x="..."`

These are treated as component props **only if `x` is declared in `props: [...]`**.

```ts
const Card = createComponent('<h3 r-text="title"></h3>', {
  props: ['title'],
  context: (head) => ({ title: head.props.title }),
})
```

```html
<Card :title="user.name"></Card> <Card r-bind:title="user.name"></Card>
```

If `x` is not declared in `props`, that single binding is treated as normal attribute fallthrough.

### 2) Object component input (`:context` / `r-context`)

Use:

```html
<Card :context="{ title: user.name, badge: role }"></Card>
<Card r-context="{ title: user.name, badge: role }"></Card>
```

This is object-style component input and does not require keys to be listed in `props`.

### 3) Object-form `r-bind` uses the attribute channel

```html
<Card r-bind="{ id: cardId, 'data-role': role }"></Card>
```

For component hosts, this form is processed as attribute forwarding to rendered output nodes.
It does not go through declared-prop resolution or `:context` object assignment.

`r-bind:x="..."` is different: it is single-key binding and can map to component input when `x` is declared in `props`.

### autoProps and entangle behavior

1. `head.autoProps = false`: component author maps from `head.props` manually.
2. `head.autoProps = true` + `head.entangle = true`: ref-to-ref inputs are two-way entangled.
3. `head.autoProps = true` + `head.entangle = false`: ref-to-ref inputs are initial snapshot only.
4. Primitive/object values targeting existing component ref fields are applied to those refs.

## Slots

Supported slot patterns:

1. Default slot: `<slot></slot>`
2. Named slot: `<slot name="extra"></slot>`
3. Named slot shorthand in component template: `<slot #extra></slot>`
4. Host-side named template: `<template name="extra">...</template>` or `<template #extra>...</template>`
5. Fallback slot content when host does not provide matching content.

Default slot behavior:

1. If host provides unnamed content, it is used.
2. Named-only template shortcuts are not injected into default slot.

For parent-context slot expression switching, enable:

```ts
context: (head) => {
  head.enableSwitch = true
  return {}
}
```

## Attribute inheritance (`inheritAttrs`)

By default, component host attributes are inherited into component output root (`inheritAttrs: true`).

Details:

1. `class` is merged.
2. `style` properties are merged.
3. Other attributes are copied.
4. `:context` is excluded from inherit copy.
5. If component has multiple root elements, `r-inherit` can mark intended inheritor.

Set `inheritAttrs: false` to disable this behavior.

## Dynamic components with `:is`

```html
<div :is="currentCard" :item="item"></div>
```

Switching `:is` remounts target component selection while keeping reactive prop flow behavior.

## Nested components and lifecycle

Nested component trees are supported (`r-for`, `r-if`, nested slots).
Component lifecycle hooks run through standard mounted/unmounted flow.
Unmount cleans child component bindings and observers.

## Best Practices

1. Declare single props in `props` when using individual bindings.
2. Use `:context` for object-style prop passing.
3. Use `head.enableSwitch = true` when slot content must evaluate in parent context.
4. Decide `autoProps` + `entangle` explicitly when designing parent-child data ownership.
5. Keep fallback slot content for robust component defaults.
6. Use stable keys for component lists rendered with `r-for`.

## See Also

1. [createComponent API](/api/createComponent)
2. [Directive: :is](/directives/is)
3. [Directive: :context](/directives/context)
4. [TypeScript Guide](/guide/typescript)
5. [Directive: r-for](/directives/r-for)
