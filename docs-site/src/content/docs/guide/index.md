---
title: Guide
sidebar:
  order: 4
---

The Guide explains how Regor behaves in real runtime usage, with patterns that map directly to production code.

## Guide Map

1. [Reactivity](./reactivity)  
   Core primitives (`ref`, `sref`, computed, observers), update semantics, and state design.

2. [Templates and Expressions](./templates)  
   Interpolation transform, parser/evaluator capabilities, and template authoring patterns.

3. [Components](./components)  
   Component creation, input channels (`:x`, `r-bind:x`, `:context`, `r-context`), slots, and inherit behavior.

4. [TypeScript](./typescript)  
   Strong typing patterns for app contexts, class-based contexts, and `ComponentHead<T>`.

5. [Lifecycle and Cleanup](./lifecycle-and-cleanup)  
   Mounted/unmounted hooks, `unmount` vs `unbind`, and `drainUnbind` usage.

6. [Mounting](./mounting)  
   Static-first + dynamic islands and existing-markup binding patterns.

7. [Persisted State](./persisted-state)  
   `persist(...)` patterns for durable reactive state.

8. [Performance](./performance)  
   Benchmark methodology, bottleneck analysis, and optimization workflow.

9. [Troubleshooting](./troubleshooting)  
   Symptom -> cause -> fix guide for common runtime issues.

