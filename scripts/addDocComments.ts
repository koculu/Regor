import { promises as fs } from 'fs'
import path from 'path'

async function walk(dir: string, filelist: string[] = []): Promise<string[]> {
  const files = await fs.readdir(dir)
  for (const file of files) {
    const filepath = path.join(dir, file)
    const stat = await fs.stat(filepath)
    if (stat.isDirectory()) {
      await walk(filepath, filelist)
    } else if (file.endsWith('.ts')) {
      filelist.push(filepath)
    }
  }
  return filelist
}

function needsComment(lines: string[], index: number): boolean {
  for (let i = index - 1; i >= 0; i--) {
    const line = lines[i].trim()
    if (line === '') continue
    if (line.startsWith('/**')) return false
    if (line.startsWith('*')) return false
    if (line.startsWith('//')) return false
    if (line.startsWith('/*')) return false
    break
  }
  return true
}

function buildComment(name: string, kind: string): string {
  return [
    '/**',
    ` * ${name} ${kind}.`,
    ' *',
    ` * TODO: Provide detailed documentation for ${name}.`,
    ' */',
  ].join('\n')
}

async function processFile(file: string): Promise<boolean> {
  const content = await fs.readFile(file, 'utf8')
  const lines = content.split(/\r?\n/)
  let modified = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const match = line.match(
      /^export\s+(default\s+)?(async\s+)?(function|class|interface|type|const)\s+([A-Za-z0-9_]+)/,
    )
    if (match) {
      const [, , , kind, name] = match
      if (needsComment(lines, i)) {
        const comment = buildComment(name, kind)
        lines.splice(i, 0, comment)
        i += comment.split('\n').length
        modified = true
      }
    }
  }
  if (modified) {
    await fs.writeFile(file, lines.join('\n'))
  }
  return modified
}

async function main() {
  const files = await walk(path.join(process.cwd(), 'src'))
  let count = 0
  for (const file of files) {
    const changed = await processFile(file)
    if (changed) {
      console.log('Updated', file)
      count++
    }
  }
  console.log('Files updated:', count)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
