---
title: Overview
sidebar:
  order: 2
---

Regor is a reactive UI library designed for engineers who want:

1. Direct control over runtime behavior.
2. A powerful template/directive model.
3. TypeScript-friendly reactivity primitives.
4. Freedom to optimize with plain JavaScript and DOM when needed.

Regor is intentionally practical. It does not force one rigid rendering architecture for every use case.

## Why Teams Choose Regor

### 1. Runtime flexibility without lock-in

Regor can bind existing markup and progressively enhance real pages. You can adopt it incrementally instead of rewriting everything.

### 2. Reactivity that stays explicit

You get `ref`, `sref`, `computed`, `watchEffect`, `observe`, and batching primitives. State flows are explicit and composable.

### 3. Directive model with real depth

Regor supports rich directive workflows:

1. Conditional rendering (`r-if`, `r-else-if`, `r-else`, `r-show`).
2. List rendering (`r-for` with keys, table use cases, nested structures).
3. Attribute/property/class/style/event binding (`r-bind`, `.prop`, `.camel`, `:class`, `:style`, `@event`).
4. Form binding (`r-model`) and dynamic components (`:is`, `:context`).

### 4. Excellent fit for mixed environments

Regor works well when part of your DOM is owned by other systems, or when performance-critical sections need custom handling.

## Core Philosophy

Regor’s philosophy is:

1. Keep defaults productive.
2. Keep escape hatches available.
3. Keep internals understandable.
4. Keep control in developers’ hands.

## What Regor Is Not Trying To Be

Regor is not built around artificial constraints to optimize only one benchmark shape. It is built for real product constraints where integration flexibility matters.

If your app needs:

1. Existing-markup binding.
2. Runtime composition.
3. Context flexibility.
4. Controlled optimization paths.

Regor is a strong fit.

## Practical Tradeoffs

Regor favors flexibility and control. In very binding-dense paths, runtime cost can grow with total DOM + binding volume. This is normal for highly dynamic runtime systems.

The upside is that Regor keeps optimization options open:

1. Reduce binding density where it matters.
2. Use stable keying and list strategies.
3. Drop to targeted custom logic in hot sections.
4. Keep the rest of the app high-level and maintainable.

## Recommended Reading Order

1. [Getting Started](./getting-started)
2. [Guide](./guide)
3. [Directives](./directives)
4. [API Reference](./api)
5. [Performance Guide](./guide/performance)

