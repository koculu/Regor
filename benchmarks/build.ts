import { build } from 'esbuild'

await build({
  entryPoints: ['benchmarks/src/index.ts', 'benchmarks/src/initial-load.ts'],
  outdir: 'benchmarks/dist',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2022'],
  sourcemap: true,
  legalComments: 'none',
})

console.log('Built benchmarks/dist/*.js')
