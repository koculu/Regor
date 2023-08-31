import { expect, test } from 'vitest'
import { Ref, isRef, ref, trigger, unref, watchEffect } from '../../src'

test('should hold a value', () => {
  const a = ref(1)
  expect(a()).toBe(1)
  expect(a.value).toBe(1)
  a.value = 2
  expect(a()).toBe(2)
  expect(a.value).toBe(2)
  a(3)
  expect(a()).toBe(3)
  expect(a.value).toBe(3)
})

test('should be reactive', () => {
  const a = ref(1)
  let dummy
  let calls = 0
  watchEffect(() => {
    calls++
    dummy = a.value
  })
  expect(calls).toBe(1)
  expect(dummy).toBe(1)
  a.value = 2
  expect(calls).toBe(2)
  expect(dummy).toBe(2)
  // same value should not trigger
  a.value = 2
  expect(calls).toBe(2)
})

test('should make nested properties reactive', () => {
  const a = ref({
    count: 1,
  })
  let dummy = 0
  watchEffect(() => {
    dummy = a().count()
  })
  expect(a().count()).toBe(1)
  expect(dummy).toBe(1)
  a().count.value = 2
  expect(dummy).toBe(2)
})

test('should work without initial value', () => {
  const a = ref()
  let dummy
  watchEffect(() => {
    dummy = a.value
  })
  expect(a.value).toBe(undefined)
  expect(dummy).toBe(undefined)
  a.value = 2
  expect(dummy).toBe(2)
})

test('should unwrap nested ref in types', () => {
  const a = ref(3)
  const b = ref(a)

  expect(typeof (b.value + 1)).toBe('number')
  expect(a.value).toBe(b.value)
})

test('should unwrap nested values in types', () => {
  const a = {
    b: ref(3),
  }

  const c = ref(a)

  expect(typeof (c().b() + 1)).toBe('number')
  expect(c().b()).toBe(3)
})

test('should unwrap ref types nested inside arrays', () => {
  const arr = ref([1, ref(3)]).value
  expect(isRef(arr[0])).toBe(true)
  expect(isRef(arr[1])).toBe(true)
  expect(arr[1].value).toBe(3)
})

test('should return ref types as props of arrays', () => {
  const arr = [ref(0)]
  const symbolKey = Symbol('')
  arr['' as any] = ref(1)
  arr[symbolKey as any] = ref(2)
  const arrRef = ref(arr).value
  expect(isRef(arrRef[0])).toBe(true)
  expect(isRef(arrRef['' as any])).toBe(true)
  expect(isRef(arrRef[symbolKey as any])).toBe(true)
  expect(arrRef['' as any].value).toBe(1)
  expect(arrRef[symbolKey as any].value).toBe(2)
})

test('should convert tuple types into array', () => {
  const tuple: [number, string, { a: number }, () => number, Ref<number>] = [
    0,
    '1',
    { a: 1 },
    () => 33,
    ref(0),
  ]
  const tupleRef =
    ref<[number, string, { a: number }, () => number, Ref<number>]>(tuple)

  ;(tupleRef.value[0].value as number)++
  expect(tupleRef.value[0].value).toBe(1)
  ;(tupleRef.value[1].value as string) += '1'
  expect(tupleRef.value[1].value).toBe('11')
  ;(tupleRef.value[2].value as any).a.value++
  expect((tupleRef.value[2]() as any).a.value).toBe(2)
  expect((tupleRef.value[3]() as any)()).toBe(33)
  ;(tupleRef.value[4].value as number)++
  expect(tupleRef.value[4].value).toBe(1)
})

test('should keep symbols keys', () => {
  const customSymbol = Symbol()
  const obj = {
    [Symbol.asyncIterator]: ref(1),
    [Symbol.hasInstance]: { a: ref('a') },
    [Symbol.isConcatSpreadable]: { b: ref(true) },
    [Symbol.iterator]: [ref(1)],
    [Symbol.match]: new Set<Ref<number>>(),
    [Symbol.matchAll]: new Map<number, Ref<string>>(),
    [Symbol.replace]: { arr: [ref('a')] },
    [Symbol.search]: { set: new Set<Ref<number>>() },
    [Symbol.species]: { map: new Map<number, Ref<string>>() },
    [Symbol.split]: new WeakSet<Ref<boolean>>(),
    [Symbol.toPrimitive]: new WeakMap<Ref<boolean>, string>(),
    [Symbol.toStringTag]: { weakSet: new WeakSet<Ref<boolean>>() },
    [Symbol.unscopables]: { weakMap: new WeakMap<Ref<boolean>, string>() },
    [customSymbol]: { arr: [ref(1)] },
  }
  const original = { ...obj }
  const objRef = ref(obj)
  const keys: (keyof typeof obj)[] = [
    Symbol.asyncIterator,
    Symbol.hasInstance,
    Symbol.isConcatSpreadable,
    Symbol.iterator,
    Symbol.match,
    Symbol.matchAll,
    Symbol.replace,
    Symbol.search,
    Symbol.species,
    Symbol.split,
    Symbol.toPrimitive,
    Symbol.toStringTag,
    Symbol.unscopables,
    customSymbol,
  ]
  keys.forEach((key) => {
    expect(objRef.value[key]).toStrictEqual(original[key])
  })
})

