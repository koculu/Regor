# DOM Benchmarks

This folder contains a browser DOM benchmark that compares:

- `Regor` (local source from this repository)
- `Vue@latest` (loaded from CDN at runtime)

## Workload

The benchmark mounts a large bound list and then runs repeated manipulations:

- `for`-bound list rendering with keyed rows
- row property updates (`label`, `value`, `active`)
- array operations (`splice`, `push`, `shift`)

Each framework runs the same operation pattern; timings are measured with
`performance.now()`.

## Run

1. Build benchmark bundle:

```bash
yarn bench:build
```

2. Start static server:

```bash
yarn bench:serve
```

3. Open:

`http://localhost:4177/`

4. Click **Run Benchmark**.

## Notes

- `Vue@latest` requires internet access.
- Run multiple times and compare medians.
- Keep browser/devtools conditions consistent for fair comparisons.

