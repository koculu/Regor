---
title: pval
---

## Overview

`pval` is the built-in prop-validator namespace for `head.validateProps(...)`.

It groups Regor's built-in runtime validators under one object so component code stays compact and autocomplete-friendly:

```ts
import { pval } from 'regor'
```

```ts
head.validateProps({
  title: pval.isString,
  count: pval.optional(pval.isNumber),
  tags: pval.arrayOf(pval.isString),
})
```

## When to use it

Use `pval` inside `defineComponent(..., { context(head) { ... } })` when you want an explicit runtime contract for component inputs.

Validation is:

1. opt-in
2. local to the component
3. runtime-only
4. non-coercive
5. controlled by `RegorConfig.propValidationMode`

## Validation mode

Runtime prop-validation behavior is controlled through `RegorConfig.propValidationMode`:

```ts
import { RegorConfig } from 'regor'

const config = new RegorConfig()
config.propValidationMode = 'warn'
```

Modes:

1. `'throw'` (default): invalid props throw immediately.
2. `'warn'`: invalid props are reported through `warningHandler.warning(...)`.
3. `'off'`: runtime prop validation is skipped.

## Built-in validators

### `pval.isString`

Ensures a prop is a string.

```ts
head.validateProps({
  title: pval.isString,
})
```

### `pval.isNumber`

Ensures a prop is a number.

```ts
head.validateProps({
  count: pval.isNumber,
})
```

### `pval.isBoolean`

Ensures a prop is a boolean.

```ts
head.validateProps({
  disabled: pval.isBoolean,
})
```

### `pval.isClass(SomeClass)`

Ensures a prop is an instance of a runtime class.

```ts
head.validateProps({
  editor: pval.isClass(HostEditorTab),
})
```

This works only with runtime classes, not interfaces or type aliases.

### `pval.optional(validator)`

Allows `undefined`. Otherwise delegates to the wrapped validator.

```ts
head.validateProps({
  count: pval.optional(pval.isNumber),
})
```

### `pval.nullable(validator)`

Allows `null`. Otherwise delegates to the wrapped validator.

```ts
head.validateProps({
  count: pval.nullable(pval.isNumber),
})
```

### `pval.oneOf(values)`

Ensures the value is one of the provided literals.

```ts
head.validateProps({
  mode: pval.oneOf(['create', 'edit'] as const),
})
```

### `pval.arrayOf(validator)`

Ensures the value is an array and validates each entry.

```ts
head.validateProps({
  tags: pval.arrayOf(pval.isString),
})
```

Nested errors include the failing index:

```txt
Invalid prop "tags[1]": expected string.
```

### `pval.shape({ ... })`

Ensures the value is an object and validates selected nested keys.

```ts
head.validateProps({
  meta: pval.shape({
    slug: pval.isString,
    retries: pval.nullable(pval.isNumber),
  }),
})
```

Nested errors include the failing path:

```txt
Invalid prop "meta.slug": expected string.
```

### `pval.refOf(validator)`

Ensures the prop is a Regor ref and validates its current value using the wrapped validator.

Use this for dynamic single-prop bindings such as `:title="titleRef"`:

```ts
head.validateProps({
  title: pval.refOf(pval.isString),
})
```

## Dynamic props vs object props

Single-prop bindings like `:title="titleRef"` may arrive as refs at runtime, so `pval.refOf(...)` is appropriate there.

Object-style `:context="{ meta: { slug: 'x' } }"` values can be validated directly with `pval.shape(...)`.

## Custom validators

You are not limited to `pval`. Users can write any validator that matches `PropValidator<T>`:

```ts
import { type PropValidator } from 'regor'

const isNonEmptyString: PropValidator<string> = (value, name) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Invalid prop "${name}": expected non-empty string.`)
  }
}
```

Custom validators also receive `head` as the third argument:

```ts
const startsWithPrefix: PropValidator<string> = (value, name, head) => {
  const services = head.requireContext(AppServices)
  if (typeof value !== 'string' || !value.startsWith(services.prefix)) {
    throw new Error(`Invalid prop "${name}": expected prefixed value.`)
  }
}
```

## See Also

1. [defineComponent](/api/defineComponent)
2. [Components guide](/guide/components)
3. [TypeScript guide](/guide/typescript)
