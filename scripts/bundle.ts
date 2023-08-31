import { Builder } from './Builder'
import fs from 'fs'
import { Format, Platform } from 'esbuild'

fs.rm(
  'dist',
  {
    force: true,
    recursive: true,
  },
  async () => {
    await Promise.all([bundle(false), bundle(true)])
  },
)
const bundleWithOptions = async (
  src: string,
  dest: string,
  platform: Platform,
  target: string,
  format: Format,
  minify: boolean,
  globalName?: string,
) => {
  const builder = new Builder(src, dest)
  const opt = builder.Options
  opt.platform = platform
  opt.target = target
  opt.bundle = true
  opt.format = format
  opt.globalName = globalName
  opt.treeShaking = true
  opt.minify = minify
  if (minify) opt.mangleProps = /__.*?$/
  builder.build()
}

const targets = 'es2015,es2019,es2022'
const bundle = async (minify: boolean) => {
  const promises: Promise<void>[] = []
  const prod = minify ? 'prod.js' : 'js'
  for (const target of targets.split(',')) {
    const p = bundleWithOptions(
      'src/index.ts',
      `dist/regor.${target}.esm.${prod}`,
      'browser',
      target,
      'esm',
      minify,
    )
    promises.push(p)
  }

  for (const target of targets.split(',')) {
    const p = bundleWithOptions(
      'src/index.ts',
      `dist/regor.${target}.cjs.${prod}`,
      'browser',
      target,
      'cjs',
      minify,
    )
  }

  for (const target of targets.split(',')) {
    const p = bundleWithOptions(
      'src/index.ts',
      `dist/regor.${target}.iife.${prod}`,
      'browser',
      target,
      'iife',
      minify,
      'Regor',
    )
    promises.push(p)
    await Promise.all(promises)
  }
}
