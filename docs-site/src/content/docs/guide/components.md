---
title: Components
sidebar:
  order: 30
---

This guide documents how Regor components work in runtime, based on current implementation and tests.

## Define a Component

```ts
import { defineComponent, html } from 'regor'

export const UserCard = defineComponent(
  html`<article><h3 r-text="title"></h3></article>`,
  { props: ['title'] },
)
```

`defineComponent(template, options)` supports:

1. Template from string: `defineComponent('<div>...</div>')`
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
7. `head.findContext(ContextClass, occurrence?)`: returns matching parent context instance from `head.ctx` by `instanceof`, or `undefined`.
8. `head.requireContext(ContextClass, occurrence?)`: resolves matching parent context instance from `head.ctx` by `instanceof`; throws if the selected occurrence does not exist.
9. `head.validateProps(schema)`: validates selected incoming props at runtime.
10. `head.unmount()`: removes mounted nodes in component range and calls unmounted hooks.

`occurrence` is zero-based:

1. `0` (default): first match
2. `1`: second match
3. `2`: third match

### Emit Example

```ts
class CardContext {
  title = ref('local')
  $emit?: (event: string, args: Record<string, unknown>) => void
  save = () => this.$emit?.('save', { title: this.title() })
}

const Card = defineComponent('<button @click="save">Save</button>', {
  context: () => new CardContext(),
})
```

In parent:

```html
<Card @save="onSave($event)" />
```

### Parent context lookup example

```ts
class AppServices {
  api = '/v1'
}

class OuterLayoutContext {}

const Child = defineComponent('<div></div>', {
  context: (head) => {
    const services = head.requireContext(AppServices)
    const secondLayout = head.findContext(OuterLayoutContext, 1)
    return { services, secondLayout }
  },
})
```

## Runtime Prop Validation

Regor lets component authors validate incoming props inside `context(head)`.

This validation model is intentionally runtime-first:

1. It is fully opt-in.
2. It validates only the keys you list.
3. It follows the active `propValidationMode` config.
4. It does not coerce values.
5. It does not mutate `head.props`.

Use the built-in validators through `pval`:

```ts
import { defineComponent, html, pval } from 'regor'

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
    context: (head) => {
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

### Built-in validators

`pval` currently provides:

1. `pval.isString`
2. `pval.isNumber`
3. `pval.isBoolean`
4. `pval.isClass(SomeClass)`
5. `pval.optional(validator)`
6. `pval.nullable(validator)`
7. `pval.or(...validators)`
8. `pval.oneOf([...])`
9. `pval.arrayOf(validator)`
10. `pval.shape({ ... })`
11. `pval.refOf(validator)`
12. `pval.describe(value)`
13. `pval.fail(name, detail)`

Example:

```ts
head.validateProps({
  title: pval.isString,
  count: pval.optional(pval.isNumber),
  mode: pval.oneOf(['create', 'edit'] as const),
  value: pval.or(pval.isString, pval.isNumber),
  tags: pval.arrayOf(pval.isString),
  meta: pval.shape({
    slug: pval.isString,
    retries: pval.nullable(pval.isNumber),
  }),
})
```

### Single-prop bindings and refs

Dynamic single-prop bindings such as `:title="titleRef"` flow into component props as refs.
When validating that runtime value, use `pval.refOf(...)`:

```ts
type TitleCard = {
  title: Ref<string>
  summary?: string
}

const TitleCard = defineComponent<TitleCard>(html`<h3>{{ summary }}</h3>`, {
  props: ['title'],
  context: (head) => {
    head.validateProps({
      title: pval.refOf(pval.isString),
    })

    return {
      ...head.props,
      summary: head.props.title(),
    }
  },
})
```

### Object input validation

For object-style `:context="{ ... }"` values, validate the plain runtime object shape:

```ts
head.validateProps({
  meta: pval.shape({
    slug: pval.isString,
  }),
})
```

### Custom validators

Users are not limited to the built-in validators. Any function matching `PropValidator<T>` can be used:

```ts
import { pval, type PropValidator } from 'regor'

const isNonEmptyString: PropValidator<string> = (value, name) => {
  if (typeof value !== 'string' || value.trim() === '') {
    pval.fail(name, `expected non-empty string, ${pval.describe(value)}`)
  }
}

head.validateProps({
  title: isNonEmptyString,
})
```

Custom validators can also use the third `head` argument:

```ts
const startsWithParentPrefix: PropValidator<string> = (value, name, head) => {
  const ctx = head.requireContext(AppServices)
  if (typeof value !== 'string' || !value.startsWith(ctx.prefix)) {
    pval.fail(name, `expected prefixed value, ${pval.describe(value)}`)
  }
}
```

### When to use validation

Validation is most useful when:

1. The component depends on a required runtime contract.
2. The same component is used in many places.
3. You want an explicit runtime guard before local state mapping.
4. You set `head.autoProps = false` and map incoming props manually.

### Validation mode

Validation behavior is configured through `RegorConfig.propValidationMode`:

```ts
import { RegorConfig } from 'regor'

const config = new RegorConfig()
config.propValidationMode = 'warn'
```

Modes:

1. `'throw'` (default): throws on the first invalid prop.
2. `'warn'`: sends the validation failure to `warningHandler.warning(...)` and continues.
3. `'off'`: skips runtime prop validation.

Pass the config into `createApp(...)` to apply the mode for that app:

```ts
createApp(appContext, template, config)
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
const Card = defineComponent('<h3 r-text="title"></h3>', {
  props: ['title'],
  context: (head) => ({ title: head.props.title }),
})
```

```html
<Card :title="user.name"></Card> <Card r-bind:title="user.name"></Card>
```

If `x` is not declared in `props`, that single binding is treated as normal attribute fallthrough.

Reactive behavior of single-prop bindings:

1. If the binding expression resolves to a ref, the child receives a live reactive prop channel.
2. If the binding expression resolves to a non-ref value, the child receives the current resolved value.

Example:

```html
<Btn :disabled="busy || !pendingDeleteHostname"></Btn>
```

This passes the current boolean result.

If you want the computed prop expression itself to stay reactive as a component
input, wrap it with `ref(...)`:

```html
<Btn :disabled="ref(busy || !pendingDeleteHostname)"></Btn>
```

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
5. For single-prop bindings, wrapping an expression in `ref(...)` gives the child a live reactive prop source even when the expression evaluates to a non-ref.

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
3. Use `head.validateProps(...)` for explicit runtime prop contracts.
4. Use `pval.refOf(...)` for dynamic single-prop bindings that arrive as refs.
5. Use `head.enableSwitch = true` when slot content must evaluate in parent context.
6. Decide `autoProps` + `entangle` explicitly when designing parent-child data ownership.
7. Keep fallback slot content for robust component defaults.
8. Use stable keys for component lists rendered with `r-for`.

## See Also

1. [defineComponent API](/api/defineComponent)
2. [pval API](/api/pval)
3. [Directive: :is](/directives/is)
4. [Directive: :context](/directives/context)
5. [TypeScript Guide](/guide/typescript)
6. [Directive: r-for](/directives/r-for)
7. [contextRegistry API](/api/contextRegistry)
