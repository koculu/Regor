import { createApp as createRegorApp, html, RegorConfig, sref } from '../../src'

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

const ROW_COUNT = 500
const SAMPLE_RUNS = 20
const WARMUP_RUNS = 6
const VUE_ESM_URL =
  'https://cdn.jsdelivr.net/npm/vue@latest/dist/vue.esm-browser.prod.js'

let vueModulePromise: Promise<any> | null = null
let lastRegorApp: { unbind: () => void } | null = null
let lastVueApp: { unmount: () => void } | null = null
const regorBenchConfig = (() => {
  const config = new RegorConfig()
  config.useInterpolation = true
  return config
})()

const nextFrame = async (): Promise<void> => {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
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

const clearRoot = (root: HTMLElement): void => {
  root.innerHTML = ''
}

const loadVueModule = async (): Promise<any> => {
  if (!vueModulePromise) {
    vueModulePromise = import(/* @vite-ignore */ VUE_ESM_URL)
  }
  return vueModulePromise
}

const runRegor = async (root: HTMLElement): Promise<BenchResult> => {
  if (lastRegorApp) {
    lastRegorApp.unbind()
    lastRegorApp = null
  }
  clearRoot(root)
  const rows = makeRows(ROW_COUNT)
  await nextFrame()
  const t0 = performance.now()
  const app = createRegorApp(
    {
      rows: sref(rows),
    },
    {
      element: root,
      template: html`<div>
        <div r-for="row in rows" :key="row.id" :class="{ active: row.active }">
          <span>{{ row.id }}</span><span>{{ row.label }}</span
          ><span>{{ row.value }}</span>
        </div>
      </div>`,
    },
    regorBenchConfig,
  )
  lastRegorApp = app
  await nextFrame()
  const mountMs = performance.now() - t0
  return {
    framework: 'Regor',
    mountMs,
    rowsFinal: app.context.rows().length,
  }
}

const runVue = async (root: HTMLElement): Promise<BenchResult> => {
  if (lastVueApp) {
    lastVueApp.unmount()
    lastVueApp = null
  }
  clearRoot(root)
  const vue = await loadVueModule()
  const { createApp, reactive } = vue

  const state = reactive({
    rows: makeRows(ROW_COUNT),
  })

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
  const mountMs = performance.now() - t0

  return {
    framework: 'Vue@latest',
    mountMs,
    rowsFinal: state.rows.length,
  }
}

const formatMs = (n: number): string => n.toFixed(2)

const percentile = (sorted: number[], p: number): number => {
  if (!sorted.length) return 0
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  )
  return sorted[idx]
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

const renderResults = (rows: BenchSummary[]): void => {
  const tbody =
    document.querySelector<HTMLTableSectionElement>('#results tbody')
  if (!tbody) return
  tbody.innerHTML = ''
  for (const r of rows) {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td>${r.framework}</td>
      <td>${formatMs(r.mountMedian)}</td>
      <td>${formatMs(r.mountP90)}</td>
      <td>${r.rowsFinal}</td>
      <td>${r.samples}</td>
    `
    tbody.appendChild(tr)
  }
}

const setLog = (msg: string): void => {
  const log = document.getElementById('log')
  if (log) log.textContent = msg
}

const setButtonsDisabled = (disabled: boolean): void => {
  const ids = ['run', 'run-regor', 'run-vue']
  for (const id of ids) {
    const button = document.getElementById(id) as HTMLButtonElement | null
    if (button) button.disabled = disabled
  }
}

const runRegorSamples = async (
  root: HTMLElement,
  count: number,
): Promise<BenchResult[]> => {
  const out: BenchResult[] = []
  for (let i = 0; i < count; i++) out.push(await runRegor(root))
  return out
}

const runVueSamples = async (
  root: HTMLElement,
  count: number,
): Promise<BenchResult[]> => {
  const out: BenchResult[] = []
  for (let i = 0; i < count; i++) out.push(await runVue(root))
  return out
}

const runComparativeSamples = async (
  regorRoot: HTMLElement,
  vueRoot: HTMLElement,
  samples: number,
): Promise<{ regor: BenchResult[]; vue: BenchResult[] }> => {
  const regor: BenchResult[] = []
  const vue: BenchResult[] = []
  for (let i = 0; i < samples; i++) {
    const regorFirst = (i & 1) === 0
    if (regorFirst) {
      regor.push(await runRegor(regorRoot))
      vue.push(await runVue(vueRoot))
    } else {
      vue.push(await runVue(vueRoot))
      regor.push(await runRegor(regorRoot))
    }
    setLog(`Measured sample ${i + 1}/${samples}...`)
  }
  return { regor, vue }
}

const run = async (): Promise<void> => {
  setButtonsDisabled(true)
  try {
    setLog(
      `Warmup ${WARMUP_RUNS} rounds (unmeasured), then ${SAMPLE_RUNS} measured samples (A/B alternating)...`,
    )
    const regorRoot = document.getElementById('regor-root')
    const vueRoot = document.getElementById('vue-root')
    if (!regorRoot || !vueRoot) {
      setLog('Missing benchmark roots in DOM.')
      return
    }
    for (let i = 0; i < WARMUP_RUNS; i++) {
      if ((i & 1) === 0) {
        await runRegor(regorRoot)
        await runVue(vueRoot)
      } else {
        await runVue(vueRoot)
        await runRegor(regorRoot)
      }
    }
    const measured = await runComparativeSamples(
      regorRoot,
      vueRoot,
      SAMPLE_RUNS,
    )
    const regorSummary = summarize('Regor', measured.regor)
    const vueSummary = summarize('Vue@latest', measured.vue)
    renderResults([regorSummary, vueSummary])
    setLog('Done. Showing mount median + p90 only.')
    console.table([regorSummary, vueSummary])
  } catch (e) {
    console.error(e)
    setLog(`Benchmark failed: ${(e as Error).message}`)
  } finally {
    setButtonsDisabled(false)
  }
}

const runOnlyRegor = async (): Promise<void> => {
  setButtonsDisabled(true)
  try {
    setLog(
      `Regor: warmup ${WARMUP_RUNS} rounds (unmeasured), ${SAMPLE_RUNS} measured samples...`,
    )
    const regorRoot = document.getElementById('regor-root')
    if (!regorRoot) {
      setLog('Missing Regor root in DOM.')
      return
    }
    await runRegorSamples(regorRoot, WARMUP_RUNS)
    const samples = await runRegorSamples(regorRoot, SAMPLE_RUNS)
    const summary = summarize('Regor', samples)
    renderResults([summary])
    setLog('Regor done. Showing mount median + p90.')
    console.table([summary])
  } catch (e) {
    console.error(e)
    setLog(`Regor benchmark failed: ${(e as Error).message}`)
  } finally {
    setButtonsDisabled(false)
  }
}

const runOnlyVue = async (): Promise<void> => {
  setButtonsDisabled(true)
  try {
    setLog(
      `Vue: warmup ${WARMUP_RUNS} rounds (unmeasured), ${SAMPLE_RUNS} measured samples...`,
    )
    const vueRoot = document.getElementById('vue-root')
    if (!vueRoot) {
      setLog('Missing Vue root in DOM.')
      return
    }
    await runVueSamples(vueRoot, WARMUP_RUNS)
    const samples = await runVueSamples(vueRoot, SAMPLE_RUNS)
    const summary = summarize('Vue@latest', samples)
    renderResults([summary])
    setLog('Vue done. Showing mount median + p90.')
    console.table([summary])
  } catch (e) {
    console.error(e)
    setLog(`Vue benchmark failed: ${(e as Error).message}`)
  } finally {
    setButtonsDisabled(false)
  }
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
        `Ready. Initial-load benchmark with ${ROW_COUNT} rows, ${WARMUP_RUNS} warmups, ${SAMPLE_RUNS} samples.`,
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
