import { expect, test, vi } from 'vitest'

import { IRegorContext, type PropValidator, pval, ref } from '../../src'
import { ComponentHead } from '../../src/app/ComponentHead'
import {
  peekScope,
  popScope,
  pushScope,
  setScope,
} from '../../src/composition/stack'
import { warningHandler } from '../../src/log/warnings'

test('component head emits custom events from source element', () => {
  const host = document.createElement('div')
  const start = document.createComment('s')
  const end = document.createComment('e')
  host.appendChild(start)
  host.appendChild(end)
  const head = new ComponentHead({}, host, [], start, end, 'throw')
  const spy = vi.fn()
  host.addEventListener('save', spy)

  head.emit('save', { x: 1 })

  expect(spy).toHaveBeenCalledTimes(1)
  expect((spy.mock.calls[0][0] as CustomEvent).detail).toEqual({ x: 1 })
})

test('component head unmount removes nodes between markers and calls unmounted hooks', async () => {
  const host = document.createElement('div')
  const start = document.createComment('s')
  const n1 = document.createElement('span')
  const n2 = document.createElement('span')
  const end = document.createComment('e')
  host.appendChild(start)
  host.appendChild(n1)
  host.appendChild(n2)
  host.appendChild(end)

  const stop = vi.fn()
  const ctx = {} as any
  pushScope()
  setScope(ctx)
  ;(peekScope() as any).onUnmounted.push(stop)
  popScope()
  const head = new ComponentHead({}, host, [ctx], start, end, 'throw')

  head.unmount()
  await new Promise((resolve) => setTimeout(resolve, 5))

  expect(host.contains(n1)).toBe(false)
  expect(stop).toHaveBeenCalledTimes(1)
})

test('component head findContext returns first matching parent context', () => {
  class ParentContext {
    constructor(readonly value: number) {}
  }
  class OtherContext {
    readonly name = 'other'
  }

  const host = document.createElement('div')
  const start = document.createComment('s')
  const end = document.createComment('e')
  const other = new OtherContext()
  const parent1 = new ParentContext(1)
  const parent2 = new ParentContext(2)
  const head = new ComponentHead(
    {},
    host,
    [other, parent1, parent2 as any],
    start,
    end,
    'throw',
  )

  expect(head.findContext(ParentContext)).toBe(parent1)
  expect(head.findContext(ParentContext, 1)).toBe(parent2)
  expect(head.findContext(ParentContext, 2)).toBeUndefined()
  expect(head.findContext(ParentContext, -1)).toBeUndefined()
  expect(head.findContext(Date)).toBeUndefined()
})

test('component head requireContext throws when parent context is missing', () => {
  class ParentContext {}

  const host = document.createElement('div')
  const start = document.createComment('s')
  const end = document.createComment('e')
  const head = new ComponentHead({}, host, [], start, end, 'throw')

  expect(() => head.requireContext(ParentContext)).toThrow(
    `${ParentContext} was not found in the context stack at occurrence 0.`,
  )
  expect(() => head.requireContext(ParentContext, 1)).toThrow(
    `${ParentContext} was not found in the context stack at occurrence 1.`,
  )
})

test('component head validateProps validates selected props without mutating props', () => {
  const host = document.createElement('div')
  const start = document.createComment('s')
  const end = document.createComment('e')
  const props: {
    title: string
    count: number
    mode: string
    tags: string[]
    meta: {
      slug: string
      retries: null
    }
    missing?: string
  } = {
    title: 'Hello',
    count: 2,
    mode: 'edit',
    tags: ['a', 'b'],
    meta: {
      slug: 'post-1',
      retries: null,
    },
  }
  const head = new ComponentHead(props, host, [], start, end, 'throw')

  expect(() =>
    head.validateProps({
      title: pval.isString,
      count: pval.isNumber,
      mode: pval.oneOf(['create', 'edit'] as const),
      tags: pval.arrayOf(pval.isString),
      meta: pval.shape({
        slug: pval.isString,
        retries: pval.nullable(pval.isNumber),
      }),
      missing: pval.optional(pval.isString),
    }),
  ).not.toThrow()
  expect(head.props).toBe(props)
})

