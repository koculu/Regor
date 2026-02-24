// Javascript expression parser is forked from Jsep,
// using the license: The MIT License (MIT)
// Copyright (c) 2013 Stephen Oney, https://ericsmekens.github.io/jsep/
// Modifications:
// - removed plugin code
// - include required plugin behavior directly in the main Jsep class
// - converted javascript to typescript
// - converted expression type from string to enum
// - reduced code size
// - optimized for parser throughput:
//   - removed dynamic hook dispatch from hot paths
//   - parse arrow/assignment nodes directly (no AST-wide fixup passes)
//   - replaced substring operator scans with char-code matching
//   - reduced per-token allocations in prefix/postfix parsing
//   - switched numeric/string/template literal scanning to index-based parsing
//     with late materialization to reduce string concatenation allocations

import type {
  ArrayExpression,
  ArrowExpression,
  AssignmentExpression,
  BinaryExpression,
  Compound,
  Expression,
  Identifier,
  Literal,
  TemplateLiteral,
  UnaryExpression,
} from './jsep-types'
import { ExpressionType } from './jsep-types'

const TAB_CODE = 9
const LF_CODE = 10
const CR_CODE = 13
const SPACE_CODE = 32
const PERIOD_CODE = 46 // '.'
const COMMA_CODE = 44 // ','
const SQUOTE_CODE = 39 // single quote
const DQUOTE_CODE = 34 // double quotes
const OPAREN_CODE = 40 // (
const CPAREN_CODE = 41 // )
const OBRACK_CODE = 91 // [
const CBRACK_CODE = 93 // ]
const QUMARK_CODE = 63 // ?
const SEMCOL_CODE = 59 // ;
const COLON_CODE = 58 // :
const OCURLY_CODE = 123 // {
const CCURLY_CODE = 125 // }
const PLUS_CODE = 43 // +
const MINUS_CODE = 45 // -
const BTICK_CODE = 96 // `
const FSLASH_CODE = 47 // '/'
const BSLASH_CODE = 92 // '\\'

const updateNodeTypes = new Set([
  ExpressionType.Identifier,
  ExpressionType.Member,
])

const assignmentOps = {
  '=': 2.5,
  '*=': 2.5,
  '**=': 2.5,
  '/=': 2.5,
  '%=': 2.5,
  '+=': 2.5,
  '-=': 2.5,
  '<<=': 2.5,
  '>>=': 2.5,
  '>>>=': 2.5,
  '&=': 2.5,
  '^=': 2.5,
  '|=': 2.5,
}

// see [Order of operations](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence)
const binaryOps = {
  '=>': 2,
  ...assignmentOps,
  '||': 3,
  '??': 3,
  '&&': 4,
  '|': 5,
  '^': 6,
  '&': 7,
  '==': 8,
  '!=': 8,
  '===': 8,
  '!==': 8,
  '<': 9,
  '>': 9,
  '<=': 9,
  '>=': 9,
  in: 9,
  '<<': 10,
  '>>': 10,
  '>>>': 10,
  '+': 11,
  '-': 11,
  '*': 12,
  '/': 12,
  '%': 12,
  '**': 13,
}
const assignmentOperatorKeys = Object.keys(assignmentOps)
const assigmentOperatorsSet = new Set(assignmentOperatorKeys)

const rightAssociative = new Set<BinaryOperator>(['=>'])
assignmentOperatorKeys.forEach((x) => rightAssociative.add(x as BinaryOperator))

const literals = {
  true: true,
  false: false,
  null: null,
}

const thisStr = 'this'

interface HookResult {
  node?: Expression | false
}

/**
 * @internal
 */
export type BinaryOperator = keyof typeof binaryOps

/**
 * @internal
 */
export type UnaryOperator = '-' | '!' | '~' | '+' | 'new'

/**
 * @internal
 */
export type AssignmentOperator = keyof typeof assignmentOps

type GobbleResult = false | Expression | undefined

const msgExpected = 'Expected '
const msgUnexpected = 'Unexpected '
const msgUnclosed = 'Unclosed '
const msgExpectedColon = msgExpected + ':'
const msgExpectedExpression = msgExpected + 'expression'
const msgMissingBracket = 'missing }'
const msgUnexpectedObjectProperty = msgUnexpected + 'object property'
const msgUnclosedParenthesis = msgUnclosed + '('
const msgExpectedComma = msgExpected + 'comma'
const msgUnexpectedToken = msgUnexpected + 'token '
const msgUnexpectedPeriod = msgUnexpected + 'period'
const msgExpectedExpressionAfter = msgExpected + 'expression after '
const msgMissingUnaryOp = 'missing unaryOp argument'
const msgUnclosedSquareBracket = msgUnclosed + '['
const msgExpectedExponent = msgExpected + 'exponent ('
const msgVariablesCannotStartWithANumber =
  'Variable names cannot start with a number ('
