import { createProxy, setToStringTag } from './proxy'

const setProto = Set.prototype as any
/**
 * @internal
 */
export const proxySetProto = Object.create(setProto)
const methodsToPatch = ['add', 'clear', 'delete']

setToStringTag(proxySetProto, 'Set')
createProxy(setProto, proxySetProto, methodsToPatch)
