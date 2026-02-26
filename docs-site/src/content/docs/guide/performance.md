---
title: Performance
sidebar:
  order: 80
---

This guide shows how to measure Regor performance with stable, repeatable workflows:

1. Browser DOM benchmark (real rendering path)
2. Minidom benchmark (engine-only, no paint/layout noise)
3. CPU profiling (find real hotspots before changing code)

## Regor Wins Where It Matters

In this repo’s benchmark suite, Regor is the update-throughput winner in many real mutation patterns.

Highlights:

1. Regor is consistently strong in mutation-heavy scenarios.
2. Regor often leads total update cost when interaction drives many list changes.
3. Regor can outperform even when mount is not the absolute fastest metric.

In the 1000-row snapshot on this page, Regor wins 10 of 11 scenario medians.

Regor median wins:

1. `swap_second_last`
2. `rotate_head_tail`
3. `splice_middle_replace`
4. `mutate_stride_fields`
5. `increment_odd_values_by_5`
6. `insert_head_32`
7. `remove_every_5th`
8. `shuffle_deterministic`
9. `replace_all_objects_same_keys`
10. `toggle_class_all_rows`

Verification paths:

1. `/benchmarks/index.html` for mount + mutation totals
2. Scenario table in the same page for per-pattern winners

## Latest Benchmark Snapshot (1000 rows)

Benchmark settings:

1. Row count: `1000`
2. Warmups: `6`
3. Samples: `20`

### Mount + Mutate Total

| Framework  | Mount Median | Mount P90 | Mutate Median | Mutate P90 | Total Median | Total P90 |
| ---------- | -----------: | --------: | ------------: | ---------: | -----------: | --------: |
| Regor      |     49.40 ms |  60.20 ms |     217.40 ms |  256.40 ms |    270.60 ms | 312.20 ms |
| Vue@latest |     27.20 ms |  34.70 ms |     325.10 ms |  343.70 ms |    354.10 ms | 371.90 ms |

### Scenario Table Snapshot

| Scenario                        | Regor Median (ms) | Vue Median (ms) |
| ------------------------------- | ----------------: | --------------: |
| `swap_second_last`              |              5.20 |           16.60 |
| `reverse_rows`                  |             26.00 |           25.90 |
| `rotate_head_tail`              |             10.30 |           14.20 |
| `splice_middle_replace`         |              9.90 |           16.60 |
| `mutate_stride_fields`          |              8.00 |           16.60 |
| `increment_odd_values_by_5`     |             13.50 |           16.60 |
| `insert_head_32`                |              8.50 |           16.70 |
| `remove_every_5th`              |            106.10 |          124.50 |
| `shuffle_deterministic`         |              4.20 |           28.60 |
| `replace_all_objects_same_keys` |              8.00 |           30.80 |
| `toggle_class_all_rows`         |             14.30 |           14.40 |

Interpretation:

Regor shows strong wins on several real mutation patterns.

## Browser DOM Benchmarks

Use this when you care about user-visible page performance.

1. Run: `yarn bench:serve`
2. Open:
   1. `/benchmarks/index.html` for mount + mutation benchmarks
   2. `/benchmarks/initial-load.html` for mount-only benchmarks
3. Use the controls:
   1. row count dropdown (`500`, `1000`, `2000`, `5000`)
   2. warmups
   3. samples

Interpretation:

1. `Median` is your primary number.
2. `P90` reflects tail behavior and jitter.
3. Compare scenario tables, not only one aggregate total.

## Minidom Perf Suite (Regression Gate)

Use this for fast local iteration and CI-like guardrails.

Commands:

1. Run suite: `yarn perf` (default rows: `500`)
2. Run with rows: `yarn perf 1000`
3. Record baseline: `yarn perf:record 1000`
4. Check against baseline: `yarn perf:check 1000`

Notes:

1. Baselines are row-specific (`benchmarks/minidom/perf-baseline.<rows>.json`).
2. Output includes run metrics and unmount metrics (`UnmMed`, `UnmP90`).
3. In interactive `run` mode: `Enter` reruns, `q` quits.

Useful environment variables:

1. `PERF_SAMPLES` (default `20`)
2. `PERF_WARMUPS` (default `5`)
3. `PERF_MAX_REGRESSION_PCT` (default `5`)
4. `PERF_FAIL_ON_REGRESSION` (`1` fail, `0` warn)

Example:

```bash
PERF_SAMPLES=30 PERF_WARMUPS=8 PERF_MAX_REGRESSION_PCT=3 yarn perf:check 1000
```

## Run Profiler (CPU Hotspot Workflow)

Use this before optimization work. It prevents random tuning and points to real hotspots.

Quick start:

1. `yarn perf:profile` (default rows: `2000`, top lines: `30`)
2. `yarn perf:profile 2000 40` (custom rows + hotspot line count)

What the command does:

1. Bundles `benchmarks/minidom/perf.ts` to plain Node JS.
2. Runs Node CPU profiler on that bundle.
3. Produces:
   1. `.cpuprofile` file for Chrome DevTools
   2. `.summary.txt` hotspot summary
4. Saves artifacts under `benchmarks/minidom/profiles/`.

Profile artifacts:

1. `benchmarks/minidom/profiles/perf-<rows>-<timestamp>.cpuprofile`
2. `benchmarks/minidom/profiles/perf-<rows>-<timestamp>.summary.txt`

## Recommended Optimization Loop

1. Reproduce with `yarn perf <rows>` and browser benchmark.
2. Capture profile with `yarn perf:profile <rows>`.
3. Change one thing only.
4. Re-run `yarn perf:check <rows>`.
5. Validate functional correctness with tests.
6. Re-check browser benchmark to confirm user-visible impact.

## Practical Rules

1. Optimize measured hotspots, not assumptions.
2. Prefer algorithmic wins over micro-tweaks.
3. Keep median and p90 both healthy.
4. Use row counts that match your real product usage.
