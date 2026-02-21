import { expect, test } from 'vitest'

import { preprocess } from '../../src/app/preprocess-template'

test('returns original template when tbody does not exist', () => {
  const template = '<div><Foo /></div>'
  expect(preprocess(template)).toBe(template)
})

test('rewrites tr/td outside tbody into alias hosts', () => {
  const template = '<tr><td>A</td><td>B</td></tr>'
  expect(preprocess(template)).toBe(
    '<trx is="r-tr"><tdx is="r-td">A</tdx><tdx is="r-td">B</tdx></trx>',
  )
})

test('rewrites th outside tbody into alias host', () => {
  const template = '<tr><th>A</th></tr>'
  expect(preprocess(template)).toBe(
    '<trx is="r-tr"><thx is="r-th">A</thx></trx>',
  )
})

test('replaces direct tbody child non-tr self-closing tag', () => {
  const template = '<table><tbody>  <TableRow a="1" /> </tbody></table>'
  expect(preprocess(template)).toBe(
    '<table><tbody>  <tr is="regor:TableRow" a="1" /> </tbody></table>',
  )
})

test('replaces direct tbody child non-tr tag and its closing tag', () => {
  const template =
    '<table><tbody>\n<MyRow :x="x"><td>A</td></MyRow>\n</tbody></table>'
  expect(preprocess(template)).toBe(
    '<table><tbody>\n<tr is="regor:MyRow" :x="x"><td>A</td></tr>\n</tbody></table>',
  )
})

test('rewrites direct tr children to td and keeps nested structure', () => {
  const template =
    '<table><tbody><tr><Cell /></tr><Custom><tr><Widget>X</Widget></tr></Custom></tbody></table>'
  expect(preprocess(template)).toBe(
    '<table><tbody><tr><td is="regor:Cell" /></tr><tr is="regor:Custom"><td is="regor:tr"><Widget>X</Widget></td></tr></tbody></table>',
  )
})

test('keeps valid td and th direct tr children unchanged', () => {
  const template = '<table><tbody><tr><td>A</td><th>B</th></tr></tbody></table>'
  expect(preprocess(template)).toBe(template)
})

test('replaces non-td direct tr child opening and closing tags', () => {
  const template =
    '<table><tbody><tr><MyCell k="1">A</MyCell></tr></tbody></table>'
  expect(preprocess(template)).toBe(
    '<table><tbody><tr><td is="regor:MyCell" k="1">A</td></tr></tbody></table>',
  )
})

test('should normalize self-closing custom components in aliased tr', () => {
  const template = '<tr><TableCell /></tr>'
  expect(preprocess(template)).toBe(
    '<trx is="r-tr"><TableCell ></TableCell></trx>',
  )
})

test('should normalize self-closing kebab-case components in aliased tr', () => {
  const template = '<tr><table-cell /></tr>'
  expect(preprocess(template)).toBe(
    '<trx is="r-tr"><table-cell ></table-cell></trx>',
  )
})
