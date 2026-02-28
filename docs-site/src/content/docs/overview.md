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

## Architecture Positioning

Regor is Vue-inspired in directive syntax, but different by architecture.

1. Regor does not rely on a Virtual DOM layer.
2. Regor can bind existing server-rendered/static markup in place.
3. Regor supports runtime composition and reentrance across already-mounted regions.
4. Regor keeps optimization escape hatches close to plain DOM and JavaScript.

## Why Teams Choose Regor

### 1. Runtime flexibility without lock-in

Regor can bind existing markup and progressively enhance real pages. You can adopt it incrementally instead of rewriting everything.

### 2. Reactivity that stays explicit

You get `ref`, `sref`, `computed`, `watchEffect`, `observe`, and batching primitives. State flows are explicit and composable.

Control APIs like `pause`, `resume`, and `entangle` help you shape update behavior intentionally in complex flows.

### 3. Directive model with real depth

Regor supports rich directive workflows:

1. Conditional rendering (`r-if`, `r-else-if`, `r-else`, `r-show`).
2. List rendering (`r-for` with keys, table use cases, nested structures).
3. Attribute/property/class/style/event binding (`r-bind`, `.prop`, `.camel`, `:class`, `:style`, `@event`).
4. Form binding (`r-model`) and dynamic components (`:is`, `:context`).

### 4. Excellent fit for mixed environments

Regor works well when part of your DOM is owned by other systems, or when performance-critical sections need custom handling.

### 5. TypeScript without framework-only indirection

Regor uses plain TypeScript code paths for app and component contexts (`createApp<T>`, `ComponentHead<TProps>`, interfaces/classes). You keep normal TS ergonomics without relying on custom file format compilers.

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

## Regor vs Vue (Practical Lens)

1. Vue is a strong default for framework-owned SPA architecture.
2. Regor is a strong default for progressive enhancement and static-first plus dynamic-island architectures.
3. Vue commonly centers build tooling for peak DX/perf in SPA workflows.
4. Regor keeps build-less and CSP-constrained runtime options first-class.
5. Both are capable; pick based on rendering ownership and deployment constraints.

## Practical Tradeoffs

Regor favors flexibility and control. In very binding-dense paths, runtime cost can grow with total DOM + binding volume. This is normal for highly dynamic runtime systems.

The upside is that Regor keeps optimization options open:

1. Reduce binding density where it matters.
2. Use stable keying and list strategies.
3. Drop to targeted custom logic in hot sections.
4. Keep the rest of the app high-level and maintainable.

## Recommended Reading Order

1. [Getting Started](/getting-started)
2. [Guide](/guide)
3. [Directives](/directives)
4. [API Reference](/api)
5. [Performance Guide](/guide/performance)

