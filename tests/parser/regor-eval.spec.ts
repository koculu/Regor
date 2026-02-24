import { expect, test } from 'vitest'

import { ref } from '../../src'
import { jsep } from '../../src/parser/jsep/jsep'
import { ExpressionType } from '../../src/parser/jsep/jsep-types'
import { regorEval } from '../../src/parser/regorEval'

const evalValue = (
  expr: string,
  contexts: Record<string, any>[],
  globalContext?: Record<string, any>,
  isLazy?: (i: number, d: number) => boolean,
  isLazyKey?: (key: string, d: number) => boolean,
  context?: Record<string, any>,
  collectRefObj?: boolean,
) =>
  regorEval(
    jsep(expr),
    contexts,
    globalContext,
    isLazy,
    isLazyKey,
    context,
    collectRefObj,
  )

test('handles identifier roots and context precedence helpers', () => {
  const root = { name: 'root' }
  const parent = { name: 'parent' }
  const child = { name: 'child', x: 1 }

  expect(evalValue('$root', [child, parent, root]).value).toBe(root)
  expect(evalValue('$parent', [child, parent, root]).value).toBe(parent)
  expect(evalValue('$ctx', [child, parent, root]).value.length).toBe(3)
})

test('reads identifiers from context and global context and preserves this binding for methods', () => {
  const ctx = {
    x: 2,
    obj: {
      base: 3,
      plus(this: any, n: number) {
        return this.base + n
      },
    },
  }
  const g = { z: 7 }
  expect(evalValue('x + z', [ctx], g).value).toBe(9)
  expect(evalValue('obj.plus(4)', [ctx]).value).toBe(7)
})

test('supports unary, binary, conditional and sequence forms', () => {
  const ctx = { a: 2, b: 3, n: null as any }
  expect(evalValue('-(a)', [ctx]).value).toBe(-2)
  expect(evalValue('a * b + 1', [ctx]).value).toBe(7)
  expect(evalValue('a > b ? a : b', [ctx]).value).toBe(3)
  expect(evalValue('(a = 5, b = 8, b)', [ctx]).value).toBe(8)
  expect(evalValue('n ?? 10', [ctx]).value).toBe(10)
  expect(evalValue('0 || 5', [ctx]).value).toBe(5)
  expect(evalValue('1 && 7', [ctx]).value).toBe(7)
  ctx.a = 9
  ctx.b = 3
  expect(evalValue('a > b ? a : b', [ctx]).value).toBe(9)
})

test('supports remaining unary operators', () => {
  const ctx = { a: '2', f: 0, bits: 2 }
  expect(evalValue('+a', [ctx]).value).toBe(2)
  expect(evalValue('!f', [ctx]).value).toBe(true)
  expect(evalValue('~bits', [ctx]).value).toBe(-3)
})

test('supports update and assignment for identifiers and members', () => {
  const ctx = { x: 1, obj: { y: 5 } }

  expect(evalValue('++x', [ctx]).value).toBe(2)
  expect(evalValue('x++', [ctx]).value).toBe(2)
  expect(ctx.x).toBe(3)

  expect(evalValue('obj.y += 4', [ctx]).value).toBe(9)
  expect(evalValue('obj.y--', [ctx]).value).toBe(9)
  expect(ctx.obj.y).toBe(8)
  expect(evalValue('--x', [ctx]).value).toBe(2)
  expect(evalValue('obj["y"]++', [ctx]).value).toBe(8)
  expect(evalValue('obj["y"] += 2', [ctx]).value).toBe(11)
})

test('supports prefix and postfix updates against refs', () => {
  const ctx = {
    x: ref(1),
    obj: { y: ref(5) },
  }

  expect(evalValue('++x', [ctx]).value).toBe(2)
  expect(ctx.x()).toBe(2)

  expect(evalValue('--x', [ctx]).value).toBe(1)
  expect(ctx.x()).toBe(1)

  expect(evalValue('x++', [ctx]).value).toBe(1)
  expect(ctx.x()).toBe(2)

  expect(evalValue('x--', [ctx]).value).toBe(2)
  expect(ctx.x()).toBe(1)

  expect(evalValue('++obj.y', [ctx]).value).toBe(6)
  expect(ctx.obj.y()).toBe(6)

  expect(evalValue('--obj.y', [ctx]).value).toBe(5)
  expect(ctx.obj.y()).toBe(5)

  expect(evalValue('obj.y++', [ctx]).value).toBe(5)
  expect(ctx.obj.y()).toBe(6)

  expect(evalValue('obj.y--', [ctx]).value).toBe(6)
  expect(ctx.obj.y()).toBe(5)
})

