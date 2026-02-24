import { expect, test } from 'vitest'

import { jsep } from '../../src/parser/jsep/jsep'
import { ExpressionType } from '../../src/parser/jsep/jsep-types'

test('parses literals, this and optional member access', () => {
  expect((jsep('true') as any).type).toBe(ExpressionType.Literal)
  expect((jsep('this') as any).type).toBe(ExpressionType.This)

  const opt = jsep('a?.b') as any
  expect(opt.type).toBe(ExpressionType.Member)
  expect(opt.optional).toBe(true)
  expect(opt.property.name).toBe('b')

  const plainMember = jsep('a.b') as any
  expect(plainMember.type).toBe(ExpressionType.Member)
  expect(plainMember.optional).toBeUndefined()
})

test('parses arrow forms including empty args and sequence args', () => {
  const e1 = jsep('()=>1') as any
  expect(e1.type).toBe(ExpressionType.Arrow)
  expect(e1.params).toBeNull()

  const e2 = jsep('(a,b)=>a') as any
  expect(e2.type).toBe(ExpressionType.Arrow)
  expect(e2.params.length).toBe(2)
  expect(e2.params[0].name).toBe('a')
  expect(e2.params[1].name).toBe('b')
})

test('parses update operators and spread/object forms', () => {
  expect((jsep('++x') as any).type).toBe(ExpressionType.Update)
  expect((jsep('x++') as any).type).toBe(ExpressionType.Update)

  const obj = jsep('{a, [k]: v, ...rest}') as any
  expect(obj.type).toBe(ExpressionType.ObjectExp)
  expect(obj.properties.length).toBe(3)
})

test('parses regex and tagged templates', () => {
  const regex = jsep('/[a-z]\\/x/i.test(x)') as any
  expect(regex.type).toBe(ExpressionType.Call)
  expect(regex.callee.type).toBe(ExpressionType.Member)
  expect(regex.callee.object.type).toBe(ExpressionType.Literal)
  expect(regex.callee.object.value).toBeInstanceOf(RegExp)

  const tagged = jsep('tag`a\\nb${x}`') as any
  expect(tagged.type).toBe(ExpressionType.TaggedTemplateExpression)
  expect(tagged.quasi.quasis.length).toBe(2)

  const tpl = jsep('`\\r\\t\\b\\f\\v\\z`') as any
  expect(tpl.type).toBe(ExpressionType.TemplateLiteral)
  expect(tpl.quasis[0].value.cooked).toBe('\r\t\b\f\x0Bz')

  const invalidFlagTail = jsep('/a/_') as any
  expect(invalidFlagTail.type).toBe(ExpressionType.Compound)
  expect(invalidFlagTail.body.length).toBe(2)
})

test('parses numeric/string edge escapes', () => {
  expect((jsep('1.23') as any).type).toBe(ExpressionType.Literal)
  expect((jsep('1e+2') as any).type).toBe(ExpressionType.Literal)
  expect((jsep('1e2') as any).type).toBe(ExpressionType.Literal)
  expect((jsep('1E-2') as any).type).toBe(ExpressionType.Literal)
  expect((jsep('"\\n\\r\\t\\b\\f\\v\\x"') as any).value).toBe('\n\r\t\b\f\x0Bx')
})

test('throws for malformed expressions and argument lists', () => {
  const bad = [
    '@',
    '1 +',
    '!',
    'a[1',
    'a.',
    '.',
    'a+b*',
    '1e+',
    '1abc',
    '1..2',
    "'abc",
    '"abc\\',
    'f(a,)',
    'f(,)',
    'f(a,b c)',
    'f(a; b)',
    'f(a',
    '() =>',
    '(',
    '{,}',
    '{a:}',
    '{a:1',
    '++1',
    '1++',
    '(a,b)++',
    'a ? : b',
    'a ? b :',
    'a ? b',
    '()=>',
    '`abc',
    '`abc\\',
    '`a${b`',
    '`a${1',
    '`a${`',
    'new 1',
    '/abc',
    '/[/',
    '/a/gg',
    '/a/:',
  ]
  const nonThrowing = bad.filter((expr) => {
    try {
      jsep(expr)
      return true
    } catch {
      return false
    }
  })
  expect(nonThrowing).toStrictEqual([])
})

