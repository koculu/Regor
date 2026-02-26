import {
  createApp as createRegorApp,
  html,
  Ref,
  ref,
  RegorConfig,
} from '../../src'
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
  mutateMs: number
  totalMs: number
  rowsFinal: number
  scenarioMs: Record<string, number>
}

type BenchSummary = {
  framework: string
  mountMedian: number
  mountP90: number
  mutateMedian: number
  mutateP90: number
  totalMedian: number
  totalP90: number
  rowsFinal: number
  samples: number
}

type ScenarioSummary = {
  framework: string
  scenario: string
  median: number
  p90: number
  samples: number
}

const STRIDE = 17
const SPLICE_SIZE = 24
const INSERT_HEAD_SIZE = 32
const REMOVE_EVERY_K = 5
const SHUFFLE_SEED = 1337
const SCENARIOS = [
  'swap_second_last',
  'reverse_rows',
  'rotate_head_tail',
  'splice_middle_replace',
  'mutate_stride_fields',
  'increment_odd_values_by_5',
  'insert_head_32',
  'remove_every_5th',
  'shuffle_deterministic',
  'replace_all_objects_same_keys',
  'toggle_class_all_rows',
] as const

type ScenarioName = (typeof SCENARIOS)[number]

type VueRuntime = {
  createApp: (options: { data: () => { rows: Row[] }; template: string }) => {
    mount: (root: HTMLElement) => void
    unmount: () => void
  }
  reactive: <T extends object>(state: T) => T
}

type RegorScenarioRuntime = {
  getRows: () => Ref<Row>[]
  createInserts: (count: number) => Row[]
}

type VueScenarioRuntime = {
  getRows: () => Row[]
  createInserts: (count: number) => Row[]
}

type PairedScenarioDefinition = {
  name: ScenarioName
  regor: (runtime: RegorScenarioRuntime) => void
  vue: (runtime: VueScenarioRuntime) => void
}

let lastRegorApp: { unbind: () => void } | null = null
let lastVueApp: { unmount: () => void } | null = null

const makeRows = (count: number, startId = 0): Row[] => {
  const out: Row[] = []
  for (let i = 0; i < count; i++) {
    const id = startId + i
    out.push({
      id,
      label: `row-${id}`,
      value: id % 97,
      active: (id & 1) === 0,
    })
  }
  return out
}

const getRegorLabel = (): string => 'Regor'

const shuffleDeterministic = <T>(rows: T[]): void => {
  let seed = SHUFFLE_SEED
  for (let i = rows.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const j = seed % (i + 1)
    const tmp = rows[i]
    rows[i] = rows[j]
    rows[j] = tmp
  }
}

