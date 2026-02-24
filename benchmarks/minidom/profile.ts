import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import { build } from 'esbuild'

type CpuProfile = {
  nodes: Array<{
    id: number
    callFrame: {
      functionName: string
      url: string
      lineNumber: number
      columnNumber: number
    }
    parent?: number
  }>
  samples?: number[]
  timeDeltas?: number[]
}

type Frame = {
  fn: string
  url: string
  line: number
  col: number
}

const supportsColor = process.stdout.isTTY
const color = (code: number, text: string) =>
  supportsColor ? `\x1b[${code}m${text}\x1b[0m` : text
const bold = (text: string) => color(1, text)
const cyan = (text: string) => color(36, text)
const green = (text: string) => color(32, text)
const yellow = (text: string) => color(33, text)

const rows = Math.max(1, Number(process.argv[2] ?? 2000) || 2000)
const topN = Math.max(5, Number(process.argv[3] ?? 30) || 30)
const outDir = path.resolve(process.cwd(), 'benchmarks/minidom/profiles')
const bundlePath = path.join(outDir, 'perf.profile.bundle.mjs')
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const profileName = `perf-${rows}-${stamp}.cpuprofile`
const profilePath = path.join(outDir, profileName)
const summaryPath = path.join(outDir, `perf-${rows}-${stamp}.summary.txt`)

const isIdleFrame = (fn: string) =>
  fn === '(idle)' || fn === '(program)' || fn === '(garbage collector)'

const shortUrl = (url: string): string => {
  if (!url) return ''
  const cwd = process.cwd().replace(/\\/g, '/')
  return url.replace(cwd + '/', '').replace('file:///', '')
}

const isRegorFrame = (url: string): boolean => {
  const normalized = shortUrl(url).toLowerCase()
  if (
    normalized.includes('benchmarks/minidom/profiles/perf.profile.bundle.mjs')
  )
    return true
  return (
    normalized.includes('/src/') ||
    normalized.includes('\\src\\') ||
    normalized.includes('/tests/minidom/') ||
    normalized.includes('\\tests\\minidom\\')
  )
}

const renderTopFrames = (
  entries: Array<{ frame: Frame; timeUs: number }>,
  totalUs: number,
): string[] =>
  entries.slice(0, topN).map((x) => {
    const pct = ((x.timeUs * 100) / totalUs).toFixed(2).padStart(6, ' ')
    const ms = (x.timeUs / 1000).toFixed(2).padStart(8, ' ')
    return `${pct}% ${ms}ms | ${x.frame.fn} | ${shortUrl(x.frame.url)}:${x.frame.line}:${x.frame.col}`
  })

const aggregateProfile = (profile: CpuProfile) => {
  const nodesById = new Map(profile.nodes.map((n) => [n.id, n]))
  const samples = profile.samples ?? []
  const deltas = profile.timeDeltas ?? []
  const nonIdleByFrame = new Map<string, { frame: Frame; timeUs: number }>()
  const regorByFrame = new Map<string, { frame: Frame; timeUs: number }>()
  const fnTotals = new Map<string, number>()
  let nonIdleTotalUs = 0
  let regorTotalUs = 0

  for (let i = 0; i < samples.length; ++i) {
    const node = nodesById.get(samples[i])
    if (!node) continue
    const dt = deltas[i] ?? 0
    const frame: Frame = {
      fn: node.callFrame.functionName || '(anonymous)',
      url: node.callFrame.url ?? '',
      line: (node.callFrame.lineNumber ?? 0) + 1,
      col: (node.callFrame.columnNumber ?? 0) + 1,
    }
    if (isIdleFrame(frame.fn)) continue
    nonIdleTotalUs += dt
    fnTotals.set(frame.fn, (fnTotals.get(frame.fn) ?? 0) + dt)

    const key = `${frame.fn}|${frame.url}|${frame.line}|${frame.col}`
    const cur = nonIdleByFrame.get(key)
    if (cur) cur.timeUs += dt
    else nonIdleByFrame.set(key, { frame, timeUs: dt })

    if (isRegorFrame(frame.url)) {
      regorTotalUs += dt
      const regorCur = regorByFrame.get(key)
      if (regorCur) regorCur.timeUs += dt
      else regorByFrame.set(key, { frame, timeUs: dt })
    }
  }

  const topNonIdle = [...nonIdleByFrame.values()].sort(
    (a, b) => b.timeUs - a.timeUs,
  )
  const topRegor = [...regorByFrame.values()].sort(
    (a, b) => b.timeUs - a.timeUs,
  )
  const topFns = [...fnTotals.entries()]
    .map(([fn, timeUs]) => ({ fn, timeUs }))
    .sort((a, b) => b.timeUs - a.timeUs)
    .slice(0, topN)

  return {
    nonIdleTotalUs,
    regorTotalUs,
    topNonIdle,
    topRegor,
    topFns,
  }
}