const msgUnclosedQuoteAfter = msgUnclosed + 'quote after "'

const isDecimalDigit = (ch: number): boolean => {
  return ch >= 48 && ch <= 57 // 0...9
}

const binaryPrecedence = (opVal: BinaryOperator): number => {
  return binaryOps[opVal]
}

class Jsep {
  __expr: string

  __index: number

  get __char(): string {
    return this.__expr.charAt(this.__index)
  }

  get __code(): number {
    return this.__expr.charCodeAt(this.__index)
  }

  __isCode(ch: number): boolean {
    return this.__expr.charCodeAt(this.__index) === ch
  }

  constructor(expr: string) {
    this.__expr = expr
    this.__index = 0
  }

  __isIdentifierStart(ch: number): boolean {
    return (
      (ch >= 65 && ch <= 90) || // A...Z
      (ch >= 97 && ch <= 122) || // a...z
      ch === 36 || // $
      ch === 95 || // _
      ch >= 128
    )
  }

  __isIdentifierPart(ch: number): boolean {
    return this.__isIdentifierStart(ch) || isDecimalDigit(ch)
  }

  __getError(message: string): Error {
    return new Error(`${message} at character ${this.__index}`)
  }

  __gobbleSpaces(): void {
    let ch = this.__code
    const expr = this.__expr
    let index = this.__index
    while (
      ch === SPACE_CODE ||
      ch === TAB_CODE ||
      ch === LF_CODE ||
      ch === CR_CODE
    ) {
      ch = expr.charCodeAt(++index)
    }
    this.__index = index
  }

  parse(): Expression {
    const nodes = this.__gobbleExpressions()
    if (nodes.length === 1) return nodes[0]
    return {
      type: ExpressionType.Compound,
      body: nodes,
    } satisfies Compound
  }

  __gobbleExpressions(untilICode?: number): Expression[] {
    const nodes: Expression[] = []

    while (this.__index < this.__expr.length) {
      const charCode: number = this.__code

      // Expressions can be separated by semicolons, commas, or just inferred without any
      // separators
      if (charCode === SEMCOL_CODE || charCode === COMMA_CODE) {
        this.__index++ // ignore separators
      } else {
        const node = this.__gobbleExpression()
        if (node) {
          nodes.push(node)
          // If we weren't able to find a binary expression and are out of room, then
          // the expression passed in probably has too much
        } else if (this.__index < this.__expr.length) {
          if (charCode === untilICode) {
            break
          }
          throw this.__getError(msgUnexpected + '"' + this.__char + '"')
        }
      }
    }

    return nodes
  }

  __gobbleExpression(): GobbleResult {
    const node =
      this.__gobbleEmptyArrowArgNode() ?? this.__gobbleBinaryExpression()
    this.__gobbleSpaces()
    return this.__gobbleTernaryNode(node)
  }

