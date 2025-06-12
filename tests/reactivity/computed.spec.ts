import { expect, expectTypeOf, test, vi } from 'vitest'
import {
  ComputedRef,
  Ref,
  computed,
  flatten,
  observe,
  ref,
  useScope,
  watchEffect,
} from '../../src'

test('should be lazy', () => {
  const ref1 = ref<{ foo?: number }>({ foo: undefined })
  const getter = vi.fn(() => ref1().foo)
  const computedFoo = computed(getter)

  // computed is lazy
  expect(getter).not.toHaveBeenCalled()

  // should compute on get
  expect(computedFoo()).toBe(undefined)
  expect(getter).toHaveBeenCalledTimes(1)

  // should not compute on source change
  ref1().foo?.(1)
  expect(getter).toHaveBeenCalledTimes(1)

  // should not compute on source not changed
  ref1().foo?.(1)
  expect(getter).toHaveBeenCalledTimes(1)

  // should compute on get
  expect(computedFoo()).toBe(1)
  expect(getter).toHaveBeenCalledTimes(2)

  // should not compute on get more than once with no change
  computedFoo()
  expect(getter).toHaveBeenCalledTimes(2)
})

test('should work when chained', () => {
  const ref1 = ref({ foo: 1 })
  const computed1 = computed(() => ref1().foo)
  expect(computed1()).toBe(1)
  ref1().foo(2)
  expect(computed1()).toBe(2)
  ref1().foo(3)
  expect(computed1()).toBe(3)
  ref1().foo(2)
  expect(computed1()).toBe(2)
  const computed2 = computed(() => computed1() + 1)
  ref1().foo(3)
  expect(computed1()).toBe(3)
  expect(computed2()).toBe(4)
  ref1().foo(2)
  expect(ref1().foo()).toBe(2)
  expect(computed2()).toBe(3)
  expect(computed1()).toBe(2)
  expect(computed1()).toBe(2)
  ref1().foo.value++
  expect(ref1().foo.value).toBe(3)
  ++ref1().foo.value
  expect(ref1().foo.value).toBe(4)
  expect(computed1()).toBe(4)
  expect(computed2()).toBe(5)
  ref1().foo(ref1().foo() + 1)
  expect(ref1().foo()).toBe(5)
  expect(computed1.value).toBe(5)
  expect(computed2.value).toBe(6)
})

test('should be readonly', () => {
  const a = ref({ a: 1 })
  const x = computed(() => a().a)
  expectTypeOf(x).toMatchTypeOf<ComputedRef<number>>()
  expect(x()).toBe(1)
  expect(() => x(5)).toThrowError('computed is readonly.')
  expect(() => x.value++).toThrowError('value is readonly.')
  expect(x()).toBe(1)
})

test('should be observable', () => {
  const a = ref({ b: [1, 2, 3] })
  let computeCount = 0
  const x = computed(() => {
    ++computeCount
    flatten(a().b)
    return a().b
  })
  observe(x, (v) => {
    flatten(v)
  })
  expectTypeOf(x).toMatchTypeOf<ComputedRef<Ref<number>[]>>()
  expect(flatten(x())).toStrictEqual([1, 2, 3])
  a().b.value[0].value++
  expect(flatten(x())).toStrictEqual([2, 2, 3])
  a().b.value[1].value++
  expect(flatten(x())).toStrictEqual([2, 3, 3])
  expect(computeCount).toBe(3)
})

test('should be stable on several computed chains', () => {
  const scope = useScope(() => {
    const ref1 = ref({ a: 1 })
    const ref2 = ref({ b: 1 })
    let calculationCount = 0
    const calculator = (i: number, pre: number) => {
      const r = (ref1().a.value + ref2().b()) / (i + 1) + (pre ?? 0)
      ++calculationCount
      return r
    }
    const len = 500
    const list = [computed(() => calculator(0, 0))]
    for (let i = 1; i < len; ++i)
      list.push(computed(() => calculator(i, list[i - 1]())))
    for (let i = 0; i < len; ++i)
      expect(list[i]()).toBe(calculator(i, list[i - 1]?.()))
    ref1().a.value++
    ref2().b.value = 3
    for (let i = 0; i < len; ++i)
      expect(list[i]()).toBe(calculator(i, list[i - 1]?.()))
    expect(calculationCount).toBe(4 * len)
    return {}
  })
  scope.unmount()
})

test('should no longer update when stopped', () => {
  const value = ref<{ foo?: number }>({ foo: undefined })
  const computed1 = computed(() => value().foo)
  let dummy
  const stopWatch = watchEffect(() => {
    dummy = computed1.value
  })
  expect(dummy).toBe(undefined)
  value().foo?.(1)
  expect(dummy).toBe(1)
  computed1.stop()
  value().foo?.(2)
  expect(dummy).toBe(1)
  stopWatch()
})

test('should invalidate before non-computed effects', () => {
  let plusOneValues: number[] = []
  const n = ref(0)
  const plusOne = computed(() => n.value + 1)
  watchEffect(() => {
    expect(plusOne.value).toBe(n.value + 1)
    plusOneValues.push(plusOne.value)
  })
  // access plusOne, causing it to be non-dirty
  plusOne.value
  // mutate n
  n.value++
  // on the 2nd run, plusOne.value should have already updated.
  expect(plusOneValues).toMatchObject([1, 2])
})

test('should be consistent in watch callback', () => {
  const count = ref(0)
  const plusOne = computed(() => count.value + 1)

  observe(
    count,
    () => {
      expect(plusOne.value).toBe(count.value + 1)
    },
    true,
  )

  expect(plusOne.value).toBe(1)
  count.value++
  expect(plusOne.value).toBe(2)
})

test('should handle self-referential objects', () => {
  type objSelf = { self?: objSelf }
  const obj: objSelf = {}
  obj.self = obj
  const r = ref(obj)
  expect(r().self!()).toBe(r())
})

test('should preserve cyclic references between objects', () => {
  const a: any = {}
  const b: any = { a }
  a.b = b
  const r = ref<any>(a)
  expect(r().b().a()).toBe(r())
})

test('should preserve cyclic references between objects', () => {
  const x = { a: { b: { c: { d: undefined as any } } } }
  x.a.b.c.d = x
  const r = ref(x)
  expect(r().a().b().c().d()).toBe(r())
})
