import { type OnMounted } from '../api/types'
import { peekScope } from './stack'

export const onMounted = (onMounted: OnMounted): void => {
  peekScope()?.onMounted.push(onMounted)
}
