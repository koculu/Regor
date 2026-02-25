---
title: r-text Directive
---

`r-text` binds an expression to an element’s `textContent`.

It is the safest and most direct way to render text output.

## Syntax

```html
<p r-text="expression"></p>
```

## Basic Example

```html
<p r-text="message"></p>
```

When `message` changes, the element text updates reactively.

## Expression Example

```html
<p r-text="user.firstName + ' ' + user.lastName"></p>
```

## `r-text` vs `{{ ... }}`

Both are valid. Prefer `r-text` when:

1. You want explicit binding at element level.
2. You are optimizing repeated row templates and want predictable binding points.
3. You want to avoid accidental surrounding whitespace behavior from text nodes.

## Security and Behavior

1. `r-text` writes plain text, not HTML.
2. HTML tags in values are escaped as text.
3. Use [`r-html`](./r-html) only when you intentionally need HTML rendering.

## Common Patterns

```html
<li r-for="row in rows" :key="row.id">
  <span r-text="row.id"></span>
  <span r-text="row.label"></span>
</li>
```

This is a clear and performant default for list text output.

## See Also

1. [r-bind](./r-bind)
2. [r-html](./r-html)
3. [r-for](./r-for)
