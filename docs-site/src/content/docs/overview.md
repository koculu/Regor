---
title: Overview
sidebar:
  order: 3
---

Regor is a reactive UI framework built for developers who want direct control over the DOM, expressive runtime behavior, and strong TypeScript ergonomics.

It is designed to be practical, not restrictive.

## What Regor Optimizes For

1. **Control over abstraction**
   Regor does not force one universal rendering model for every case. You can use high-level directives where they help and drop to direct JavaScript/DOM logic where needed.

2. **Runtime flexibility**
   Regor can bind existing HTML markup and progressively enhance server-rendered or mixed-stack pages without requiring a full ownership rewrite.

3. **Composable reactivity**
   Regor provides `ref`, `sref`, computed and observer-based primitives so you can choose the right level of reactivity per feature.

4. **TypeScript-first development**
   Components, props, and reactive state can be modeled in TypeScript directly, with predictable runtime behavior.

5. **Security-aware runtime evaluation**
   Regor supports CSP-friendly environments and practical secure evaluation scenarios for runtime expressions.

## Design Philosophy

Regor intentionally avoids over-constraining architecture choices.

That means:

1. Component and context patterns are flexible.
2. Parent/child interaction is not artificially limited to one rigid style.
3. Framework internals aim to stay understandable and hackable for real-world optimization work.

## Tradeoff Model

Regor prioritizes flexibility and control. In highly generic, binding-dense scenarios, that flexibility can add runtime overhead compared to highly specialized pipelines.

In return, Regor gives you:

1. Better escape hatches for custom optimization.
2. Better fit for progressive enhancement and mixed DOM ownership.
3. A development model that does not force one-size-fits-all constraints.

## When Regor Is a Strong Fit

Regor is especially strong when you need:

1. Runtime binding over existing markup.
2. Fine-grained control over component and context behavior.
3. Custom domain-specific rendering optimizations.
4. Direct integration with other DOM-manipulating systems.

## Next Steps

1. Read [Getting Started](/getting-started).
2. Explore [Directives](/directives).
3. Use the [Performance Guide](/performance) for profiling and optimization strategy.

[Back to the main](/)
