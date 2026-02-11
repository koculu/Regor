import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { beforeEach } from 'vitest'

import { RegorConfig } from '../src/'
GlobalRegistrator.register()

/** Happy DOM CSS.escape is not supporting attribute names starting with ':'. A temporary workaround is replacing queried directive names with r- prefix. */
const changeDirectiveAttributesForHappyDom = () => {
  RegorConfig.getDefault().updateDirectives(
    (_, builtInNames) => (builtInNames.is = 'r-is'),
  )
}

beforeEach(() => changeDirectiveAttributesForHappyDom())
