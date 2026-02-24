import { expect, test } from 'vitest'

import { jsep } from '../../src/parser/jsep/jsep'
import { regorEval } from '../../src/parser/regorEval'

const evalExpr = (
  expr: string,
  contexts: Record<string, any>[],
  globalContext?: Record<string, any>,
  context?: Record<string, any>,
) =>
  regorEval(jsep(expr), contexts, globalContext, undefined, undefined, context)
    .value

test('evaluates arithmetic, comparison, logic and bitwise operators', () => {
  const ctx = {
    a: 10,
    b: 3,
    c: 0,
    d: null as any,
    e: 2,
    obj: { x: 5 },
    k: 'x',
  }

  const cases = [
    ['a + b * e', 16],
    ['(a + b) * e', 26],
    ['a % b', 1],
    ['a ** e', 100],
    ['a > b && b < e', false],
    ['c || b', 3],
    ['d ?? b', 3],
    ['a & 6', 2],
    ['a | 1', 11],
    ['a ^ 3', 9],
    ['a << 1', 20],
    ['a >> 1', 5],
    ['a >>> 1', 5],
    ['a == "10"', true],
    ['a != "10"', false],
    ['a === "10"', false],
    ['a <= b', false],
    ['a >= b', true],
    ['k in obj', true],
    ['"x" in obj', true],
  ] as const

  for (const [expr, expected] of cases) {
    expect(evalExpr(expr, [ctx])).toBe(expected)
  }
  expect(evalExpr('a / b', [ctx])).toBeCloseTo(10 / 3)
})

test('evaluates arrays, objects, spread, calls, regex, template and new', () => {
  const ctx = {
    arr: [2, 3, 4],
    obj: { x: 7, y: 8 },
    extra: { z: 9 },
    k: 'dyn',
    sum: (...n: number[]) => n.reduce((p, c) => p + c, 0),
    make: (a: number) => (b: number) => a + b,
    name: 'regor',
    word: 'AbBBC',
    tag: (parts: string[], value: string) =>
      `${parts[0]}${value.toUpperCase()}${parts[1]}`,
  }

  expect(evalExpr('[0, ...arr, obj.x]', [ctx])).toStrictEqual([0, 2, 3, 4, 7])
  expect(evalExpr('{base: 1, [k]: obj.x, ...extra}', [ctx])).toStrictEqual({
    base: 1,
    dyn: 7,
    z: 9,
  })
  expect(evalExpr('sum(1, ...arr)', [ctx])).toBe(10)
  expect(evalExpr('make(2)(3)', [ctx])).toBe(5)
  expect(evalExpr('/^ab+c$/i.test(word)', [ctx])).toBe(true)
  expect(evalExpr('`hello ${name}`', [ctx])).toBe('hello regor')
  expect(evalExpr('tag`hello ${name}!`', [ctx])).toBe('hello REGOR!')
  expect(evalExpr('new Date(0).getUTCFullYear()', [ctx], { Date })).toBe(1970)
})

test('evaluates optional/member access, sequence, conditional and arrows', () => {
  const ctx = {
    x: 1,
    y: 2,
    user: { profile: { name: 'Ada' } },
    none: null as any,
  }

  expect(evalExpr('user?.profile.name', [ctx])).toBe('Ada')
  expect(evalExpr('none?.profile', [ctx])).toBeUndefined()
  expect(evalExpr('missing?.value', [ctx])).toBeUndefined()
  expect(evalExpr('this.x', [ctx])).toBe(1)
  expect(evalExpr('(x = 5, y = 6, x + y)', [ctx])).toBe(11)
  expect(evalExpr('x = y ? 10 : 20', [ctx])).toBe(10)
  expect(ctx.x).toBe(6)
  expect(evalExpr('((n)=>n + x)(2)', [ctx])).toBe(8)
  expect(evalExpr('(a,b)=>a*b', [ctx])(3, 4)).toBe(12)
  expect(evalExpr('()=>x+y', [ctx])()).toBe(12)
})

test('parses and evaluates a broad complex-expression smoke set', () => {
  const ctx = {
    a: 2,
    b: 3,
    c: 4,
    n: null as any,
    arr: [1, 2],
    obj: { x: 5, y: { z: 6 } },
    key: 'x',
    tag: (parts: string[], value: any) => parts[0] + String(value) + parts[1],
    fn: (x: number) => x + 1,
  }

  const expressions = [
    'a+b*c-d/e',
    'a&&b||c??a',
    '(a,b,c)',
    '(a=1,b=2,c=3,c)',
    'obj.y.z + arr[0]',
    'obj?.y?.z',
    '[a,,b,...arr, obj.x]',
    '{a, b, [key]: c, ...obj}',
    'fn(a)',
    '((x)=>x*2)(b)',
    '((x,y)=>x+y)(a,b)',
    '(n)=>n+a',
    '`x${a+b}y`',
    'tag`v:${a}`',
    '/[a-z]+/i.test("Regor")',
    'new Date(0).getTime()',
    '++a',
    'b--',
    'a += 3',
    'obj.x *= 2',
    'a > b ? a : b',
    'a < b ? (b < c ? b : c) : a',
    'a in {a:1}',
    'key in obj',
    'this.obj.x',
    '((p)=>({v:p}))(a).v',
    '([1,2,3])[1]',
    '({x:1, y:2}).x',
    'obj["x"] + obj["y"].z',
    'a===a && b!==c',
  ]

  for (const expr of expressions) {
    expect(() => evalExpr(expr, [ctx], { Date })).not.toThrow()
  }
})

test('rejects invalid expressions in parse/eval pipeline', () => {
  const ctx = { a: 1, b: 2 }
  const invalid = [
    '@',
    'a +',
    'a ? b',
    'a ? : b',
    'f(,)',
    'f(a,,b)',
    'a[',
    'a.',
    '{a:}',
    '{,}',
    '++1',
    '1++',
    'new 1',
    '/abc',
    '`abc${a`',
    'obj?.',
  ]

  for (const expr of invalid) {
    expect(() => evalExpr(expr, [ctx])).toThrow()
  }
})
