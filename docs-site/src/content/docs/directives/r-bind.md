---
title: r-bind Directive
---

`r-bind` is Regor’s generic binding directive.

It maps to attribute binding by default, with property binding available via shorthand/flag.

## Syntax

```html
<button r-bind:title="tooltip"></button>
<button :title="tooltip"></button>
<input .value="text" />
<input :value.prop="text" />
```

1. `:` is shorthand for `r-bind:` and uses attribute binding.
2. `.` shorthand uses property binding.
3. `.prop` flag switches `:` binding to property binding.
4. `.camel` camelizes option key before binding.

## Exact runtime mapping

From `RegorConfig`:

1. `r-bind:*` and `:*` use `attrDirective`.
2. `.*` and `:*.prop` use `propDirective`.
3. `:class` / `r-bind:class` are routed to `classDirective`.
4. `:style` / `r-bind:style` are routed to `styleDirective`.

## Supported value shapes

When an option is present (`:title="x"`), the first resolved value is used.

When binding without an option (`r-bind="expr"`), these forms are supported:

1. Object: `{ key: value, ... }`
2. Pair array: `['key', value]` (and arrays of pairs)
3. Flat key/value sequence: `key, value, key2, value2`

Example:

```html
<div r-bind="{ id: boxId, title: hint }"></div>
<div r-bind="[dynKey, dynValue]"></div>
```

## Dynamic key binding

For template-authored dynamic option keys, Regor uses normalized dynamic markers:

```html
<button r-bind:_d_dynamic-key_d_="value"></button>
```

When dynamic **attribute** key changes, previous attribute is removed and new attribute is set.

## Notes

1. Attribute path handles boolean attributes and `xlink:*` attributes.
2. For DOM properties (`value`, `checked`, `innerHTML`, etc.), use `.` shorthand or `.prop`.
3. For component prop-object assignment, use [`:context`](./context), not `r-bind="{...}"`.

## Example

```html
<a :href="profileUrl" :title="'Open ' + user.name">Profile</a>
<input .value="query" @input="query = $event.target.value" />
<div :class="{ active: isActive }" :style="{ color: tone }"></div>
```

## See Also

1. [r-text](./r-text)
2. [r-model](./r-model)
3. [r-on](./r-on)
4. [r-for](./r-for)