  /**
   * Search for the operation portion of the string (e.g. `+`, `===`)
   * Start by taking the longest possible binary operations (3 characters: `===`, `!==`, `>>>`)
   * and move down from 3 to 2 to 1 character until a matching binary operation is found
   * then, return that binary operation
   */
  __gobbleBinaryOp(): false | BinaryOperator {
    this.__gobbleSpaces()
    const expr = this.__expr
    const index = this.__index
    const c1 = expr.charCodeAt(index)
    const c2 = expr.charCodeAt(index + 1)
    const c3 = expr.charCodeAt(index + 2)
    const c4 = expr.charCodeAt(index + 3)

    if (isNaN(c1)) return false

    let op: BinaryOperator | false = false
    let opLen = 0

    if (c1 === 62 && c2 === 62 && c3 === 62 && c4 === 61) {
      op = '>>>='
      opLen = 4
    } else if (c1 === 61 && c2 === 61 && c3 === 61) {
      op = '==='
      opLen = 3
    } else if (c1 === 33 && c2 === 61 && c3 === 61) {
      op = '!=='
      opLen = 3
    } else if (c1 === 62 && c2 === 62 && c3 === 62) {
      op = '>>>'
      opLen = 3
    } else if (c1 === 60 && c2 === 60 && c3 === 61) {
      op = '<<='
      opLen = 3
    } else if (c1 === 62 && c2 === 62 && c3 === 61) {
      op = '>>='
      opLen = 3
    } else if (c1 === 42 && c2 === 42 && c3 === 61) {
      op = '**='
      opLen = 3
    } else if (c1 === 61 && c2 === 62) {
      op = '=>'
      opLen = 2
    } else if (c1 === 124 && c2 === 124) {
      op = '||'
      opLen = 2
    } else if (c1 === 63 && c2 === 63) {
      op = '??'
      opLen = 2
    } else if (c1 === 38 && c2 === 38) {
      op = '&&'
      opLen = 2
    } else if (c1 === 61 && c2 === 61) {
      op = '=='
      opLen = 2
    } else if (c1 === 33 && c2 === 61) {
      op = '!='
      opLen = 2
    } else if (c1 === 60 && c2 === 61) {
      op = '<='
      opLen = 2
    } else if (c1 === 62 && c2 === 61) {
      op = '>='
      opLen = 2
    } else if (c1 === 60 && c2 === 60) {
      op = '<<'
      opLen = 2
    } else if (c1 === 62 && c2 === 62) {
      op = '>>'
      opLen = 2
    } else if (c1 === 43 && c2 === 61) {
      op = '+='
      opLen = 2
    } else if (c1 === 45 && c2 === 61) {
      op = '-='
      opLen = 2
    } else if (c1 === 42 && c2 === 61) {
      op = '*='
      opLen = 2
    } else if (c1 === 47 && c2 === 61) {
      op = '/='
      opLen = 2
    } else if (c1 === 37 && c2 === 61) {
      op = '%='
      opLen = 2
    } else if (c1 === 38 && c2 === 61) {
      op = '&='
      opLen = 2
    } else if (c1 === 94 && c2 === 61) {
      op = '^='
      opLen = 2
    } else if (c1 === 124 && c2 === 61) {
      op = '|='
      opLen = 2
    } else if (c1 === 42 && c2 === 42) {
      op = '**'
      opLen = 2
    } else if (c1 === 105 && c2 === 110) {
      if (!this.__isIdentifierPart(expr.charCodeAt(index + 2))) {
        op = 'in'
        opLen = 2
      }
    } else if (c1 === 61) {
      op = '='
      opLen = 1
    } else if (c1 === 124) {
      op = '|'
      opLen = 1
    } else if (c1 === 94) {
      op = '^'
      opLen = 1
    } else if (c1 === 38) {
      op = '&'
      opLen = 1
    } else if (c1 === 60) {
      op = '<'
      opLen = 1
    } else if (c1 === 62) {
      op = '>'
      opLen = 1
    } else if (c1 === 43) {
      op = '+'
      opLen = 1
    } else if (c1 === 45) {
      op = '-'
      opLen = 1
    } else if (c1 === 42) {
      op = '*'
      opLen = 1
    } else if (c1 === 47) {
      op = '/'
      opLen = 1
    } else if (c1 === 37) {
      op = '%'
      opLen = 1
    }

    if (!op) return false
    this.__index += opLen
    return op
  }

  /**
   * This function is responsible for gobbling an individual expression,
   * e.g. `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
   */
  __gobbleBinaryExpression(): GobbleResult {
    let node: GobbleResult,
      biop: BinaryOperator | false,
      prec: number,
      biopInfo: {
        value: BinaryOperator
        prec: number
        right_a: boolean
      },
      left: GobbleResult | typeof biopInfo,
      right: GobbleResult | typeof biopInfo,
      i: number,
      curBiop: false | BinaryOperator

    // First, try to get the leftmost thing
    // Then, check to see if there's a binary operator operating on that leftmost thing
    // Don't gobbleBinaryOp without a left-hand-side
    left = this.__gobbleToken()
    if (!left) {
      return left
    }
    biop = this.__gobbleBinaryOp()

    // If there wasn't a binary operator, just return the leftmost node
    if (!biop) {
      return left
    }

    // Otherwise, we need to start a stack to properly place the binary operations in their
    // precedence structure
    biopInfo = {
      value: biop,
      prec: binaryPrecedence(biop),
      right_a: rightAssociative.has(biop),
    }

    right = this.__gobbleToken()

    if (!right) {
      throw this.__getError(msgExpectedExpressionAfter + biop)
    }

    const stack = [left, biopInfo, right]

    // Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
    while ((biop = this.__gobbleBinaryOp())) {
      prec = binaryPrecedence(biop)

      biopInfo = {
        value: biop,
        prec,
        right_a: rightAssociative.has(biop),
      }

      curBiop = biop

      // Reduce: make a binary expression from the three topmost entries.
      const comparePrev = (prev: typeof biopInfo): boolean =>
        biopInfo.right_a && prev.right_a ? prec > prev.prec : prec <= prev.prec

      while (
        stack.length > 2 &&
        comparePrev(stack[stack.length - 2] as typeof biopInfo)
      ) {
        right = stack.pop()
        biop = (stack.pop() as typeof biopInfo).value
        left = stack.pop()
        node = this.__createBinaryNode(
          biop as BinaryOperator,
          left as Expression,
          right as Expression,
        )
        stack.push(node)
      }

      node = this.__gobbleToken()

      if (!node) {
        throw this.__getError(msgExpectedExpressionAfter + curBiop)
      }

      stack.push(biopInfo, node)
    }

    i = stack.length - 1
    node = stack[i] as GobbleResult

    while (i > 1) {
      node = this.__createBinaryNode(
        (stack[i - 1] as typeof biopInfo).value as BinaryOperator,
        stack[i - 2] as Expression,
        node as Expression,
      )
      i -= 2
    }

    return node
  }

