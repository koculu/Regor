import { createApp as createRegorApp, html, RegorConfig, sref } from '../../src'
import {
  clearRoot,
  formatMs,
  getRowCount,
  getSampleRuns,
  getWarmupRuns,
  loadVueModule,
  nextFrame,
  percentile,
  runAlternating,
  runSamples,
  setButtonsDisabled,
  setLog,
} from './shared'

type Row = {
  id: number
  label: string
  value: number
  active: boolean
}

type BenchResult = {
  framework: string
  mountMs: number
  rowsFinal: number
}

type BenchSummary = {
  framework: string
  mountMedian: number
  mountP90: number
  rowsFinal: number
  samples: number
}

type VueRuntime = {
  createApp: (options: { data: () => { rows: Row[] }; template: string }) => {
    mount: (root: HTMLElement) => void
    unmount: () => void
  }
  reactive: <T extends object>(state: T) => T
}

let lastRegorApp: { unbind: () => void } | null = null
let lastVueApp: { unmount: () => void } | null = null

const getRegorLabel = (): string => 'Regor'

const createRegorBenchConfig = (): RegorConfig => {
  const config = new RegorConfig()
  config.useInterpolation = true
  return config
}

const makeRows = (count: number, startId = 0): Row[] => {
  const out: Row[] = []
  for (let i = 0; i < count; i++) {
    const id = startId + i
    out.push({
      id,
      label: `row-${id}`,
      value: id % 97,
      active: id % 2 === 1,
    })
  }
  return out
}

const runRegor = async (root: HTMLElement): Promise<BenchResult> => {
  if (lastRegorApp) {
    lastRegorApp.unbind()
    lastRegorApp = null
  }
  clearRoot(root)

  const rows = makeRows(getRowCount())
  await nextFrame()

  const t0 = performance.now()
  const app = createRegorApp(
    { rows: sref(rows) },
    {
      element: root,
      template: html`<div>
        <div r-for="row in rows" :key="row.id" :class="{ active: row.active }">
          <span>{{ row.id }}</span><span>{{ row.label }}</span
          ><span>{{ row.value }}</span>
        </div>
      </div>`,
    },
    createRegorBenchConfig(),
  )
  lastRegorApp = app

  await nextFrame()
  return {
    framework: getRegorLabel(),
    mountMs: performance.now() - t0,
    rowsFinal: app.context.rows().length,
  }
}

const runVue = async (root: HTMLElement): Promise<BenchResult> => {
  if (lastVueApp) {
    lastVueApp.unmount()
    lastVueApp = null
  }
  clearRoot(root)

  const vue = (await loadVueModule()) as VueRuntime
  const { createApp, reactive } = vue
  const state = reactive({ rows: makeRows(getRowCount()) })

  await nextFrame()
  const t0 = performance.now()
  const app = createApp({
    data: () => state,
    template: `
      <div>
        <div v-for="row in rows" :key="row.id" :class="{ active: row.active }">
          <span>{{ row.id }}</span>
          <span>{{ row.label }}</span>
          <span>{{ row.value }}</span>
        </div>
      </div>
    `,
  })
  app.mount(root)
  lastVueApp = app

  await nextFrame()
  return {
    framework: 'Vue@latest',
    mountMs: performance.now() - t0,
    rowsFinal: state.rows.length,
  }
}

const summarize = (framework: string, samples: BenchResult[]): BenchSummary => {
  const mount = samples.map((x) => x.mountMs).sort((a, b) => a - b)
  return {
    framework,
    mountMedian: percentile(mount, 50),
    mountP90: percentile(mount, 90),
    rowsFinal: samples[samples.length - 1]?.rowsFinal ?? 0,
    samples: samples.length,
  }
}

const winnerByDisplayedValue = (
  left: number,
  leftFramework: string,
  right: number,
  rightFramework: string,
): string => {
  const leftShown = Number(left.toFixed(2))
  const rightShown = Number(right.toFixed(2))
  if (leftShown === rightShown) return ''
  return leftShown < rightShown ? leftFramework : rightFramework
}

