---
title: Performance Guide
sidebar:
  order: 5
---

This page summarizes practical performance guidance for Regor apps, based on real benchmark work and profiling.

## What Matters Most

Performance is usually dominated by:

1. Number of DOM nodes created/updated.
2. Number of reactive bindings attached.
3. Amount of work done per binding (`r-text`, `:class`, `:style`, etc.).
4. List size and list mutation strategy (`r-for` + `:key`).

In large templates, total cost is almost always cumulative. Many small costs can add up.

## Benchmark Correctness Checklist

Before comparing Regor with another framework, ensure:

1. Same rendered output and same feature set on both sides.
2. Same timing boundary on both sides (for example, both measured with one `requestAnimationFrame` after mount, or neither).
3. Warmup runs are excluded from reported numbers.
4. A/B alternating order is used per sample to reduce bias.
5. Median and P90 are reported, not single-run results.

If timing boundaries differ, benchmark numbers are not comparable.

## Interpreting Numbers

Use this rough UX scale for one interaction:

1. Under `100ms`: usually feels instant.
2. `100ms` to `300ms`: noticeable, usually acceptable.
3. Over `300ms`: often perceived as slow.

Absolute numbers matter more than framework-vs-framework deltas if user experience is already smooth on target devices.

## Large Lists: Recommended Strategy

If you render many rows:

1. Prefer windowing/pagination/chunking over fully reactive huge lists.
2. Keep row templates minimal.
3. Avoid expensive computed object bindings per row where possible.
4. Use stable keys (`:key`) for predictable updates.

## Regor-Specific Strength

Regor is designed for runtime flexibility:

1. Bind to existing HTML markup in place.
2. Mix framework bindings with direct DOM/JS escape hatches in critical paths.
3. Keep control when you need custom, domain-specific optimization.

This flexibility is valuable in progressive enhancement and mixed-stack environments.

## Practical Optimization Order

When a page feels slow, optimize in this order:

1. Reduce rendered nodes.
2. Reduce active bindings per node.
3. Simplify hot directives in repeated rows.
4. Profile and fix the top one or two real hotspots.
5. Only then consider deeper framework-internal changes.

## When Not To Optimize

If your measured path is already in an acceptable UX range, prioritize maintainability and product features. Complexity-heavy hot paths are only worth it when they solve a real user-visible bottleneck.