const SCENARIO_DEFINITIONS: readonly PairedScenarioDefinition[] = [
  {
    name: 'swap_second_last',
    regor: ({ getRows }) => {
      const rows = getRows()
      if (rows.length < 3) return
      const tmp = rows[1]
      rows[1] = rows[rows.length - 1]
      rows[rows.length - 1] = tmp
    },
    vue: ({ getRows }) => {
      const rows = getRows()
      if (rows.length < 3) return
      const tmp = rows[1]
      rows[1] = rows[rows.length - 1]
      rows[rows.length - 1] = tmp
    },
  },
  {
    name: 'reverse_rows',
    regor: ({ getRows }) => {
      getRows().reverse()
    },
    vue: ({ getRows }) => {
      getRows().reverse()
    },
  },
  {
    name: 'rotate_head_tail',
    regor: ({ getRows }) => {
      const rows = getRows()
      const head = rows.shift()
      if (head) rows.push(head)
    },
    vue: ({ getRows }) => {
      const rows = getRows()
      const head = rows.shift()
      if (head) rows.push(head)
    },
  },
  {
    name: 'splice_middle_replace',
    regor: ({ getRows, createInserts }) => {
      const rows = getRows()
      const mid = (rows.length / 2) | 0
      rows.splice(mid, SPLICE_SIZE, ...ref(createInserts(SPLICE_SIZE))())
    },
    vue: ({ getRows, createInserts }) => {
      const rows = getRows()
      const mid = (rows.length / 2) | 0
      rows.splice(mid, SPLICE_SIZE, ...createInserts(SPLICE_SIZE))
    },
  },
  {
    name: 'mutate_stride_fields',
    regor: ({ getRows }) => {
      const rows = getRows()
      for (let i = 0; i < rows.length; i += STRIDE) {
        const row = rows[i]()
        row.value.value += 1
        row.active.value = !row.active.value
        row.label.value = `row-${row.id.value}-m`
      }
    },
    vue: ({ getRows }) => {
      const rows = getRows()
      for (let i = 0; i < rows.length; i += STRIDE) {
        const row = rows[i]
        row.value += 1
        row.active = !row.active
        row.label = `row-${row.id}-m`
      }
    },
  },
  {
    name: 'increment_odd_values_by_5',
    regor: ({ getRows }) => {
      const rows = getRows()
      for (let i = 1; i < rows.length; i += 2) {
        const row = rows[i]()
        row.value.value += 5
      }
    },
    vue: ({ getRows }) => {
      const rows = getRows()
      for (let i = 1; i < rows.length; i += 2) {
        rows[i].value += 5
      }
    },
  },
  {
    name: 'insert_head_32',
    regor: ({ getRows, createInserts }) => {
      const rows = getRows()
      rows.unshift(...ref(createInserts(INSERT_HEAD_SIZE))())
    },
    vue: ({ getRows, createInserts }) => {
      const rows = getRows()
      rows.unshift(...createInserts(INSERT_HEAD_SIZE))
    },
  },
  {
    name: 'remove_every_5th',
    regor: ({ getRows }) => {
      const rows = getRows()
      for (let i = rows.length - 1; i >= 0; i--) {
        if (i % REMOVE_EVERY_K === 0) rows.splice(i, 1)
      }
    },
    vue: ({ getRows }) => {
      const rows = getRows()
      for (let i = rows.length - 1; i >= 0; i--) {
        if (i % REMOVE_EVERY_K === 0) rows.splice(i, 1)
      }
    },
  },
  {
    name: 'shuffle_deterministic',
    regor: ({ getRows }) => {
      const rows = getRows()
      shuffleDeterministic(rows)
    },
    vue: ({ getRows }) => {
      const rows = getRows()
      shuffleDeterministic(rows)
    },
  },
  {
    name: 'replace_all_objects_same_keys',
    regor: ({ getRows }) => {
      const rows = getRows()
      const replacements = rows.map((rowRef) => {
        const row = rowRef()
        return {
          id: row.id.value,
          label: `${row.label.value}-r`,
          value: row.value.value + 1,
          active: !row.active.value,
        }
      })
      for (let i = 0; i < rows.length; i++) {
        rows[i] = ref(replacements[i])
      }
    },
    vue: ({ getRows }) => {
      const rows = getRows()
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        rows[i] = {
          id: row.id,
          label: `${row.label}-r`,
          value: row.value + 1,
          active: !row.active,
        }
      }
    },
  },
  {
    name: 'toggle_class_all_rows',
    regor: ({ getRows }) => {
      const rows = getRows()
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]()
        row.active.value = !row.active.value
      }
    },
    vue: ({ getRows }) => {
      const rows = getRows()
      for (let i = 0; i < rows.length; i++) {
        rows[i].active = !rows[i].active
      }
    },
  },
]

const timeScenario = async (
  name: ScenarioName,
  resetRows: () => void,
  mutate: () => void,
): Promise<[ScenarioName, number]> => {
  resetRows()
  await nextFrame()
  const t0 = performance.now()
  mutate()
  await nextFrame()
  return [name, performance.now() - t0]
}

const measureScenarioDurations = async (
  resetRows: () => void,
  mutateForScenario: (scenario: PairedScenarioDefinition) => void,
): Promise<Record<string, number>> => {
  const scenarioMs: Record<string, number> = {}
  for (const scenario of SCENARIO_DEFINITIONS) {
    const [name, ms] = await timeScenario(scenario.name, resetRows, () =>
      mutateForScenario(scenario),
    )
    scenarioMs[name] = ms
  }
  return scenarioMs
}

const sumScenarioDurations = (scenarioMs: Record<string, number>): number =>
  SCENARIOS.reduce((sum, name) => sum + (scenarioMs[name] ?? 0), 0)