test('covers array holes and object key fallback branches', () => {
  const emptyGroup = jsep('()') as any
  expect(emptyGroup.type).toBe(ExpressionType.Compound)
  expect(emptyGroup.body.length).toBe(0)

  const member = jsep('a[1]') as any
  expect(member.type).toBe(ExpressionType.Member)
  expect(member.computed).toBe(true)

  const arr = jsep('[1,,2]') as any
  expect(arr.type).toBe(ExpressionType.ArrayExp)
  expect(arr.elements.length).toBe(3)
  expect(arr.elements[1]).toBeNull()

  const dense = jsep('[1,2]') as any
  expect(dense.type).toBe(ExpressionType.ArrayExp)
  expect(dense.elements.length).toBe(2)

  const obj = jsep('{[k] v}') as any
  expect(obj.type).toBe(ExpressionType.ObjectExp)
  expect(obj.properties.length).toBeGreaterThan(0)
})

test('parses grouped expressions, sequence groups and binary reductions', () => {
  const groupedSingle = jsep('(a)') as any
  expect(groupedSingle.type).toBe(ExpressionType.Identifier)
  expect(groupedSingle.name).toBe('a')

  const groupedSequence = jsep('(a,b,c)') as any
  expect(groupedSequence.type).toBe(ExpressionType.Sequence)
  expect(groupedSequence.expressions.length).toBe(3)

  const reduced = jsep('a+b*c-d/e') as any
  expect(reduced.type).toBe(ExpressionType.Binary)
  expect(reduced.operator).toBe('-')
  expect(reduced.left.operator).toBe('+')
  expect(reduced.right.operator).toBe('/')

  const relation = jsep('x in y') as any
  expect(relation.type).toBe(ExpressionType.Binary)
  expect(relation.operator).toBe('in')

  const inIdentifier = jsep('a inx') as any
  expect(inIdentifier.type).toBe(ExpressionType.Compound)
  expect(inIdentifier.body[0].name).toBe('a')
  expect(inIdentifier.body[1].name).toBe('inx')

  const rightAssoc = jsep('a=b=c') as any
  expect(rightAssoc.type).toBe(ExpressionType.Assignment)
  expect(rightAssoc.right.type).toBe(ExpressionType.Assignment)

  const unicode = jsep('é') as any
  expect(unicode.type).toBe(ExpressionType.Identifier)
  expect(unicode.name).toBe('é')
})

test('parses ternary, assignment recursion and new-expression chains', () => {
  const conditional = jsep('ok ? left : right') as any
  expect(conditional.type).toBe(ExpressionType.Conditional)
  expect(conditional.test.type).toBe(ExpressionType.Identifier)

  const reassociated = jsep('a = b ? c : d') as any
  expect(reassociated.type).toBe(ExpressionType.Conditional)
  expect(reassociated.test.type).toBe(ExpressionType.Assignment)
  expect(reassociated.test.right.name).toBe('b')

  const nestedAssign = jsep('a = (b = c)') as any
  expect(nestedAssign.type).toBe(ExpressionType.Assignment)
  expect(nestedAssign.right.type).toBe(ExpressionType.Assignment)

  const withNew = jsep('new foo.bar().baz') as any
  expect(withNew.type).toBe(ExpressionType.Member)
  expect(withNew.object.type).toBe(ExpressionType.Call)
  expect(withNew.object.callee.type).toBe(ExpressionType.Member)
  expect(withNew.object.callee.object.type).toBe(ExpressionType.NewExpression)

  const callRootNew = jsep('new foo.bar()') as any
  expect(callRootNew.type).toBe(ExpressionType.Call)
  expect(callRootNew.callee.type).toBe(ExpressionType.Member)
  expect(callRootNew.callee.object.type).toBe(ExpressionType.NewExpression)

  const directNew = jsep('new foo()') as any
  expect(directNew.type).toBe(ExpressionType.NewExpression)
})

test('throws for prefix update on invalid targets', () => {
  expect(() => jsep('++x()')).toThrow(/Unexpected \+\+/)
  expect(() => jsep('--x--')).toThrow(/Unexpected --/)
  expect((jsep('x--') as any).operator).toBe('--')
  expect((jsep('a=>a') as any).params[0].name).toBe('a')
})