  /**
   * An individual part of a binary expression:
   * e.g. `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)` (because it's in parenthesis)
   */
  __gobbleToken(): false | Expression | undefined {
    let node: GobbleResult
    this.__gobbleSpaces()
    node = this.__gobbleTokenFromPrefix()
    if (node) return this.__postProcessToken(node)

    const ch = this.__code

    if (isDecimalDigit(ch) || ch === PERIOD_CODE) {
      // Char code 46 is a dot `.` which can start off a numeric literal
      return this.__gobbleNumericLiteral()
    }

    if (ch === SQUOTE_CODE || ch === DQUOTE_CODE) {
      // Single or double quotes
      node = this.__gobbleStringLiteral()
    } else if (ch === OBRACK_CODE) {
      node = this.__gobbleArray()
    } else {
      const unary = this.__gobbleUnaryOp()
      if (unary) {
        const argument = this.__gobbleToken()
        if (!argument) {
          throw this.__getError(msgMissingUnaryOp)
        }
        return this.__postProcessToken({
          type: ExpressionType.Unary,
          operator: unary,
          argument,
        })
      }

      if (this.__isIdentifierStart(ch)) {
        node = this.__gobbleIdentifier()
        if ((node as Identifier).name in literals) {
          node = {
            type: ExpressionType.Literal,
            value: (literals as any)[(node as Identifier).name],
            raw: node.name,
          }
        } else if (node.name === thisStr) {
          node = { type: ExpressionType.This }
        }
      } else if (ch === OPAREN_CODE) {
        // open parenthesis
        node = this.__gobbleGroup()
      }
    }

    if (!node) {
      return false
    }

    node = this.__gobbleTokenProperty(node)
    return this.__postProcessToken(node)
  }

  __createBinaryNode(
    operator: BinaryOperator,
    left: Expression,
    right: Expression,
  ): BinaryExpression | AssignmentExpression | ArrowExpression {
    if (operator === '=>') {
      const params =
        left.type === ExpressionType.Sequence
          ? (left.expressions as any)
          : [left]
      return {
        type: ExpressionType.Arrow,
        params,
        body: right,
      }
    }

    if (assigmentOperatorsSet.has(operator)) {
      return {
        type: ExpressionType.Assignment,
        operator: operator as AssignmentOperator,
        left,
        right,
      }
    }

    return {
      type: ExpressionType.Binary,
      operator,
      left,
      right,
    }
  }

  __gobbleTokenFromPrefix(): GobbleResult {
    const env: HookResult = { node: false }
    this.__gobbleObjectExpression(env)
    if (env.node) return env.node
    this.__gobbleUpdatePrefix(env)
    if (env.node) return env.node
    this.__gobbleSpread(env)
    if (env.node) return env.node
    this.__gobbleTemplateLiteral(env)
    if (env.node) return env.node
    this.__gobbleRegexLiteral(env)
    return env.node
  }

  __postProcessToken(node: Expression): Expression {
    const env: HookResult = { node }
    this.__gobbleNew(env)
    this.__gobbleUpdatePostfix(env)
    this.__gobbleTaggedTemplateIdentifier(env)
    return env.node as Expression
  }

  __gobbleUnaryOp(): UnaryOperator | false {
    const expr = this.__expr
    const index = this.__index
    const c1 = expr.charCodeAt(index)
    const c2 = expr.charCodeAt(index + 1)
    const c3 = expr.charCodeAt(index + 2)
    const c4 = expr.charCodeAt(index + 3)

    if (c1 === MINUS_CODE) {
      this.__index++
      return '-'
    }
    if (c1 === 33) {
      this.__index++
      return '!'
    }
    if (c1 === 126) {
      this.__index++
      return '~'
    }
    if (c1 === PLUS_CODE) {
      this.__index++
      return '+'
    }
    if (
      c1 === 110 &&
      c2 === 101 &&
      c3 === 119 &&
      !this.__isIdentifierPart(c4)
    ) {
      this.__index += 3
      return 'new'
    }
    return false
  }

  __gobbleEmptyArrowArgNode(): GobbleResult {
    const env: HookResult = {}
    this.__gobbleEmptyArrowArg(env)
    return env.node
  }

  __gobbleTernaryNode(node: GobbleResult): GobbleResult {
    const env: HookResult = { node }
    this.__gobbleTernary(env)
    return env.node
  }

