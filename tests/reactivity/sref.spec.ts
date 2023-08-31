import { expect, test } from 'vitest'
import { Ref, SRef, isRef, ref, sref, unref, watchEffect } from '../../src'

test('should hold a value', () => {
  const a = sref(1)
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
  const a = sref(1)
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
  const a = {
    count: sref(1),
  }
  let dummy = 0
  watchEffect(() => {
    dummy = a.count()
  })
  expect(a.count()).toBe(1)
  expect(dummy).toBe(1)
  a.count.value = 2
  expect(dummy).toBe(2)
})

test('should work without initial value', () => {
  const a = sref()
  let dummy
  watchEffect(() => {
    dummy = a.value
  })
  expect(a.value).toBe(undefined)
  expect(dummy).toBe(undefined)
  a.value = 2
  expect(dummy).toBe(2)
})

test('should not unwrap nested sref in types', () => {
  const a = sref(3)
  const b = sref(a)

  expect(typeof (b.value + 1)).toBe('number')
  expect(a.value).toBe(b.value)
})

test('should keep nested values in types', () => {
  const a = {
    b: sref(3),
    c: 123,
    d: ref(444),
  }

  const c = sref(a)

  expect(typeof (c().b() + 1)).toBe('number')
  expect(c().b()).toBe(3)
  expect(c().c).toBe(123)
  expect(c().d()).toBe(444)
})

test('should keep sref types nested inside arrays', () => {
  const arr = sref([1, sref(3)]).value
  expect(isRef(arr[0])).toBe(false)
  expect(isRef(arr[1])).toBe(true)
  expect((arr[1] as SRef<number>).value).toBe(3)
})

test('should return sref types as props of arrays', () => {
  const arr = [sref(0)]
  const symbolKey = Symbol('')
  arr['' as any] = sref(1)
  arr[symbolKey as any] = sref(2)
  const arrRef = sref(arr).value
  expect(isRef(arrRef[0])).toBe(true)
  expect(isRef(arrRef['' as any])).toBe(true)
  expect(isRef(arrRef[symbolKey as any])).toBe(true)
  expect(arrRef['' as any].value).toBe(1)
  expect(arrRef[symbolKey as any].value).toBe(2)
})

test('should convert tuple types into array', () => {
  const tuple: [number, string, { a: number }, () => number, SRef<number>] = [
    0,
    '1',
    { a: 1 },
    () => 33,
    sref(0),
  ]
  const tupleRef =
    sref<[number, string, { a: number }, () => number, SRef<number>]>(tuple)

  ;(tupleRef.value[0] as number)++
  expect(tupleRef.value[0]).toBe(1)
  ;(tupleRef.value[1] as string) += '1'
  expect(tupleRef.value[1]).toBe('11')
  ;(tupleRef.value[2] as any).a++
  expect((tupleRef.value[2] as any).a).toBe(2)
  expect((tupleRef.value[3] as any)()).toBe(33)
  ;(tupleRef.value[4] as SRef<number>).value++
  expect(unref(tupleRef.value[4])).toBe(1)
})

test('should keep symbols keys', () => {
  const customSymbol = Symbol()
  const obj = {
    [Symbol.asyncIterator]: sref(1),
    [Symbol.hasInstance]: { a: sref('a') },
    [Symbol.isConcatSpreadable]: { b: sref(true) },
    [Symbol.iterator]: [sref(1)],
    [Symbol.match]: new Set<Ref<number>>(),
    [Symbol.matchAll]: new Map<number, Ref<string>>(),
    [Symbol.replace]: { arr: [sref('a')] },
    [Symbol.search]: { set: new Set<Ref<number>>() },
    [Symbol.species]: { map: new Map<number, Ref<string>>() },
    [Symbol.split]: new WeakSet<Ref<boolean>>(),
    [Symbol.toPrimitive]: new WeakMap<Ref<boolean>, string>(),
    [Symbol.toStringTag]: { weakSet: new WeakSet<Ref<boolean>>() },
    [Symbol.unscopables]: { weakMap: new WeakMap<Ref<boolean>, string>() },
    [customSymbol]: { arr: [sref(1)] },
  }
  const original = { ...obj }
  const objRef = sref(obj)
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

  const html = sref<HTMLElement>(getHTMLElement())
  html().style.background = 'red'
  expect(html().style.background).toBe('red')

  const childNode = sref<ChildNode>(
    getHTMLElement('<span><a></span>').childNodes[0],
  )
  expect(childNode()?.childNodes.length).toBe(1)

  const node = sref<Node>(getHTMLElement('<span></span>'))
  expect(node()?.childNodes[0].nodeType).toBe(Node.ELEMENT_NODE)

  const div = sref<HTMLDivElement>(
    getHTMLElement('<div>test</div>').childNodes[0] as HTMLDivElement,
  )
  expect(div().outerHTML).toBe('<div>test</div>')
})

test('should be compatible with other refs', () => {
  type Foo = { foo: number }
  const source: Foo = { foo: 1 }
  const ref1 = sref(source)

  // sref does not mutate source object in place and source stays as is.
  expect(typeof source.foo).toBe('number')

  const ref2 = sref(ref1)
  const ref3 = sref(source)
  ref1().foo++
  ref2().foo++
  ref3().foo++

  expect(typeof source.foo).toBe('number')

  expect(unref(source.foo)).toBe(4)
  expect(ref1()).toBe(source)
  expect(ref1()).toBe(ref2())
  expect(ref1()).toBe(ref3())
  expect(ref2()).toBe(source)
  expect(ref2()).toBe(ref3())

  // sref initiated with another sref should be single sref
  expect(ref1).toBe(ref2)

  // new srefs can be created using the same source object
  expect(ref1).not.toBe(ref3)
})

test('should merge nested srefs into single sref.', () => {
  type Foo = { foo: number; nested: Foo | null; value: string }
  const source: Foo = { foo: 1, nested: null, value: 'test' }
  const ref1 = sref(sref(source))

  // sref does not mutate source object in place and source stays as is.
  expect(typeof source.foo).toBe('number')

  const ref2 = sref(sref(sref(ref1)))
  const ref3 = sref(source)
  ref1().foo++
  ref2().foo++
  ref3().foo++

  // nested optional properties are correctly typed recursively
  ref2().nested?.nested?.value

  expect(typeof source.foo).toBe('number')

  expect(unref(source.foo)).toBe(4)
  expect(ref1()).toBe(source)
  expect(ref1()).toBe(ref2())
  expect(ref1()).toBe(ref3())
  expect(ref2()).toBe(source)
  expect(ref2()).toBe(ref3())
  expect(ref1).toBe(ref2)
  expect(ref1).not.toBe(ref3)
})
