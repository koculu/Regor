---
title: Directives
sidebar:
  order: 5
---

Directives are Regor’s runtime template control surface.

By default, directive names start with `r-`. You can customize the prefix with `RegorConfig`.

## Core Rules

1. `r-` directives are explicit full-form syntax.
2. `:` is shorthand for `r-bind`.
3. `@` is shorthand for `r-on`.
4. `.` shorthand binds DOM properties (equivalent to `r-bind.prop`).

## Binding

1. [`r-text`](./r-text): text content binding.
2. [`r-html`](./r-html): HTML content binding.
3. [`r-bind`](./r-bind): attributes/properties/object binding.
4. [`r-model`](./r-model): form two-way binding.
5. [`r-on`](./r-on): event binding.
6. [`r-show`](./r-show): conditional visibility.
7. [`:class`](./class): dynamic class binding.
8. [`:style`](./style): dynamic style binding.

## Control Flow

1. [`r-if`](./r-if), `r-else-if`, `r-else`: conditional branches.
2. [`r-for`](./r-for): list/object iteration with keying support.

## Component and Utility

1. [`:is`](./is): dynamic component selection.
2. [`:context`](./context): component prop object binding.
3. [`:ref`](./ref): element/component references.
4. [`r-pre`](./r-pre): skip compilation for subtree.
5. [`r-teleport`](./r-teleport): move DOM subtree to another target.

## Important Keying Note

In `r-for`, both `key="row.id"` and `:key="row.id"` are expression bindings in Regor templates. Both are supported. Nested paths like `a.b.c.d` are supported.

Use stable keys whenever list identity matters.

## Recommendation

Read in this order:

1. [`r-bind`](./r-bind)
2. [`r-text`](./r-text)
3. [`r-if`](./r-if)
4. [`r-for`](./r-for)
5. [`r-model`](./r-model)