  /**
   * Gobble properties of of identifiers/strings/arrays/groups.
   * e.g. `foo`, `bar.baz`, `foo['bar'].baz`
   * It also gobbles function calls:
   * e.g. `Math.acos(obj.angle)`
   */
  __gobbleTokenProperty(node: Expression): Expression {
    this.__gobbleSpaces()

    let ch = this.__code
    while (
      ch === PERIOD_CODE ||
      ch === OBRACK_CODE ||
      ch === OPAREN_CODE ||
      ch === QUMARK_CODE
    ) {
      let optional
      if (ch === QUMARK_CODE) {
        if (this.__expr.charCodeAt(this.__index + 1) !== PERIOD_CODE) {
          break
        }
        optional = true
        this.__index += 2
        this.__gobbleSpaces()
        ch = this.__code
      }
      this.__index++

      if (ch === OBRACK_CODE) {
        node = {
          type: ExpressionType.Member,
          computed: true,
          object: node,
          property: this.__gobbleExpression(),
        }
        this.__gobbleSpaces()
        ch = this.__code
        if (ch !== CBRACK_CODE) {
          throw this.__getError(msgUnclosedSquareBracket)
        }
        this.__index++
      } else if (ch === OPAREN_CODE) {
        // A function call is being made; gobble all the arguments
        node = {
          type: ExpressionType.Call,
          arguments: this.__gobbleArguments(CPAREN_CODE),
          callee: node,
        }
      } else {
        if (optional) {
          this.__index--
        }
        this.__gobbleSpaces()
        node = {
          type: ExpressionType.Member,
          computed: false,
          object: node,
          property: this.__gobbleIdentifier(),
        }
      }

      if (optional) {
        node.optional = true
      } // else leave undefined for compatibility with esprima

      this.__gobbleSpaces()
      ch = this.__code
    }

    return node
  }

  /**
   * Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string to
   * keep track of everything in the numeric literal and then calling `parseFloat` on that string
   */
  __gobbleNumericLiteral(): Literal {
    const expr = this.__expr
    const start = this.__index
    let index = start

    while (isDecimalDigit(expr.charCodeAt(index))) {
      index++
    }

    if (expr.charCodeAt(index) === PERIOD_CODE) {
      // can start with a decimal marker
      index++
      while (isDecimalDigit(expr.charCodeAt(index))) {
        index++
      }
    }

    const exponentCode = expr.charCodeAt(index)
    if (exponentCode === 101 || exponentCode === 69) {
      // exponent marker
      index++
      const signCode = expr.charCodeAt(index)
      if (signCode === PLUS_CODE || signCode === MINUS_CODE) {
        // exponent sign
        index++
      }
      const exponentStart = index
      while (isDecimalDigit(expr.charCodeAt(index))) {
        // exponent itself
        index++
      }
      if (exponentStart === index) {
        this.__index = index
        const number = expr.slice(start, index)
        throw this.__getError(msgExpectedExponent + number + this.__char + ')')
      }
    }

    this.__index = index
    const number = expr.slice(start, index)
    const chCode = expr.charCodeAt(index)

    // Check to make sure this isn't a variable name that start with a number (123abc)
    if (this.__isIdentifierStart(chCode)) {
      throw this.__getError(
        msgVariablesCannotStartWithANumber + number + this.__char + ')',
      )
    } else if (
      chCode === PERIOD_CODE ||
      (number.length === 1 && number.charCodeAt(0) === PERIOD_CODE)
    ) {
      throw this.__getError(msgUnexpectedPeriod)
    }

    return {
      type: ExpressionType.Literal,
      value: parseFloat(number),
      raw: number,
    }
  }

  /**
   * Parses a string literal, staring with single or double quotes with basic support for escape codes
   * e.g. `"hello world"`, `'this is\nJSEP'`
   */
  __gobbleStringLiteral(): Literal {
    const expr = this.__expr
    const length = expr.length
    const startIndex = this.__index
    const quoteCode = expr.charCodeAt(this.__index++)
    let index = this.__index
    let segmentStart = index
    const cookedParts: string[] = []
    let hadEscape = false
    let closed = false

    while (index < length) {
      const code = expr.charCodeAt(index)
      if (code === quoteCode) {
        closed = true
        this.__index = index + 1
        break
      }
      if (code === BSLASH_CODE) {
        if (!hadEscape) hadEscape = true
        cookedParts.push(expr.slice(segmentStart, index))
        const escCode = expr.charCodeAt(index + 1)
        cookedParts.push(this.__decodeEscapedChar(escCode))
        index += 2
        segmentStart = index
      } else {
        index++
      }
    }

    const str = hadEscape
      ? cookedParts.join('') + expr.slice(segmentStart, closed ? index : length)
      : expr.slice(segmentStart, closed ? index : length)

    if (!closed) {
      this.__index = index
      throw this.__getError(msgUnclosedQuoteAfter + str + '"')
    }

    return {
      type: ExpressionType.Literal,
      value: str,
      raw: expr.substring(startIndex, this.__index),
    }
  }

