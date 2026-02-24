import { createReadStream, existsSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

const PORT = 4177
const ROOT = process.cwd()

const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
}

const safePath = (urlPath: string): string => {
  const base =
    urlPath === '/'
      ? '/benchmarks/index.html'
      : urlPath.startsWith('/dist/')
        ? `/benchmarks${urlPath}`
        : urlPath
  const normalized = normalize(base).replace(/^(\.\.[/\\])+/, '')
  return join(ROOT, normalized)
}

createServer(async (req, res) => {
  try {
    const requestPath = req.url?.split('?')[0] ?? '/'
    const filePath = safePath(requestPath)
    if (!existsSync(filePath)) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('Not found')
      return
    }

    const s = await stat(filePath)
    if (!s.isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('Not found')
      return
    }

    const type = mime[extname(filePath)] ?? 'application/octet-stream'
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' })
    createReadStream(filePath).pipe(res)
  } catch (e) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
    res.end(`Server error: ${(e as Error).message}`)
  }
}).listen(PORT, () => {
  console.log(`Benchmark server: http://localhost:${PORT}/`)
})