test('component head validateProps throws with nested prop path details', () => {
  const host = document.createElement('div')
  const start = document.createComment('s')
  const end = document.createComment('e')
  const head = new ComponentHead(
    {
      meta: {
        tags: ['ok', 2],
      },
    },
    host,
    [],
    start,
    end,
    'throw',
  )

  expect(() =>
    head.validateProps({
      meta: pval.shape({
        tags: pval.arrayOf(pval.isString),
      }),
    }),
  ).toThrow(
    'Invalid prop "meta.tags[1]" on <div>: expected string, got number (2).',
  )
})

test('component head validator utilities support class and ref validation', () => {
  class Demo {
    constructor(readonly label: string) {}
  }

  const host = document.createElement('div')
  const start = document.createComment('s')
  const end = document.createComment('e')
  const head = new ComponentHead(
    {
      demo: new Demo('x'),
      title: ref('ready'),
    },
    host,
    [],
    start,
    end,
    'throw',
  )

  expect(() =>
    head.validateProps({
      demo: pval.isClass(Demo),
      title: pval.refOf(pval.isString),
    }),
  ).not.toThrow()
})

test('component head validator utilities support or validation', () => {
  const host = document.createElement('div')
  const start = document.createComment('s')
  const end = document.createComment('e')

  const okHead = new ComponentHead(
    {
      value: 42,
    },
    host,
    [],
    start,
    end,
    'throw',
  )

  expect(() =>
    okHead.validateProps({
      value: pval.or(pval.isString, pval.isNumber),
    }),
  ).not.toThrow()

  const badHead = new ComponentHead(
    {
      value: true,
    },
    host,
    [],
    start,
    end,
    'throw',
  )

  expect(() =>
    badHead.validateProps({
      value: pval.or(pval.isString, pval.isNumber),
    }),
  ).toThrow(
    'Invalid prop "value" on <div>: expected string or expected number, got boolean (true).',
  )
})

test('component head validator utilities support or validation with ref branches', () => {
  const host = document.createElement('div')
  const start = document.createComment('s')
  const end = document.createComment('e')
  const head = new ComponentHead(
    {
      value: ref(1),
    },
    host,
    [],
    start,
    end,
    'throw',
  )

  expect(() =>
    head.validateProps({
      value: pval.or(pval.isString, pval.refOf(pval.isString)),
    }),
  ).toThrow(
    'Invalid prop "value" on <div>: expected string or expected ref<string>, got ref<number>(1).',
  )
})

test('component head validator utilities support or validation with alternate shapes', () => {
  const host = document.createElement('div')
  const start = document.createComment('s')
  const end = document.createComment('e')

  const okHead = new ComponentHead(
    {
      value: {
        slug: 'post-1',
      },
    },
    host,
    [],
    start,
    end,
    'throw',
  )

  expect(() =>
    okHead.validateProps({
      value: pval.or(
        pval.shape({
          slug: pval.isString,
        }),
        pval.shape({
          id: pval.isNumber,
        }),
      ),
    }),
  ).not.toThrow()
})

test('component head validator utilities support nested or validation inside shapes', () => {
  const host = document.createElement('div')
  const start = document.createComment('s')
  const end = document.createComment('e')

  const okHead = new ComponentHead(
    {
      meta: {
        owner: ref('ada'),
      },
    },
    host,
    [],
    start,
    end,
    'throw',
  )

  expect(() =>
    okHead.validateProps({
      meta: pval.shape({
        owner: pval.or(pval.isString, pval.refOf(pval.isString)),
      }),
    }),
  ).not.toThrow()

  const badHead = new ComponentHead(
    {
      meta: {
        owner: ref(12),
      },
    },
    host,
    [],
    start,
    end,
    'throw',
  )

  expect(() =>
    badHead.validateProps({
      meta: pval.shape({
        owner: pval.or(pval.isString, pval.refOf(pval.isString)),
      }),
    }),
  ).toThrow(
    'Invalid prop "meta.owner" on <div>: expected string or expected ref<string>, got ref<number>(12).',
  )
})

