import esbuild, { BuildOptions } from 'esbuild'

import { getArgument } from './Utility'

const watch = getArgument('--watch') ? '--watch' : ''
const minify = getArgument('--minify') ? '--minify' : ''

export class Builder {
  #source: string

  #outfile: string

  Options: BuildOptions

  getTypescriptFiles() {
    return [this.#source]
  }

  constructor(source: string, outfile: string) {
    this.#source = source
    this.#outfile = outfile
    const files = this.getTypescriptFiles()
    this.Options = {
      define: {},
      bundle: true,
      entryPoints: files,
      minify: !!minify,
      outbase: 'src',
      outfile: this.#outfile,
      logLevel: 'debug',
      plugins: [],
    }
  }

  async buildTypescript() {
    const options = this.Options
    esbuild.build(options)
  }

  async watchTypescript() {
    const options = this.Options
    const ctx = await esbuild.context(options)
    ctx.watch()
  }

  async build() {
    if (watch) {
      this.watchTypescript()
    } else {
      this.buildTypescript()
    }
  }
}