const main = async () => {
  fs.mkdirSync(outDir, { recursive: true })
  console.log(
    `${bold('Profiling minidom perf')} rows=${rows}, top=${topN}, samples=${process.env.PERF_SAMPLES ?? '20'}, warmups=${process.env.PERF_WARMUPS ?? '5'}`,
  )
  console.log(cyan(`Building bundle -> ${bundlePath}`))

  await build({
    entryPoints: [path.resolve(process.cwd(), 'benchmarks/minidom/perf.ts')],
    outfile: bundlePath,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    sourcemap: false,
    keepNames: false,
    logLevel: 'silent',
  })

  console.log(cyan(`Running perf + CPU profile -> ${profilePath}`))
  const run = spawnSync(
    process.execPath,
    [
      `--cpu-prof`,
      `--cpu-prof-name=${profileName}`,
      `--cpu-prof-dir=${outDir}`,
      bundlePath,
      String(rows),
    ],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
      env: process.env,
    },
  )
  if (run.stdout) process.stdout.write(run.stdout)
  if (run.stderr) process.stderr.write(run.stderr)
  if (run.status !== 0) process.exit(run.status ?? 1)
  if (!fs.existsSync(profilePath)) {
    console.error(`Profile file missing: ${profilePath}`)
    process.exit(1)
  }

  const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8')) as CpuProfile
  const analysis = aggregateProfile(profile)
  const lines: string[] = []
  lines.push(`Profile: ${profilePath}`)
  lines.push(
    `Non-idle total: ${(analysis.nonIdleTotalUs / 1000).toFixed(2)} ms`,
  )
  lines.push(
    `Regor/minidom non-idle: ${(analysis.regorTotalUs / 1000).toFixed(2)} ms (${((analysis.regorTotalUs * 100) / Math.max(1, analysis.nonIdleTotalUs)).toFixed(2)}%)`,
  )
  lines.push('')
  lines.push('Top Functions (non-idle self):')
  for (const x of analysis.topFns) {
    lines.push(
      `${((x.timeUs * 100) / Math.max(1, analysis.nonIdleTotalUs)).toFixed(2).padStart(6, ' ')}% ${(x.timeUs / 1000).toFixed(2).padStart(8, ' ')}ms | ${x.fn}`,
    )
  }
  lines.push('')
  lines.push('Top Frames (non-idle self):')
  lines.push(
    ...renderTopFrames(
      analysis.topNonIdle,
      Math.max(1, analysis.nonIdleTotalUs),
    ),
  )
  lines.push('')
  lines.push('Top Regor/Minidom Frames (non-idle self):')
  lines.push(
    ...renderTopFrames(analysis.topRegor, Math.max(1, analysis.nonIdleTotalUs)),
  )

  fs.writeFileSync(summaryPath, lines.join('\n') + '\n')

  console.log(`\n${green('Profile summary')}`)
  console.log(lines.join('\n'))
  console.log(`\n${yellow('Saved summary:')} ${summaryPath}`)
}

void main()
