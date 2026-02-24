import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import process from 'node:process'
import readline from 'node:readline'

import { createApp, drainUnbind, html, ref, sref } from '../../src'
import { App } from '../../src/api/types'
import { createDom } from '../../tests/minidom/createDom'

type Stats = {
  median: number
  p90: number
  mean: number
  min: number
  max: number
  samples: number
}

type ScenarioResult = Stats & {
  unmount: {
    median: number
    p90: number
    mean: number
    min: number
    max: number
    samples: number
  }
}

type PerfBaseline = {
  meta: {
    version: number
    createdAt: string
    platform: string
    arch: string
    node: string
    rowCount: number
    samples: number
    warmups: number
  }
  results: Record<string, ScenarioResult>
}

type Scenario = {
  name: string
  run: () => Promise<{ runMs: number; unmountMs: number }>
}

const supportsColor = process.stdout.isTTY
const color = (code: number, text: string) =>
  supportsColor ? `\x1b[${code}m${text}\x1b[0m` : text
const bold = (text: string) => color(1, text)
const cyan = (text: string) => color(36, text)
const green = (text: string) => color(32, text)
const dim = (text: string) => color(2, text)
const yellow = (text: string) => color(33, text)
const red = (text: string) => color(31, text)

const parseModeAndRows = (): {
  mode: 'run' | 'record' | 'check'
  rows: number
} => {
  const arg2 = (process.argv[2] ?? '').toLowerCase()
  const arg3 = process.argv[3]
  const mode =
    arg2 === 'record' || arg2 === 'check' || arg2 === 'run' ? arg2 : 'run'
  const rowArg = mode === 'run' && arg2 !== 'run' ? process.argv[2] : arg3
  const rows = Math.max(1, Number(rowArg ?? 500) || 500)
  return { mode, rows }
}

const { mode, rows: rowCount } = parseModeAndRows()
const baselinePath = path.resolve(
  process.cwd(),
  `benchmarks/minidom/perf-baseline.${rowCount}.json`,
)

const toFixed = (n: number): number => Number(n.toFixed(3))

const stats = (data: number[]): Stats => {
  const sorted = [...data].sort((a, b) => a - b)
  const len = sorted.length
  const median =
    len % 2 === 0
      ? (sorted[len / 2 - 1] + sorted[len / 2]) / 2
      : sorted[(len - 1) / 2]
  const p90 = sorted[Math.min(len - 1, Math.ceil(len * 0.9) - 1)]
  const sum = sorted.reduce((p, c) => p + c, 0)
  return {
    median: toFixed(median),
    p90: toFixed(p90),
    mean: toFixed(sum / len),
    min: toFixed(sorted[0]),
    max: toFixed(sorted[len - 1]),
    samples: len,
  }
}

const withApp = async (
  template: string,
  contextFactory: () => Record<string, unknown>,
  run: (app: App<Record<string, unknown>>) => void,
): Promise<{ runMs: number; unmountMs: number }> => {
  const cleanup = createDom('<html><body><div id="app"></div></body></html>')
  try {
    const context = contextFactory()
    const t0 = performance.now()
    const app = createApp(context, {
      selector: '#app',
      template: html`${template}`,
    })
    run(app)
    const t1 = performance.now()
    app.unmount()
    await drainUnbind()
    const t2 = performance.now()
    return {
      runMs: t1 - t0,
      unmountMs: t2 - t1,
    }
  } finally {
    await drainUnbind()
    cleanup()
  }
}

const createRows = (count: number) =>
  Array.from({ length: count }, (_, i) =>
    ref({
      id: ref(i),
      label: ref(`row-${i}`),
      value: ref(i * 2),
    }),
  )

