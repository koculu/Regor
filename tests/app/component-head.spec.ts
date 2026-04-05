import { expect, test, vi } from 'vitest'

import { IRegorContext, type PropValidator, pval, ref } from '../../src'
import { ComponentHead } from '../../src/app/ComponentHead'
import {
  peekScope,
  popScope,
  pushScope,
  setScope,
} from '../../src/composition/stack'

test('component head emits custom events from source element', () => {
  const host = document.createElement('div')
  const start = document.createComment('s')
  const end = document.createComment('e')
  host.appendChild(start)
  host.appendChild(end)
  const head = new ComponentHead({}, host, [], start, end)
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
  const head = new ComponentHead({}, host, [ctx], start, end)

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
  const head = new ComponentHead({}, host, [], start, end)

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
  const head = new ComponentHead(props, host, [], start, end)

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
  )

  expect(() =>
    head.validateProps({
      meta: pval.shape({
        tags: pval.arrayOf(pval.isString),
      }),
    }),
  ).toThrow('Invalid prop "meta.tags[1]": expected string.')
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
  )

  expect(() =>
    head.validateProps({
      demo: pval.isClass(Demo),
      title: pval.refOf(pval.isString),
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
  )

  const isNonEmptyString: PropValidator<string> = (value, name) => {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(`Invalid prop "${name}": expected non-empty string.`)
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
  )

  expect(() =>
    badHead.validateProps({
      title: isNonEmptyString,
    }),
  ).toThrow('Invalid prop "title": expected non-empty string.')
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