test('supports assignment operators against refs', () => {
  const keys = [
    '+=',
    '-=',
    '*=',
    '/=',
    '%=',
    '**=',
    '<<=',
    '>>=',
    '>>>=',
    '|=',
    '&=',
    '^=',
  ]
  const expected = [7, 1, 12, 4 / 3, 1, 64, 32, 0, 0, 7, 0, 7]

  keys.forEach((op, i) => {
    const c = { v: ref(4) }
    const r = evalValue(`v ${op} 3`, [c]).value
    expect(r).toBe(expected[i])
  })

  const c2 = { v: ref(1) }
  expect(evalValue('v = 6', [c2]).value).toBe(6)
  expect(c2.v()).toBe(6)
})

test('supports assignment operators against plain values', () => {
  const keys = [
    '+=',
    '-=',
    '*=',
    '/=',
    '%=',
    '**=',
    '<<=',
    '>>=',
    '>>>=',
    '|=',
    '&=',
    '^=',
  ]
  const expected = [7, 1, 12, 4 / 3, 1, 64, 32, 0, 0, 7, 0, 7]

  keys.forEach((op, i) => {
    const c = { v: 4 }
    const r = evalValue(`v ${op} 3`, [c]).value
    expect(r).toBe(expected[i])
    expect(c.v).toBe(expected[i])
  })
})

test('returns undefined for update/assignment on unknown identifiers', () => {
  const ctx = { x: 1 }
  expect(evalValue('missing++', [ctx]).value).toBeUndefined()
  expect(evalValue('missing = 2', [ctx]).value).toBeUndefined()
})

test('supports arrays, spreads, objects, computed keys and shorthand', () => {
  const ctx = { arr: [2, 3], key: 'k', v: 9, a: 1 }
  expect(evalValue('[1, ...arr, 4]', [ctx]).value).toStrictEqual([1, 2, 3, 4])
  expect(evalValue('{ [key]: v, a }', [ctx]).value).toStrictEqual({
    k: 9,
    a: 1,
  })
  expect(evalValue('{ "x": v }', [ctx]).value).toStrictEqual({ x: 9 })
  expect(evalValue('[...v]', [ctx]).value).toStrictEqual([9])
})

test('supports call/new/template and tagged template', () => {
  const ctx = {
    sum: (...n: number[]) => n.reduce((p, c) => p + c, 0),
    xs: [2, 3],
    tag: (parts: string[], v: string) => parts[0] + v + parts[1],
    who: 'Regor',
  }

  expect(evalValue('sum(1, ...xs)', [ctx]).value).toBe(6)
  expect(evalValue('new Date(0).getUTCFullYear()', [ctx], { Date }).value).toBe(
    1970,
  )
  expect(evalValue('`Hi ${who}`', [ctx]).value).toBe('Hi Regor')
  expect(evalValue('tag`Hi ${who}`', [ctx]).value).toBe('Hi Regor')
})

test('supports arrow expressions and context override precedence', () => {
  const ctx = { x: 1 }
  const override = { x: 8 }
  const fn = evalValue(
    '(n) => n + x',
    [ctx],
    undefined,
    undefined,
    undefined,
    override,
  ).value
  expect(fn(2)).toBe(10)

  evalValue('x = 3', [ctx], undefined, undefined, undefined, override)
  expect(override.x).toBe(3)
  expect(ctx.x).toBe(1)
})

test('supports this expression and non-array context input', () => {
  const ctx = { x: 2 }
  expect(evalValue('this.x', [ctx]).value).toBe(2)
  expect(regorEval(jsep('x'), ctx as any).value).toBe(2)
})

test('exposes ref in eval result for identifier/member/call results', () => {
  const r = ref(4)
  const ctx = { r, box: { r }, get: () => r }

  const e1 = evalValue('r', [ctx])
  expect(e1.value).toBe(4)
  expect(e1.ref).toBe(r)

  const e2 = evalValue('box.r', [ctx])
  expect(e2.value).toBe(4)
  expect(e2.ref).toBe(r)

  const e3 = evalValue('get()', [ctx])
  expect(e3.value).toBe(4)
  expect(e3.ref).toBe(r)
})