const scenarios: Scenario[] = [
  {
    name: 'mount_rfor_rtext',
    run: () =>
      withApp(
        `<div>
          <p r-for="row in rows" :key="row.id">
            <span r-text="row.id"></span>
            <span r-text="row.label"></span>
            <span r-text="row.value"></span>
          </p>
        </div>`,
        () => ({ rows: sref(createRows(rowCount)) }),
        () => {},
      ),
  },
  {
    name: 'mutate_rows_fields',
    run: () =>
      withApp(
        `<div>
          <p r-for="row in rows" :key="row.id">
            <span r-text="row.id"></span>
            <span r-text="row.label"></span>
            <span r-text="row.value"></span>
          </p>
        </div>`,
        () => ({ rows: sref(createRows(rowCount)) }),
        (app) => {
          const rows = app.context.rows as ReturnType<typeof sref<any[]>>
          const list = rows()
          for (let i = 0; i < list.length; ++i) {
            const row = list[i]()
            row.label(`next-${i}`)
            row.value(i + 1000)
          }
        },
      ),
  },
  {
    name: 'toggle_if_loop',
    run: () =>
      withApp(
        `<div>
          <p r-if="visible">a</p>
          <p r-else>b</p>
        </div>`,
        () => ({ visible: sref(true) }),
        (app) => {
          const visible = app.context.visible as ReturnType<
            typeof sref<boolean>
          >
          for (let i = 0; i < rowCount; ++i) visible(i % 2 === 0)
        },
      ),
  },
]

const samples = Number(process.env.PERF_SAMPLES ?? 20)
const warmups = Number(process.env.PERF_WARMUPS ?? 5)
const maxRegressionPct = Number(process.env.PERF_MAX_REGRESSION_PCT ?? 5)
const failOnRegression = process.env.PERF_FAIL_ON_REGRESSION !== '0'

const runSuite = async (): Promise<Record<string, ScenarioResult>> => {
  const out: Record<string, ScenarioResult> = {}
  for (const scenario of scenarios) {
    for (let i = 0; i < warmups; ++i) await scenario.run()
    const runs: number[] = []
    const unmounts: number[] = []
    for (let i = 0; i < samples; ++i) {
      const r = await scenario.run()
      runs.push(r.runMs)
      unmounts.push(r.unmountMs)
    }
    out[scenario.name] = {
      ...stats(runs),
      unmount: stats(unmounts),
    }
  }
  return out
}

const printResults = (results: Record<string, ScenarioResult>): void => {
  const nameW = 30
  const numW = 8
  const formatCell = (
    value: string,
    width: number,
    align: 'left' | 'right' = 'right',
  ): string =>
    align === 'left' ? value.padEnd(width, ' ') : value.padStart(width, ' ')
  const fmtNum = (n: number): string => formatCell(n.toFixed(3), numW, 'right')

  console.log(`\n${bold('Minidom Performance Results')}`)
  const header =
    `${formatCell('Scenario', nameW, 'left')} ` +
    `${formatCell('Median', numW)} ` +
    `${formatCell('P90', numW)} ` +
    `${formatCell('Mean', numW)} ` +
    `${formatCell('Min', numW)} ` +
    `${formatCell('Max', numW)} ` +
    `${formatCell('UnmMed', numW)} ` +
    `${formatCell('UnmP90', numW)}`
  console.log(header)
  for (const [name, r] of Object.entries(results)) {
    const n = formatCell(name, nameW, 'left')
    const median = green(fmtNum(r.median))
    const p90 = green(fmtNum(r.p90))
    const mean = dim(green(fmtNum(r.mean)))
    const min = dim(green(fmtNum(r.min)))
    const max = dim(green(fmtNum(r.max)))
    const unmountMedian = green(fmtNum(r.unmount.median))
    const unmountP90 = dim(green(fmtNum(r.unmount.p90)))
    console.log(
      `${cyan(n)} ${median} ${p90} ${mean} ${min} ${max} ${unmountMedian} ${unmountP90}`,
    )
  }
}

const recordBaseline = (results: Record<string, ScenarioResult>): void => {
  const baseline: PerfBaseline = {
    meta: {
      version: 1,
      createdAt: new Date().toISOString(),
      platform: process.platform,
      arch: os.arch(),
      node: process.version,
      rowCount,
      samples,
      warmups,
    },
    results,
  }
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true })
  fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + '\n')
  console.log(`\n${green('Recorded baseline:')} ${baselinePath}`)
}

const loadBaseline = (): PerfBaseline | null => {
  if (!fs.existsSync(baselinePath)) return null
  return JSON.parse(fs.readFileSync(baselinePath, 'utf-8')) as PerfBaseline
}