  __decodeEscapedChar(code: number): string {
    switch (code) {
      case 110:
        return '\n'
      case 114:
        return '\r'
      case 116:
        return '\t'
      case 98:
        return '\b'
      case 102:
        return '\f'
      case 118:
        return '\x0B'
      default:
        if (isNaN(code)) {
          return ''
        }
        return String.fromCharCode(code)
    }
  }

  /**
   * Gobbles only identifiers
   * e.g.: `foo`, `_value`, `$x1`
   * Also, this function checks if that identifier is a literal:
   * (e.g. `true`, `false`, `null`) or `this`
   */
  __gobbleIdentifier(): Identifier {
    let ch = this.__code
    const start = this.__index

    if (this.__isIdentifierStart(ch)) {
      this.__index++
    } else {
      throw this.__getError(msgUnexpected + this.__char)
    }

    while (this.__index < this.__expr.length) {
      ch = this.__code

      if (this.__isIdentifierPart(ch)) {
        this.__index++
      } else {
        break
      }
    }
    return {
      type: ExpressionType.Identifier,
      name: this.__expr.slice(start, this.__index),
    }
  }

  /**
   * Gobbles a list of arguments within the context of a function call
   * or array literal. This function also assumes that the opening character
   * `(` or `[` has already been gobbled, and gobbles expressions and commas
   * until the terminator character `)` or `]` is encountered.
   * e.g. `foo(bar, baz)`, `my_func()`, or `[bar, baz]`
   */
  __gobbleArguments(termination: number): Expression[] {
    const args: any[] = []
    let closed = false
    let separatorCount = 0

    while (this.__index < this.__expr.length) {
      this.__gobbleSpaces()
      const chI = this.__code

      if (chI === termination) {
        // done parsing
        closed = true
        this.__index++

        if (
          termination === CPAREN_CODE &&
          separatorCount &&
          separatorCount >= args.length
        ) {
          throw this.__getError(
            msgUnexpectedToken + String.fromCharCode(termination),
          )
        }

        break
      } else if (chI === COMMA_CODE) {
        // between expressions
        this.__index++
        separatorCount++

        if (separatorCount !== args.length) {
          // missing argument
          if (termination === CPAREN_CODE) {
            throw this.__getError(msgUnexpectedToken + ',')
          } else {
            for (let arg = args.length; arg < separatorCount; arg++) {
              args.push(null)
            }
          }
        }
      } else if (args.length !== separatorCount && separatorCount !== 0) {
        // NOTE: `&& separator_count !== 0` allows for either all commas, or all spaces as arguments
        throw this.__getError(msgExpectedComma)
      } else {
        const node = this.__gobbleExpression()

        if (!node || node.type === ExpressionType.Compound) {
          throw this.__getError(msgExpectedComma)
        }

        args.push(node)
      }
    }

    if (!closed) {
      throw this.__getError(msgExpected + String.fromCharCode(termination))
    }

    return args
  }

  /**
   * Responsible for parsing a group of things within parentheses `()`
   * that have no identifier in front (so not a function call)
   * This function assumes that it needs to gobble the opening parenthesis
   * and then tries to gobble everything within that parenthesis, assuming
   * that the next thing it should see is the close parenthesis. If not,
   * then the expression probably doesn't have a `)`
   */
  __gobbleGroup(): false | Expression {
    this.__index++
    const nodes = this.__gobbleExpressions(CPAREN_CODE)
    if (this.__isCode(CPAREN_CODE)) {
      this.__index++
      if (nodes.length === 1) {
        return nodes[0]
      } else if (!nodes.length) {
        return false
      } else {
        return {
          type: ExpressionType.Sequence,
          expressions: nodes,
        }
      }
    }
    throw this.__getError(msgUnclosedParenthesis)
  }

  /**
   * Responsible for parsing Array literals `[1, 2, 3]`
   * This function assumes that it needs to gobble the opening bracket
   * and then tries to gobble the expressions as arguments.
   * @returns array expression
   */
  __gobbleArray(): ArrayExpression {
    this.__index++

    return {
      type: ExpressionType.ArrayExp,
      elements: this.__gobbleArguments(CBRACK_CODE),
    }
  }

