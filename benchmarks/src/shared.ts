export const DEFAULT_ROW_COUNT = 500
export const SAMPLE_RUNS = 20
export const WARMUP_RUNS = 6
export const VUE_ESM_URL =
  'https://cdn.jsdelivr.net/npm/vue@latest/dist/vue.esm-browser.prod.js'

let vueModulePromise: Promise<unknown> | null = null

export const nextFrame = async (): Promise<void> => {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
}

export const clearRoot = (root: HTMLElement): void => {
  root.innerHTML = ''
}

export const getRowCount = (): number => {
  const select = document.getElementById(
    'row-count',
  ) as HTMLSelectElement | null
  const value = Number(select?.value ?? DEFAULT_ROW_COUNT)
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_ROW_COUNT
}

const getIntFromSelect = (
  id: string,
  min: number,
  fallback: number,
): number => {
  const select = document.getElementById(id) as HTMLSelectElement | null
  const value = Number(select?.value ?? fallback)
  return Number.isInteger(value) && value >= min ? value : fallback
}

export const getWarmupRuns = (): number =>
  getIntFromSelect('warmup-runs', 0, WARMUP_RUNS)

export const getSampleRuns = (): number =>
  getIntFromSelect('sample-runs', 1, SAMPLE_RUNS)

export const loadVueModule = async (): Promise<unknown> => {
  if (!vueModulePromise) {
    vueModulePromise = import(/* @vite-ignore */ VUE_ESM_URL)
  }
  return vueModulePromise
}

export const formatMs = (n: number): string => n.toFixed(2)

export const percentile = (sorted: number[], p: number): number => {
  if (!sorted.length) return 0
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  )
  return sorted[idx]
}

export const setLog = (msg: string): void => {
  const log = document.getElementById('log')
  if (log) log.textContent = msg
}

export const setButtonsDisabled = (disabled: boolean): void => {
  const ids = [
    'run',
    'run-regor',
    'run-vue',
    'row-count',
    'warmup-runs',
    'sample-runs',
  ]
  for (const id of ids) {
    const button = document.getElementById(id) as
      | HTMLButtonElement
      | HTMLInputElement
      | null
    if (button) button.disabled = disabled
  }
}

export const runSamples = async <T>(
  count: number,
  runOne: () => Promise<T>,
): Promise<T[]> => {
  const out: T[] = []
  for (let i = 0; i < count; i++) out.push(await runOne())
  return out
}

export const runAlternating = async <A, B>(
  runs: number,
  runA: () => Promise<A>,
  runB: () => Promise<B>,
  onEachRun?: (runIndex: number) => void,
): Promise<{ a: A[]; b: B[] }> => {
  const a: A[] = []
  const b: B[] = []
  for (let i = 0; i < runs; i++) {
    if ((i & 1) === 0) {
      a.push(await runA())
      b.push(await runB())
    } else {
      b.push(await runB())
      a.push(await runA())
    }
    onEachRun?.(i)
  }
  return { a, b }
}