const compareToBaseline = (
  results: Record<string, ScenarioResult>,
  enforceGate: boolean,
): number => {
  const baseline = loadBaseline()
  if (!baseline) {
    console.warn(
      `\n${yellow('No baseline found')} at ${baselinePath}. Run: yarn perf:record ${rowCount}`,
    )
    return enforceGate ? 2 : 0
  }

  let regressions = 0
  console.log(
    `\n${bold('Comparing to baseline')} (max allowed regression: ${maxRegressionPct.toFixed(2)}%)`,
  )
  for (const [name, current] of Object.entries(results)) {
    const base = baseline.results[name]
    if (!base) {
      console.warn(`- ${name}: missing in baseline (skipped)`)
      continue
    }
    const pct = ((current.median - base.median) / base.median) * 100
    if (pct > maxRegressionPct) {
      ++regressions
      console.warn(
        red(
          `- REGRESSION ${name}: median ${base.median.toFixed(3)} -> ${current.median.toFixed(3)} (${pct.toFixed(2)}% slower)`,
        ),
      )
    } else if (pct < 0) {
      const fasterPct = Math.abs(pct)
      console.log(
        green(
          `- IMPROVEMENT ${name}: median ${base.median.toFixed(3)} -> ${current.median.toFixed(3)} (${fasterPct.toFixed(2)}% faster)`,
        ),
      )
    } else {
      console.log(
        yellow(
          `- OK ${name}: median ${base.median.toFixed(3)} -> ${current.median.toFixed(3)} (${pct.toFixed(2)}% slower)`,
        ),
      )
    }
  }

  if (regressions > 0 && enforceGate && failOnRegression) {
    console.error(
      `\n${red(`Performance gate failed: ${regressions} regression(s).`)}`,
    )
    return 1
  }
  if (regressions > 0) {
    console.warn(
      `\n${yellow(
        enforceGate
          ? `Performance gate warning: ${regressions} regression(s).`
          : `Comparison warning: ${regressions} regression(s).`,
      )}`,
    )
    return 0
  }
  console.log(
    `\n${green(enforceGate ? 'Performance gate passed.' : 'Comparison passed.')}`,
  )
  return 0
}

const runOnce = async (): Promise<number> => {
  if (process.stdout.isTTY) console.clear()
  console.log(
    `\n${bold('Running minidom perf suite...')} mode=${mode}, rows=${rowCount}, samples=${samples}, warmups=${warmups}`,
  )
  console.log(cyan(`Scenarios: ${scenarios.map((x) => x.name).join(', ')}`))
  const results = await runSuite()
  printResults(results)
  if (mode === 'record') {
    compareToBaseline(results, false)
    recordBaseline(results)
    return 0
  }
  if (mode === 'check') return compareToBaseline(results, true)
  compareToBaseline(results, false)
  return 0
}

const runInteractive = async (): Promise<number> => {
  let code = await runOnce()
  if (mode !== 'run' || !process.stdin.isTTY || !process.stdout.isTTY) {
    return code
  }

  console.log('\nPress Enter to rerun, press q to quit.')
  readline.emitKeypressEvents(process.stdin)
  process.stdin.setRawMode(true)
  process.stdin.resume()

  return await new Promise<number>((resolve) => {
    let running = false
    const onKeypress = (str: string, key: readline.Key) => {
      if (key?.ctrl && key.name === 'c') {
        cleanup()
        resolve(code)
        return
      }
      if (str === 'q' || str === 'Q') {
        cleanup()
        resolve(code)
        return
      }
      if (key?.name === 'return' || key?.name === 'enter') {
        if (running) return
        running = true
        void runOnce()
          .then((nextCode) => {
            code = nextCode
            console.log('\nPress Enter to rerun, press q to quit.')
          })
          .finally(() => {
            running = false
          })
      }
    }

    const cleanup = () => {
      process.stdin.off('keypress', onKeypress)
      if (process.stdin.isTTY) process.stdin.setRawMode(false)
      process.stdin.pause()
    }

    process.stdin.on('keypress', onKeypress)
  })
}

void runInteractive().then((code) => {
  process.exit(code)
})