test('collectRefObj keeps refs in object properties and supports lazy key modes', () => {
  const ctx = { a: ref(1), k: 'x', b: ref(2) }

  const c1 = evalValue(
    '{a}',
    [ctx],
    undefined,
    undefined,
    undefined,
    undefined,
    true,
  ).value
  expect(typeof c1.a).toBe('function')
  expect(c1.a()).toBe(1)

  const c2 = evalValue(
    '{ [k]: b }',
    [ctx],
    undefined,
    undefined,
    (key) => key === 'x',
  ).value
  expect(typeof c2.x).toBe('function')
  expect(c2.x()).toBe(2)

  const c3 = evalValue(
    '{ fixed: b }',
    [ctx],
    undefined,
    undefined,
    (key) => key === 'fixed',
  ).value
  expect(typeof c3.fixed).toBe('function')
  expect(c3.fixed()()).toBe(2)

  const c4 = evalValue(
    '{ a }',
    [ctx],
    undefined,
    undefined,
    (key) => key === 'a',
  ).value
  expect(typeof c4.a).toBe('function')
  expect(c4.a()).toBe(1)

  const c5 = evalValue(
    '{ x: (n)=>n }',
    [ctx],
    undefined,
    undefined,
    (key) => key === 'x',
  ).value
  expect(typeof c5.x).toBe('function')
  expect(c5.x(4)).toBe(4)
})

test('supports lazy transform branch and event-driven lazy context', () => {
  const ctx = { val: 2 }
  const out = evalValue(
    '[val, $event.type]',
    [ctx],
    undefined,
    () => true,
  ).value
  expect(typeof out[0]).toBe('function')
  expect(typeof out[1]).toBe('function')

  const e = { type: 'click' } as unknown as Event
  expect(out[0](e)).toBe(2)
  expect(out[1](e)).toBe('click')
})

test('handles missing global lookup and arrow with no params', () => {
  expect(evalValue('missingName', [{}]).value).toBeUndefined()
  const fn = evalValue('()=> 7', [{}]).value
  expect(fn()).toBe(7)
})

test('handles non-function callee fallback and lazy arrow branch behavior', () => {
  const ctx = { x: 5 }
  expect(evalValue('x(1)', [ctx]).value).toBe(5)

  const lazy = evalValue('[(n)=>n+1, x]', [ctx], undefined, () => true).value
  expect(typeof lazy[0]).toBe('function')
  expect(lazy[0](2)).toBe(3)
  expect(typeof lazy[1]).toBe('function')
})

test('supports compound expressions', () => {
  const ctx = { a: 1, b: 2 }
  const v = evalValue('a; b; a + b', [ctx]).value
  expect(v).toStrictEqual([1, 2, 3])
})

test('executes fallback operator stubs for malformed ast nodes', () => {
  const base = { type: ExpressionType.Literal, value: 1, raw: '1' } as any
  const malformedBinaryOps = [
    '=>',
    '=',
    '*=',
    '**=',
    '/=',
    '%=',
    '+=',
    '-=',
    '<<=',
    '>>=',
    '>>>=',
    '&=',
    '^=',
    '|=',
    '|',
    '^',
    '&',
    '==',
    '!=',
    '===',
    '!==',
    '<',
    '>',
    '<=',
    '>=',
    'in',
    '<<',
    '>>',
    '>>>',
    '+',
    '-',
    '*',
    '/',
    '%',
    '**',
  ]
  malformedBinaryOps.forEach((op) => {
    const right =
      op === 'in'
        ? ({ type: ExpressionType.ObjectExp, properties: [] } as any)
        : base
    const expr = {
      type: ExpressionType.Binary,
      operator: op,
      left: base,
      right,
    } as any
    expect(() => regorEval(expr, [{}])).not.toThrow()
  })

  const malformedUnary = {
    type: ExpressionType.Unary,
    operator: 'new',
    argument: base,
    prefix: true,
  } as any
  expect(() => regorEval(malformedUnary, [{}])).not.toThrow()

  const malformedUpdate = {
    type: ExpressionType.Update,
    operator: '++',
    argument: { type: ExpressionType.Literal, value: 1, raw: '1' },
    prefix: true,
  } as any
  expect(regorEval(malformedUpdate, [{}]).value).toBeUndefined()

  const malformedAssignment = {
    type: ExpressionType.Assignment,
    operator: '=',
    left: { type: ExpressionType.Literal, value: 1, raw: '1' },
    right: { type: ExpressionType.Literal, value: 2, raw: '2' },
  } as any
  expect(regorEval(malformedAssignment, [{}]).value).toBeUndefined()
})