test('should not wrap properties of HTMLElements', () => {
  const getHTMLElement = (inner?: string) => {
    const el = window.document.createElement('div')
    if (inner) el.innerHTML = inner
    return el
  }

  const html = ref<HTMLElement>(getHTMLElement())
  html().style.background = 'red'
  expect(html().style.background).toBe('red')

  const childNode = ref<ChildNode>(
    getHTMLElement('<span><a></span>').childNodes[0],
  )
  expect(childNode()?.childNodes.length).toBe(1)

  const node = ref<Node>(getHTMLElement('<span></span>'))
  expect(node()?.childNodes[0].nodeType).toBe(Node.ELEMENT_NODE)

  const div = ref<HTMLDivElement>(
    getHTMLElement('<div>test</div>').childNodes[0] as HTMLDivElement,
  )
  expect(div().outerHTML).toBe('<div>test</div>')
})

test('should be compatible with other refs', () => {
  type Foo = { foo: number }
  const source: Foo = { foo: 1 }
  const ref1 = ref(source)

  // ref mutates source object in place and source becomes ref content.
  expect(typeof source.foo).toBe('function')
  expect(typeof (source.foo as any).value).toBe('number')

  const ref2 = ref(ref1)
  const ref3 = ref(source)
  ref1().foo.value++
  ref2().foo.value++
  ref3().foo.value++

  expect(typeof (source.foo as any).value).toBe('number')

  expect(unref(source.foo)).toBe(4)
  expect(ref1()).toBe(source)
  expect(ref1()).toBe(ref2())
  expect(ref1()).toBe(ref3())
  expect(ref2()).toBe(source)
  expect(ref2()).toBe(ref3())

  // ref initiated with another ref should be single ref
  expect(ref1).toBe(ref2)

  // new refs can be created using the same source object
  expect(ref1).not.toBe(ref3)
})

test('should merge nested srefs into single sref.', () => {
  type Foo = { foo: number; nested: Foo | null; value: string }
  const source: Foo = { foo: 1, nested: null, value: 'test' }
  const ref1 = ref(ref(source))

  // ref mutates source object in place and source becomes ref content.
  expect(typeof source.foo).toBe('function')
  expect(typeof (source.foo as any).value).toBe('number')

  const ref2 = ref(ref(ref(ref1)))
  const ref3 = ref(source)
  ref1().foo.value++
  ref2().foo.value++
  ref3().foo.value++

  // nested optional properties are correctly typed recursively
  ref2().nested?.()?.nested?.()?.value.value

  expect(typeof (source.foo as any).value).toBe('number')

  expect(unref(source.foo)).toBe(4)
  expect(ref1()).toBe(source)
  expect(ref1()).toBe(ref2())
  expect(ref1()).toBe(ref3())
  expect(ref2()).toBe(source)
  expect(ref2()).toBe(ref3())
  expect(ref1).toBe(ref2)
  expect(ref1).not.toBe(ref3)
})

test('circular reference warning in TypeScript when using IterableIterator as a ref parameter', () => {
  // Investigate TypeScript intellisense issues related to IterableIterator<>
  // When an object extends IterableIterator, the following 3 properties are defined.
  // Due to recursive wrapping of nested properties by 'ref', these functions are also converted to refs.
  // - next(...args: [] | [TNext]): IteratorResult<T, TReturn>;
  // - return?(value?: TReturn): IteratorResult<T, TReturn>;
  // - throw?(e?: any): IteratorResult<T, TReturn>;

  // @ts-expect-error circular reference error
  const ref1 = ref<IterableIterator<number>>([1, 2, 3])

  for (const a of ref1()) {
    // @ts-expect-error: The iterator's element type does not match the underlying type
    a()
  }
})

test('should not unwrap map and set', () => {
  const a = ref(new Map<string, number>())
  let s1 = 0
  watchEffect(() => a() && ++s1)
  a().set('a', 123)
  expect(a().get('a')).toBe(123)
  expect(s1).toBe(2)

  let s2 = 0
  const b = ref(new Map<string, Ref<number>>())
  watchEffect(() => b() && ++s2)
  b().set('a', ref(123))
  expect(b().get('a')?.value).toBe(123)
  expect(s2).toBe(2)

  let s3 = 0
  const c = ref(new Set<string>())
  watchEffect(() => c() && ++s3)
  c().add('123')
  expect(c().has('123')).toBe(true)
  expect(s3).toBe(2)

  let s4 = 0
  const d = ref(new Set<Ref<string>>())
  watchEffect(() => d() && ++s4)
  const r123 = ref('123')
  d().add(r123)
  expect(d().has(r123)).toBe(true)
  expect(d().has(ref('123'))).toBe(false)
  expect(s4).toBe(2)
})

test('should not unwrap weakmap and weakset', () => {
  // WeakMap and WeakSet is not reactive.
  // They should be manually triggered using trigger()
  type Foo = { foo: number }
  const foo = { foo: 1 }

  const a = ref(new WeakMap<Foo, number>())
  let s1 = 0
  watchEffect(() => a() && ++s1)
  a().set(foo, 123)
  trigger(a)
  expect(a().get(foo)).toBe(123)
  expect(s1).toBe(2)

  let s2 = 0
  const b = ref(new WeakMap<Foo, Ref<number>>())
  watchEffect(() => b() && ++s2)
  b().set(foo, ref(123))
  trigger(b)
  expect(b().get(foo)?.value).toBe(123)
  expect(s2).toBe(2)

  let s3 = 0
  const c = ref(new WeakSet<Foo>())
  watchEffect(() => c() && ++s3)
  c().add(foo)
  trigger(c)
  expect(c().has(foo)).toBe(true)
  expect(s3).toBe(2)

  let s4 = 0
  const d = ref(new WeakSet<Ref<Foo>>())
  watchEffect(() => d() && ++s4)
  const r123 = ref(foo)
  d().add(r123)
  trigger(d)
  expect(d().has(r123)).toBe(true)
  expect(d().has(ref(foo))).toBe(false)
  expect(s4).toBe(2)
})
