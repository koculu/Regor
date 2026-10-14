import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createContext, runInContext } from 'node:vm'

import { build, type Format } from 'esbuild'
import { afterAll, beforeAll, expect, test } from 'vitest'

import packageJson from '../package.json'

const entry = fileURLToPath(new URL('../src/index.ts', import.meta.url))
const variants = [
  { format: 'iife', minify: false },
  { format: 'iife', minify: true },
  { format: 'cjs', minify: false },
  { format: 'cjs', minify: true },
] as const
const bundles: string[] = []
let otherVersion: string
let fixture: string

const bundle = async (
  format: Format,
  minify = false,
  version = packageJson.version,
): Promise<string> => {
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    platform: 'browser',
    target: 'es2015',
    format,
    globalName: 'Regor',
    minify,
    mangleProps: minify ? /__.*?$/ : undefined,
    plugins: [
      {
        name: 'runtime-version-fixture',
        setup(builder) {
          builder.onLoad({ filter: /[/\\]package\.json$/ }, () => ({
            contents: JSON.stringify({ version }),
            loader: 'json',
          }))
        },
      },
    ],
  })
  const code = result.outputFiles[0].text
  return format === 'cjs'
    ? `(function () { const module = { exports: {} }; ${code}\nreturn module.exports })()`
    : code
}

beforeAll(async () => {
  bundles.push(
    ...(await Promise.all(variants.map((x) => bundle(x.format, x.minify)))),
  )
  otherVersion = await bundle('iife', true, '9.9.9')
  const fixtureRoot = fileURLToPath(new URL('../.tmp/', import.meta.url))
  await mkdir(fixtureRoot, { recursive: true })
  fixture = await mkdtemp(join(fixtureRoot, 'regor-runtime-'))
})

afterAll(async () => {
  if (fixture) await rm(fixture, { recursive: true, force: true })
})

test('repeated imports use the same runtime', async () => {
  const first = await import('../src')
  const second = await import('../src')
  expect(second).toBe(first)
  expect(second.isRef(first.ref('value'))).toBe(true)
})

test.each(variants)('rejects a second $format runtime, minify=$minify', (x) => {
  const context = createContext({})
  runInContext(bundles[0], context)
  expect(runInContext('Regor.sref("value")()', context)).toBe('value')
  const registered = runInContext(
    'globalThis[Symbol.for("regor.runtime")]',
    context,
  )

  expect(() =>
    runInContext(bundles[variants.indexOf(x)], context),
  ).toThrowError(
    expect.objectContaining({
      name: 'RegorRuntimeMismatch',
      message: `Regor ${packageJson.version} is already loaded; another runtime using ${packageJson.version} was imported. Ensure the renderer and components share one Regor instance.`,
    }),
  )
  expect(runInContext('globalThis[Symbol.for("regor.runtime")]', context)).toBe(
    registered,
  )
})

test.each([false, true])(
  'rejects different versions, reversed=%s',
  (reversed) => {
    const context = createContext({})
    const codes = reversed
      ? [otherVersion, bundles[0]]
      : [bundles[0], otherVersion]
    const versions = reversed
      ? ['9.9.9', packageJson.version]
      : [packageJson.version, '9.9.9']
    runInContext(codes[0], context)
    expect(() => runInContext(codes[1], context)).toThrowError(
      expect.objectContaining({
        name: 'RegorRuntimeMismatch',
        message: `Regor ${versions[0]} is already loaded; another runtime using ${versions[1]} was imported. Ensure the renderer and components share one Regor instance.`,
      }),
    )
  },
)

test('retains the guard when a consumer imports only html from the package', async () => {
  const directory = join(fixture, 'node_modules', 'regor')
  const dist = join(directory, 'dist')
  await mkdir(dist, { recursive: true })
  await writeFile(join(directory, 'package.json'), JSON.stringify(packageJson))
  await writeFile(join(directory, packageJson.main), await bundle('esm', true))

  const result = await build({
    stdin: {
      contents: 'import { html } from "regor"; globalThis.result = html`hello`',
      resolveDir: fixture,
    },
    bundle: true,
    write: false,
    platform: 'browser',
    format: 'iife',
    minify: true,
  })
  const code = result.outputFiles[0].text
  const context = createContext({})
  runInContext(code, context)
  expect(context.result).toBe('hello')
  expect(
    runInContext('globalThis[Symbol.for("regor.runtime")].version', context),
  ).toBe(packageJson.version)
  expect(() => runInContext(code, context)).toThrowError(/already loaded/)
})