const renderResults = (rows: BenchSummary[]): void => {
  const tbody =
    document.querySelector<HTMLTableSectionElement>('#results tbody')
  if (!tbody) return

  const mountMedianWinner =
    rows.length === 2
      ? winnerByDisplayedValue(
          rows[0].mountMedian,
          rows[0].framework,
          rows[1].mountMedian,
          rows[1].framework,
        )
      : ''
  const mountP90Winner =
    rows.length === 2
      ? winnerByDisplayedValue(
          rows[0].mountP90,
          rows[0].framework,
          rows[1].mountP90,
          rows[1].framework,
        )
      : ''
  const labelWinner =
    mountMedianWinner !== '' && mountMedianWinner === mountP90Winner
      ? mountMedianWinner
      : ''

  tbody.innerHTML = ''
  for (const r of rows) {
    const frameworkClass = labelWinner === r.framework ? 'winner-metric' : ''
    const mountMedianClass =
      mountMedianWinner === r.framework ? 'winner-metric' : ''
    const mountP90Class = mountP90Winner === r.framework ? 'winner-metric' : ''
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td class="${frameworkClass}">${r.framework}</td>
      <td class="${mountMedianClass}">${formatMs(r.mountMedian)}</td>
      <td class="${mountP90Class}">${formatMs(r.mountP90)}</td>
      <td>${r.rowsFinal}</td>
      <td>${r.samples}</td>
    `
    tbody.appendChild(tr)
  }
}

const withButtonsDisabled = async (
  onFailure: string,
  action: () => Promise<void>,
): Promise<void> => {
  setButtonsDisabled(true)
  try {
    await action()
  } catch (e) {
    console.error(e)
    setLog(`${onFailure}: ${(e as Error).message}`)
  } finally {
    setButtonsDisabled(false)
  }
}

const run = async (): Promise<void> => {
  await withButtonsDisabled('Benchmark failed', async () => {
    const rowCount = getRowCount()
    const warmupRuns = getWarmupRuns()
    const sampleRuns = getSampleRuns()
    setLog(
      `rows=${rowCount}, warmup ${warmupRuns} rounds (unmeasured), then ${sampleRuns} measured samples (A/B alternating)...`,
    )

    const regorRoot = document.getElementById('regor-root')
    const vueRoot = document.getElementById('vue-root')
    if (!regorRoot || !vueRoot) {
      setLog('Missing benchmark roots in DOM.')
      return
    }

    await runAlternating(
      warmupRuns,
      () => runRegor(regorRoot),
      () => runVue(vueRoot),
    )
    const measured = await runAlternating(
      sampleRuns,
      () => runRegor(regorRoot),
      () => runVue(vueRoot),
      (i) => setLog(`Measured sample ${i + 1}/${sampleRuns}...`),
    )

    const regorSummary = summarize(getRegorLabel(), measured.a)
    const vueSummary = summarize('Vue@latest', measured.b)
    renderResults([regorSummary, vueSummary])

    setLog('Done. Showing mount median + p90 only.')
    console.table([regorSummary, vueSummary])
  })
}

const runOnlyRegor = async (): Promise<void> => {
  await withButtonsDisabled('Regor benchmark failed', async () => {
    const rowCount = getRowCount()
    const warmupRuns = getWarmupRuns()
    const sampleRuns = getSampleRuns()
    setLog(
      `${getRegorLabel()}: rows=${rowCount}, warmup ${warmupRuns} rounds (unmeasured), ${sampleRuns} measured samples...`,
    )

    const regorRoot = document.getElementById('regor-root')
    if (!regorRoot) {
      setLog('Missing Regor root in DOM.')
      return
    }

    await runSamples(warmupRuns, () => runRegor(regorRoot))
    const samples = await runSamples(sampleRuns, () => runRegor(regorRoot))
    const summary = summarize(getRegorLabel(), samples)

    renderResults([summary])
    setLog(`${getRegorLabel()} done. Showing mount median + p90.`)
    console.table([summary])
  })
}

const runOnlyVue = async (): Promise<void> => {
  await withButtonsDisabled('Vue benchmark failed', async () => {
    const rowCount = getRowCount()
    const warmupRuns = getWarmupRuns()
    const sampleRuns = getSampleRuns()
    setLog(
      `Vue: rows=${rowCount}, warmup ${warmupRuns} rounds (unmeasured), ${sampleRuns} measured samples...`,
    )

    const vueRoot = document.getElementById('vue-root')
    if (!vueRoot) {
      setLog('Missing Vue root in DOM.')
      return
    }

    await runSamples(warmupRuns, () => runVue(vueRoot))
    const samples = await runSamples(sampleRuns, () => runVue(vueRoot))
    const summary = summarize('Vue@latest', samples)

    renderResults([summary])
    setLog('Vue done. Showing mount median + p90.')
    console.table([summary])
  })
}

const wire = (): void => {
  const runRegorButton = document.getElementById(
    'run-regor',
  ) as HTMLButtonElement | null
  const runVueButton = document.getElementById(
    'run-vue',
  ) as HTMLButtonElement | null
  const runButton = document.getElementById('run') as HTMLButtonElement | null

  setButtonsDisabled(true)
  setLog('Loading Vue runtime (excluded from benchmark timing)...')
  void loadVueModule()
    .then(() => {
      setButtonsDisabled(false)
      setLog(
        `Ready. Initial-load benchmark with rows=${getRowCount()}, warmups=${getWarmupRuns()}, samples=${getSampleRuns()}.`,
      )
    })
    .catch((e) => {
      setLog(`Failed to load Vue runtime: ${(e as Error).message}`)
    })

  runRegorButton?.addEventListener('click', () => {
    void runOnlyRegor()
  })
  runVueButton?.addEventListener('click', () => {
    void runOnlyVue()
  })
  runButton?.addEventListener('click', () => {
    void run()
  })
}

wire()
