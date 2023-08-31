import { createProxy, setToStringTag } from './proxy'

const mapProto = Map.prototype as any
/**
 * @internal
 */
export const proxyMapProto = Object.create(mapProto)

const methodsToPatch = ['set', 'clear', 'delete']

setToStringTag(proxyMapProto, 'Map')
createProxy(mapProto, proxyMapProto, methodsToPatch)
