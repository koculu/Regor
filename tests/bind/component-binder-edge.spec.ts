import { expect, test, vi } from 'vitest'

import { createComponent } from '../../src/app/createComponent'
import { RegorConfig } from '../../src/app/RegorConfig'
import { Binder } from '../../src/bind/Binder'
import { Parser } from '../../src/parser/Parser'

const createBinder = (contexts: any[], config?: RegorConfig) => {
  const cfg = config ?? new RegorConfig()
  const parser = new Parser(contexts, cfg)
  return new Binder(parser)
}

test('component binder skips pre-marked and parentless component candidates', () => {
  const binder = createBinder([
    {
      components: {
        Edge: createComponent('<div></div>'),
      },
    },
  ])
  const preName = (binder as any).__pre as string

  const withPre = document.createElement('edge')
  withPre.setAttribute(preName, '')
  const parentless = document.createElement('edge')

  const fakeRoot = {
    querySelectorAll: () => [withPre, parentless],
  } as any

  expect(() =>
    (binder as any).__componentBinder.__unwrapComponents(fakeRoot),
  ).not.toThrow()
})

test('component binder routes dot-prop directives into singlePropDirective binding', () => {
  const root = document.createElement('div')
  const comp = createComponent('<div class="slot"></div>', {
    defaultName: 'DotComp',
    props: ['msg'],
    context: () => ({ msg: '' }),
  })
  const cfg = new RegorConfig()
  cfg.addComponent(comp)
  const binder = createBinder([{}], cfg)

  root.innerHTML = '<dot-comp></dot-comp>'
  const host = root.querySelector('dot-comp') as HTMLElement
  const collectSpy = vi
    .spyOn((binder as any).__directiveCollector, '__collect')
    .mockReturnValue(
      new Map([
        [
          '.msg',
          {
            __terms: ['.', 'msg'],
            __flags: [],
            __elements: [host],
          },
        ],
      ]),
    )
  const bindSpy = vi.spyOn(binder as any, '__bind')

  ;(binder as any).__componentBinder.__unwrapComponents(root)

  expect(bindSpy).toHaveBeenCalled()
  collectSpy.mockRestore()
  bindSpy.mockRestore()
})

test('component binder skips unsupported directive names even if option matches a prop', () => {
  const root = document.createElement('div')
  const comp = createComponent('<div class="slot"></div>', {
    defaultName: 'SkipComp',
    props: ['msg'],
    context: () => ({ msg: '' }),
  })
  const cfg = new RegorConfig()
  cfg.addComponent(comp)
  const binder = createBinder([{}], cfg)

  root.innerHTML = '<skip-comp></skip-comp>'
  const host = root.querySelector('skip-comp') as HTMLElement
  const collectSpy = vi
    .spyOn((binder as any).__directiveCollector, '__collect')
    .mockReturnValue(
      new Map([
        [
          '@msg',
          {
            __terms: ['@', 'msg'],
            __flags: [],
            __elements: [host],
          },
        ],
      ]),
    )
  const bindSpy = vi.spyOn(binder as any, '__bind')

  ;(binder as any).__componentBinder.__unwrapComponents(root)

  expect(bindSpy).not.toHaveBeenCalledWith(
    expect.anything(),
    host,
    '@msg',
    true,
    'msg',
    expect.anything(),
  )
  collectSpy.mockRestore()
  bindSpy.mockRestore()
})

test('component binder ignores :props/:props-once during attribute fallthrough transfer', () => {
  const root = document.createElement('div')
  const comp = createComponent('<div class="inner"></div>', {
    defaultName: 'PropsSkip',
  })
  const cfg = new RegorConfig()
  cfg.addComponent(comp)
  const binder = createBinder([{}], cfg)
  const originalBind = (binder as any).__bind.bind(binder)

  ;(binder as any).__bind = (...args: any[]) => {
    const attr = args[2] as string
    if (attr === ':props' || attr === ':props-once') return
    return originalBind(...args)
  }

  root.innerHTML =
    '<props-skip :props="{a:1}" :props-once="{b:2}" class="host"></props-skip>'
  ;(binder as any).__componentBinder.__unwrapComponents(root)

  const inner = root.querySelector('.inner') as HTMLElement
  expect(inner).toBeTruthy()
  expect(inner.hasAttribute(':props')).toBe(false)
  expect(inner.hasAttribute(':props-once')).toBe(false)
})
