import { version } from '../package.json'
import { srefSymbol } from './reactivity/refSymbols'

const runtimeKey = Symbol.for('regor.runtime')
const runtimeGlobal = globalThis as typeof globalThis & {
  [runtimeKey]?: { version: string; identity: symbol }
}
const loaded = runtimeGlobal[runtimeKey]

if (loaded && loaded.identity !== srefSymbol) {
  const error = new Error(
    `Regor ${loaded.version} is already loaded; another runtime using ${version} was imported. ` +
      'Ensure the renderer and components share one Regor instance.',
  )
  error.name = 'RegorRuntimeMismatch'
  throw error
}

if (!loaded) {
  runtimeGlobal[runtimeKey] = { version, identity: srefSymbol }
}
