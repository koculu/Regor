---
title: Performance
sidebar:
  order: 80
---

This guide focuses on practical, reliable performance work for Regor applications.

## Performance Priorities

Real-world cost is mostly driven by:

1. Number of DOM nodes created/updated.
2. Number of active bindings per node.
3. Work performed by each binding expression.
4. List scale and mutation pattern (`r-for` + key strategy).

Many small costs add up. Always profile the full path, not one isolated helper.

## Benchmark Correctness Checklist

When comparing Regor with any other framework:

1. Same rendered output and same feature set on both sides.
2. Same timing boundaries for both sides.
3. Warmup rounds are excluded from measurements.
4. A/B alternating order is used per sample to reduce bias.
5. Median and P90 are reported, not single-run results.

If timing boundaries differ, results are not comparable.

## Interpreting Results

Use this practical UX scale:

1. Under `100ms`: typically instant.
2. `100ms` to `300ms`: noticeable, usually acceptable.
3. Over `300ms`: likely perceived as slow.

Absolute user-visible latency matters more than synthetic rank.

## Large List Guidance (`r-for`)

For large datasets:

1. Prefer windowing, chunking, or pagination.
2. Keep per-row template/binding footprint minimal.
3. Use stable keys.
4. Avoid expensive per-item object construction in template expressions.
5. Consider domain-specific rendering shortcuts in known hot paths.

## Regor-Specific Advantage

Regor enables runtime optimization strategies that are hard to apply in rigid pipelines:

1. Bind to existing HTML markup in place.
2. Use directives for most UI, and direct DOM/JS for selected hotspots.
3. Keep one runtime model instead of splitting between template compiler assumptions and runtime behavior.

## Profiling Workflow

Use repeatable tooling:

1. Run browser benchmark for end-user behavior (`yarn perf`).
2. Run minidom perf suite for runtime isolation (`yarn perf <rows>`).
3. Run profile capture (`yarn perf:profile`) and inspect top self-time stacks.
4. Optimize only top hotspots with clear measured deltas.

## Optimization Order

1. Reduce nodes.
2. Reduce bindings.
3. Simplify expressions.
4. Fix one hotspot at a time with before/after measurements.
5. Protect gains with perf baselines.

## When to Stop

If interaction latency is already in acceptable user-perceived range, stop micro-tuning and prioritize product work. Optimize only when the user can feel the difference.
