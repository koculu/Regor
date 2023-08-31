import { createProxy } from './proxy'

const arrayProto = Array.prototype
/**
 * @internal
 */
export const proxyArrayProto = Object.create(arrayProto)

const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse',
]

createProxy(arrayProto, proxyArrayProto, methodsToPatch)
