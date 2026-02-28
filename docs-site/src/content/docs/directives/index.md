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

1. [`r-text`](/directives/r-text): text content binding.
2. [`r-html`](/directives/r-html): HTML content binding.
3. [`r-bind`](/directives/r-bind): attributes/properties/object binding.
4. [`r-model`](/directives/r-model): form two-way binding.
5. [`r-on`](/directives/r-on): event binding.
6. [`r-show`](/directives/r-show): conditional visibility.
7. [`:class`](/directives/class): dynamic class binding.
8. [`:style`](/directives/style): dynamic style binding.

## Control Flow

1. [`r-if`](/directives/r-if), `r-else-if`, `r-else`: conditional branches.
2. [`r-for`](/directives/r-for): list/object iteration with keying support.

## Component and Utility

1. [`:is`](/directives/is): dynamic component selection.
2. [`:context`](/directives/context): component prop object binding.
3. [`:ref`](/directives/ref): element/component references.
4. [`r-pre`](/directives/r-pre): skip compilation for subtree.
5. [`r-teleport`](/directives/r-teleport): move DOM subtree to another target.

## Important Keying Note

In `r-for`, both `key="row.id"` and `:key="row.id"` are expression bindings in Regor templates. Both are supported. Nested paths like `a.b.c.d` are supported.

Use stable keys whenever list identity matters.

## Recommendation

Read in this order:

1. [`r-bind`](/directives/r-bind)
2. [`r-text`](/directives/r-text)
3. [`r-if`](/directives/r-if)
4. [`r-for`](/directives/r-for)
5. [`r-model`](/directives/r-model)