const runRegor = async (root: HTMLElement): Promise<BenchResult> => {
  if (lastRegorApp) {
    lastRegorApp.unbind()
    lastRegorApp = null
  }
  clearRoot(root)

  const rowCount = getRowCount()
  const config = new RegorConfig()

  await nextFrame()
  const mountT0 = performance.now()
  const app = createRegorApp(
    { rows: ref(makeRows(rowCount)) },
    {
      element: root,
      template: html`<div>
        <div r-for="row in rows" :key="row.id" :class="{ active: row.active }">
          <span>{{ row.id }}</span><span>{{ row.label }}</span
          ><span>{{ row.value }}</span>
        </div>
      </div>`,
    },
    config,
  )
  lastRegorApp = app

  await nextFrame()
  const mountMs = performance.now() - mountT0

  let nextScenarioId = rowCount * 10
  const scenarioMs = await measureScenarioDurations(
    () => {
      app.context.rows(ref(makeRows(rowCount)))
    },
    (scenario) =>
      scenario.regor({
        getRows: () => app.context.rows(),
        createInserts: (count: number) => {
          const inserts = makeRows(count, nextScenarioId)
          nextScenarioId += count
          return inserts
        },
      }),
  )

  const mutateMs = sumScenarioDurations(scenarioMs)
  return {
    framework: getRegorLabel(),
    mountMs,
    mutateMs,
    totalMs: mountMs + mutateMs,
    rowsFinal: app.context.rows().length,
    scenarioMs,
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
  const rowCount = getRowCount()
  const state = reactive({ rows: makeRows(rowCount) })

  await nextFrame()
  const mountT0 = performance.now()
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
  const mountMs = performance.now() - mountT0

  let nextScenarioId = rowCount * 10
  const scenarioMs = await measureScenarioDurations(
    () => {
      state.rows = makeRows(rowCount)
    },
    (scenario) =>
      scenario.vue({
        getRows: () => state.rows,
        createInserts: (count: number) => {
          const inserts = makeRows(count, nextScenarioId)
          nextScenarioId += count
          return inserts
        },
      }),
  )

  const mutateMs = sumScenarioDurations(scenarioMs)
  return {
    framework: 'Vue@latest',
    mountMs,
    mutateMs,
    totalMs: mountMs + mutateMs,
    rowsFinal: state.rows.length,
    scenarioMs,
  }
}

const summarize = (framework: string, samples: BenchResult[]): BenchSummary => {
  const mount = samples.map((x) => x.mountMs).sort((a, b) => a - b)
  const mutate = samples.map((x) => x.mutateMs).sort((a, b) => a - b)
  const total = samples.map((x) => x.totalMs).sort((a, b) => a - b)
  return {
    framework,
    mountMedian: percentile(mount, 50),
    mountP90: percentile(mount, 90),
    mutateMedian: percentile(mutate, 50),
    mutateP90: percentile(mutate, 90),
    totalMedian: percentile(total, 50),
    totalP90: percentile(total, 90),
    rowsFinal: samples[samples.length - 1]?.rowsFinal ?? 0,
    samples: samples.length,
  }
}

const summarizeScenarios = (
  framework: string,
  samples: BenchResult[],
): ScenarioSummary[] =>
  SCENARIOS.map((scenario) => {
    const values = samples
      .map((x) => x.scenarioMs[scenario] ?? 0)
      .sort((a, b) => a - b)
    return {
      framework,
      scenario,
      median: percentile(values, 50),
      p90: percentile(values, 90),
      samples: samples.length,
    }
  })

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
  const mutateMedianWinner =
    rows.length === 2
      ? winnerByDisplayedValue(
          rows[0].mutateMedian,
          rows[0].framework,
          rows[1].mutateMedian,
          rows[1].framework,
        )
      : ''
  const mutateP90Winner =
    rows.length === 2
      ? winnerByDisplayedValue(
          rows[0].mutateP90,
          rows[0].framework,
          rows[1].mutateP90,
          rows[1].framework,
        )
      : ''
  const totalMedianWinner =
    rows.length === 2
      ? winnerByDisplayedValue(
          rows[0].totalMedian,
          rows[0].framework,
          rows[1].totalMedian,
          rows[1].framework,
        )
      : ''
  const totalP90Winner =
    rows.length === 2
      ? winnerByDisplayedValue(
          rows[0].totalP90,
          rows[0].framework,
          rows[1].totalP90,
          rows[1].framework,
        )
      : ''
  const labelWinner =
    totalMedianWinner !== '' && totalMedianWinner === totalP90Winner
      ? totalMedianWinner
      : ''

  tbody.innerHTML = ''
  for (const r of rows) {
    const frameworkClass = labelWinner === r.framework ? 'winner-metric' : ''
    const mountMedianClass =
      mountMedianWinner === r.framework ? 'winner-metric' : ''
    const mountP90Class = mountP90Winner === r.framework ? 'winner-metric' : ''
    const mutateMedianClass =
      mutateMedianWinner === r.framework ? 'winner-metric' : ''
    const mutateP90Class =
      mutateP90Winner === r.framework ? 'winner-metric' : ''
    const totalMedianClass =
      totalMedianWinner === r.framework ? 'winner-metric' : ''
    const totalP90Class = totalP90Winner === r.framework ? 'winner-metric' : ''
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td class="${frameworkClass}">${r.framework}</td>
      <td class="${mountMedianClass}">${formatMs(r.mountMedian)}</td>
      <td class="${mountP90Class}">${formatMs(r.mountP90)}</td>
      <td class="${mutateMedianClass}">${formatMs(r.mutateMedian)}</td>
      <td class="${mutateP90Class}">${formatMs(r.mutateP90)}</td>
      <td class="${totalMedianClass}">${formatMs(r.totalMedian)}</td>
      <td class="${totalP90Class}">${formatMs(r.totalP90)}</td>
      <td>${r.rowsFinal}</td>
      <td>${r.samples}</td>
    `
    tbody.appendChild(tr)
  }
}

const renderScenarioResults = (rows: ScenarioSummary[]): void => {
  const tbody = document.querySelector<HTMLTableSectionElement>(
    '#scenario-results tbody',
  )
  if (!tbody) return

  const byScenario = new Map<string, ScenarioSummary[]>()
  for (const row of rows) {
    const existing = byScenario.get(row.scenario)
    if (existing) existing.push(row)
    else byScenario.set(row.scenario, [row])
  }

  tbody.innerHTML = ''
  let rowIndex = 0
  for (const scenario of SCENARIOS) {
    const pairs = (byScenario.get(scenario) ?? []).sort((a, b) => {
      const aRegor = a.framework.startsWith('Regor')
      const bRegor = b.framework.startsWith('Regor')
      if (aRegor === bRegor) return a.framework.localeCompare(b.framework)
      return aRegor ? -1 : 1
    })
    const medianWinner =
      pairs.length === 2
        ? winnerByDisplayedValue(
            pairs[0].median,
            pairs[0].framework,
            pairs[1].median,
            pairs[1].framework,
          )
        : ''
    const p90Winner =
      pairs.length === 2
        ? winnerByDisplayedValue(
            pairs[0].p90,
            pairs[0].framework,
            pairs[1].p90,
            pairs[1].framework,
          )
        : ''
    const labelWinner =
      medianWinner !== '' && medianWinner === p90Winner ? medianWinner : ''
    for (const r of pairs) {
      const tr = document.createElement('tr')
      const pairGroupClass =
        Math.floor(rowIndex / 2) % 2 === 0
          ? 'scenario-pair-a'
          : 'scenario-pair-b'
      tr.className = pairGroupClass
      const frameworkClass = labelWinner === r.framework ? 'winner-metric' : ''
      const medianClass = medianWinner === r.framework ? 'winner-metric' : ''
      const p90Class = p90Winner === r.framework ? 'winner-metric' : ''
      tr.innerHTML = `
        <td class="${frameworkClass}">${r.framework}</td>
        <td>${r.scenario}</td>
        <td class="${medianClass}">${formatMs(r.median)}</td>
        <td class="${p90Class}">${formatMs(r.p90)}</td>
        <td>${r.samples}</td>
      `
      tbody.appendChild(tr)
      rowIndex += 1
    }
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
    const regorScenarios = summarizeScenarios(getRegorLabel(), measured.a)
    const vueScenarios = summarizeScenarios('Vue@latest', measured.b)

    renderResults([regorSummary, vueSummary])
    renderScenarioResults([...regorScenarios, ...vueScenarios])

    setLog('Done. Showing median + p90. Warmups excluded.')
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
    renderScenarioResults(summarizeScenarios(getRegorLabel(), samples))
    setLog(`${getRegorLabel()} done. Showing median + p90.`)
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
    renderScenarioResults(summarizeScenarios('Vue@latest', samples))
    setLog('Vue done. Showing median + p90.')
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
        `Ready. rows=${getRowCount()}, warmups=${getWarmupRuns()}, samples=${getSampleRuns()} (median/p90).`,
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