  __gobbleObjectExpression(env: HookResult): void {
    if (this.__isCode(OCURLY_CODE)) {
      this.__index++
      const properties: Expression[] = []

      while (!isNaN(this.__code)) {
        this.__gobbleSpaces()
        if (this.__isCode(CCURLY_CODE)) {
          this.__index++
          env.node = this.__gobbleTokenProperty({
            type: ExpressionType.ObjectExp,
            properties,
          })
          return
        }

        // Note: using gobbleExpression instead of gobbleToken to support object destructuring
        const key = this.__gobbleExpression()
        if (!key) {
          break // missing }
        }

        this.__gobbleSpaces()
        if (
          key.type === ExpressionType.Identifier &&
          (this.__isCode(COMMA_CODE) || this.__isCode(CCURLY_CODE))
        ) {
          // property value shorthand
          properties.push({
            type: ExpressionType.PropertyExp,
            computed: false,
            key,
            value: key,
            shorthand: true,
          })
        } else if (this.__isCode(COLON_CODE)) {
          this.__index++
          const value = this.__gobbleExpression()

          if (!value) {
            throw this.__getError(msgUnexpectedObjectProperty)
          }
          const computed = key.type === ExpressionType.ArrayExp
          properties.push({
            type: ExpressionType.PropertyExp,
            computed,
            key: computed ? ((key.elements as any)[0] as Expression) : key,
            value,
            shorthand: false,
          })
          this.__gobbleSpaces()
        } else {
          // spread, assignment (object destructuring with defaults), etc.
          properties.push(key)
        }

        if (this.__isCode(COMMA_CODE)) {
          this.__index++
        }
      }
      throw this.__getError(msgMissingBracket)
    }
  }

  __gobbleUpdatePrefix(env: HookResult): void {
    const code = this.__code
    if (
      (code === PLUS_CODE || code === MINUS_CODE) &&
      code === this.__expr.charCodeAt(this.__index + 1)
    ) {
      this.__index += 2
      const expr = (env.node = {
        type: ExpressionType.Update,
        operator: code === PLUS_CODE ? '++' : '--',
        argument: this.__gobbleTokenProperty(this.__gobbleIdentifier()),
        prefix: true,
      })
      if (!expr.argument || !updateNodeTypes.has(expr.argument.type)) {
        throw this.__getError(msgUnexpected + expr.operator)
      }
    }
  }

  __gobbleUpdatePostfix(env: HookResult): void {
    const node = env.node as Expression
    const code = this.__code
    if (
      (code === PLUS_CODE || code === MINUS_CODE) &&
      code === this.__expr.charCodeAt(this.__index + 1)
    ) {
      if (!updateNodeTypes.has(node.type)) {
        throw this.__getError(
          msgUnexpected + (code === PLUS_CODE ? '++' : '--'),
        )
      }
      this.__index += 2
      env.node = {
        type: ExpressionType.Update,
        operator: code === PLUS_CODE ? '++' : '--',
        argument: node,
        prefix: false,
      }
    }
  }

  __gobbleSpread(env: HookResult): void {
    if (
      this.__expr.charCodeAt(this.__index) === PERIOD_CODE &&
      this.__expr.charCodeAt(this.__index + 1) === PERIOD_CODE &&
      this.__expr.charCodeAt(this.__index + 2) === PERIOD_CODE
    ) {
      this.__index += 3
      env.node = {
        type: ExpressionType.Spread,
        argument: this.__gobbleExpression(),
      }
    }
  }

  __gobbleTernary(env: HookResult): void {
    if (env.node && this.__isCode(QUMARK_CODE)) {
      this.__index++
      const test = env.node
      const consequent = this.__gobbleExpression()

      if (!consequent) {
        throw this.__getError(msgExpectedExpression)
      }

      this.__gobbleSpaces()

      if (this.__isCode(COLON_CODE)) {
        this.__index++
        const alternate = this.__gobbleExpression()

        if (!alternate) {
          throw this.__getError(msgExpectedExpression)
        }
        env.node = {
          type: ExpressionType.Conditional,
          test,
          consequent,
          alternate,
        }
      } else {
        throw this.__getError(msgExpectedColon)
      }
    }
  }

  __gobbleEmptyArrowArg(env: HookResult): void {
    this.__gobbleSpaces()
    if (this.__isCode(OPAREN_CODE)) {
      const backupIndex = this.__index
      this.__index++

      this.__gobbleSpaces()
      if (this.__isCode(CPAREN_CODE)) {
        this.__index++

        const biop = this.__gobbleBinaryOp()
        if (biop === '=>') {
          const body = this.__gobbleBinaryExpression()
          if (!body) {
            throw this.__getError(msgExpectedExpressionAfter + biop)
          }
          env.node = {
            type: ExpressionType.Arrow,
            params: null,
            body,
          }
          return
        }
      }
      this.__index = backupIndex
    }
  }

  __gobbleTaggedTemplateIdentifier(env: HookResult): void {
    const node = env.node as Expression
    const type = node.type
    const condition =
      (type === ExpressionType.Identifier || type === ExpressionType.Member) &&
      this.__isCode(BTICK_CODE)
    if (!condition) return

    env.node = {
      type: ExpressionType.TaggedTemplateExpression,
      tag: node,
      quasi: this.__gobbleTemplateLiteral(env),
    }
  }