test('component head validator utilities support explicit generic shape schemas', () => {
  type TabPaneType = {
    tabId: number
    title: string
    closable?: boolean
  }

  interface TabPaneInterface {
    tabId: number
    title: string
    disabled?: boolean
  }

  class TabPaneClass {
    tabId = 0
    title = ''
    visible?: boolean
  }

  const host = document.createElement('div')
  const start = document.createComment('s')
  const end = document.createComment('e')
  const head = new ComponentHead(
    {
      typePane: {
        tabId: 1,
        title: 'Type pane',
      },
      interfacePane: {
        tabId: 2,
        title: 'Interface pane',
      },
      classPane: {
        tabId: 3,
        title: 'Class pane',
      },
    },
    host,
    [],
    start,
    end,
    'throw',
  )

  expect(() =>
    head.validateProps({
      typePane: pval.shape<TabPaneType>({
        tabId: pval.isNumber,
      }),
      interfacePane: pval.shape<TabPaneInterface>({
        tabId: pval.isNumber,
      }),
      classPane: pval.shape<TabPaneClass>({
        tabId: pval.isNumber,
      }),
    }),
  ).not.toThrow()
})

test('component head validateProps accepts custom user validators', () => {
  const host = document.createElement('div')
  const start = document.createComment('s')
  const end = document.createComment('e')
  const head = new ComponentHead(
    {
      title: 'Ready',
    },
    host,
    [],
    start,
    end,
    'throw',
  )

  const isNonEmptyString: PropValidator<string> = (value, name) => {
    if (typeof value !== 'string' || value.trim() === '') {
      pval.fail(name, 'expected non-empty string')
    }
  }

  expect(() =>
    head.validateProps({
      title: isNonEmptyString,
    }),
  ).not.toThrow()

  const badHead = new ComponentHead(
    {
      title: '   ',
    },
    host,
    [],
    start,
    end,
    'throw',
  )

  expect(() =>
    badHead.validateProps({
      title: isNonEmptyString,
    }),
  ).toThrow('Invalid prop "title" on <div>: expected non-empty string.')
})

test('component head validateProps custom validators can use head context', () => {
  class ParentContext implements IRegorContext {
    [key: string]: unknown

    constructor(readonly prefix: string) {}
  }

  type PrefixedTitleProps = {
    title: string
  }

  const host = document.createElement('div')
  const start = document.createComment('s')
  const end = document.createComment('e')
  const parent = new ParentContext('pre:')
  const head = new ComponentHead<PrefixedTitleProps>(
    {
      title: 'pre:title',
    },
    host,
    [parent],
    start,
    end,
    'throw',
  )

  const startsWithParentPrefix: PropValidator<string> = (
    value,
    name,
    current,
  ) => {
    const ctx = current.requireContext(ParentContext)
    if (typeof value !== 'string' || !value.startsWith(ctx.prefix)) {
      throw new Error(
        `Invalid prop "${name}": expected value to start with ${ctx.prefix}.`,
      )
    }
  }

  expect(() =>
    head.validateProps({
      title: startsWithParentPrefix,
    }),
  ).not.toThrow()
})

test('component head validateProps warns instead of throwing in warn mode', () => {
  const host = document.createElement('div')
  const start = document.createComment('s')
  const end = document.createComment('e')
  const warnSpy = vi
    .spyOn(warningHandler, 'warning')
    .mockImplementation(() => {})

  try {
    const head = new ComponentHead(
      {
        count: 'bad',
      },
      host,
      [],
      start,
      end,
      'warn',
    )

    expect(() =>
      head.validateProps({
        count: pval.isNumber,
      }),
    ).not.toThrow()
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(String(warnSpy.mock.calls[0][0])).toContain(
      'Invalid prop "count" on <div>: expected number, got string ("bad").',
    )
  } finally {
    warnSpy.mockRestore()
  }
})

test('component head validateProps skips validation in off mode', () => {
  const host = document.createElement('div')
  const start = document.createComment('s')
  const end = document.createComment('e')
  const warnSpy = vi
    .spyOn(warningHandler, 'warning')
    .mockImplementation(() => {})

  try {
    const head = new ComponentHead(
      {
        count: 'bad',
      },
      host,
      [],
      start,
      end,
      'off',
    )

    expect(() =>
      head.validateProps({
        count: pval.isNumber,
      }),
    ).not.toThrow()
    expect(warnSpy).not.toHaveBeenCalled()
  } finally {
    warnSpy.mockRestore()
  }
})