  __gobbleTemplateLiteral(env: HookResult): TemplateLiteral | undefined {
    if (!this.__isCode(BTICK_CODE)) return
    const expr = this.__expr
    const length = expr.length
    const node: TemplateLiteral = {
      type: ExpressionType.TemplateLiteral,
      quasis: [],
      expressions: [],
    }
    let segmentStart = ++this.__index
    const rawParts: string[] = []
    const cookedParts: string[] = []
    let hasEscape = false

    const pushQuasi = (tail: boolean): number => {
      if (!hasEscape) {
        const value = expr.slice(segmentStart, this.__index)
        return node.quasis.push({
          type: ExpressionType.TemplateElement,
          value: {
            raw: value,
            cooked: value,
          },
          tail,
        })
      }

      rawParts.push(expr.slice(segmentStart, this.__index))
      cookedParts.push(expr.slice(segmentStart, this.__index))
      const raw = rawParts.join('')
      const cooked = cookedParts.join('')
      rawParts.length = 0
      cookedParts.length = 0
      hasEscape = false
      return node.quasis.push({
        type: ExpressionType.TemplateElement,
        value: {
          raw,
          cooked,
        },
        tail,
      })
    }

    while (this.__index < length) {
      const code = expr.charCodeAt(this.__index)

      if (code === BTICK_CODE) {
        pushQuasi(true)
        this.__index += 1
        env.node = node
        return node
      } else if (
        code === 36 && // $
        expr.charCodeAt(this.__index + 1) === OCURLY_CODE
      ) {
        pushQuasi(false)
        this.__index += 2
        node.expressions.push(...this.__gobbleExpressions(CCURLY_CODE))
        if (!this.__isCode(CCURLY_CODE)) {
          throw this.__getError('unclosed ${')
        }
        this.__index += 1
        segmentStart = this.__index
      } else if (code === BSLASH_CODE) {
        if (!hasEscape) hasEscape = true
        rawParts.push(expr.slice(segmentStart, this.__index))
        cookedParts.push(expr.slice(segmentStart, this.__index))
        const escCode = expr.charCodeAt(this.__index + 1)
        rawParts.push(expr.slice(this.__index, this.__index + 2))
        cookedParts.push(this.__decodeEscapedChar(escCode))
        this.__index += 2
        segmentStart = this.__index
      } else {
        this.__index += 1
      }
    }
    throw this.__getError('Unclosed `')
  }

  __gobbleNew(env: HookResult): void {
    const node = env.node as UnaryExpression
    if (!node || node.operator !== 'new' || !node.argument) return
    if (
      !node.argument ||
      ![ExpressionType.Call, ExpressionType.Member].includes(node.argument.type)
    )
      throw this.__getError('Expected new function()')
    env.node = node.argument

    // Change CALL_EXP to NewExpression (could be a nested member, even within a call expr)
    let callNode = env.node as any
    while (
      callNode.type === ExpressionType.Member ||
      (callNode.type === ExpressionType.Call &&
        callNode.callee.type === ExpressionType.Member)
    ) {
      callNode =
        callNode.type === ExpressionType.Member
          ? callNode.object
          : callNode.callee.object
    }
    callNode.type = ExpressionType.NewExpression
  }

  __gobbleRegexLiteral(env: HookResult): Expression | undefined {
    if (!this.__isCode(FSLASH_CODE)) return
    const patternIndex = ++this.__index

    let inCharSet = false
    while (this.__index < this.__expr.length) {
      if (this.__code === FSLASH_CODE && !inCharSet) {
        const pattern = this.__expr.slice(patternIndex, this.__index)

        let flags = ''
        while (++this.__index < this.__expr.length) {
          const code = this.__code
          if (
            (code >= 97 && code <= 122) || // a...z
            (code >= 65 && code <= 90) || // A...Z
            (code >= 48 && code <= 57)
          ) {
            // 0-9
            flags += this.__char
          } else {
            break
          }
        }

        let value
        try {
          value = new RegExp(pattern, flags)
        } catch (e: any) {
          throw this.__getError(e.message)
        }

        env.node = {
          type: ExpressionType.Literal,
          value,
          raw: this.__expr.slice(patternIndex - 1, this.__index),
        }

        // allow . [] and () after regex: /regex/.test(a)
        env.node = this.__gobbleTokenProperty(env.node)
        return env.node
      }
      if (this.__isCode(OBRACK_CODE)) {
        inCharSet = true
      } else if (inCharSet && this.__isCode(CBRACK_CODE)) {
        inCharSet = false
      }
      this.__index += this.__isCode(BSLASH_CODE) ? 2 : 1
    }
    throw this.__getError('Unclosed Regex')
  }
}

/**
 * @internal
 */
export const jsep = (expr: string): Expression => new Jsep(expr).parse()
