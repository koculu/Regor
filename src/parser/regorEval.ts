import { type AnyRef, type IsLazy, type IsLazyKey } from '../api/types'
import { isArray, isFunction, isNullOrUndefined } from '../common/is-what'
import { collectRefs } from '../computed/watchEffect'
import { isRef } from '../reactivity/isRef'
import { unref } from '../reactivity/unref'
import {
  type ArrayExpression,
  type ArrowExpression,
  type AssignmentExpression,
  type BinaryExpression,
  type CallExpression,
  type Compound,
  type ConditionalExpression,
  type Expression,
  ExpressionType,
  type Identifier,
  type Literal,
  type MemberExpression,
  type NewExpression,
  type ObjectExpression,
  type Property,
  type SequenceExpression,
  type SpreadElement,
  type TaggedTemplateExpression,
  type TemplateElement,
  type TemplateLiteral,
  type ThisExpression,
  type UnaryExpression,
  type UpdateExpression,
} from './jsep/jsep-types'

const evalBinaryOp = {
  // arrow and assignments placed here for type safety, never executed
  '=>': (_a: any, _b: any): any => undefined,
  '=': (_a: any, _b: any): any => undefined,
  '*=': (_a: any, _b: any): any => undefined,
  '**=': (_a: any, _b: any): any => undefined,
  '/=': (_a: any, _b: any): any => undefined,
  '%=': (_a: any, _b: any): any => undefined,
  '+=': (_a: any, _b: any): any => undefined,
  '-=': (_a: any, _b: any): any => undefined,
  '<<=': (_a: any, _b: any): any => undefined,
  '>>=': (_a: any, _b: any): any => undefined,
  '>>>=': (_a: any, _b: any): any => undefined,
  '&=': (_a: any, _b: any): any => undefined,
  '^=': (_a: any, _b: any): any => undefined,
  '|=': (_a: any, _b: any): any => undefined,
  // special case: conditional operators || ?? && are evaluated lazily
  '||': (a: any, b: any) => a() || b(),
  '??': (a: any, b: any) => a() ?? b(),
  '&&': (a: any, b: any) => a() && b(),
  '|': (a: any, b: any) => a | b,
  '^': (a: any, b: any) => a ^ b,
  '&': (a: any, b: any) => a & b,
   
  '==': (a: any, b: any) => a == b,
   
  '!=': (a: any, b: any) => a != b,
  '===': (a: any, b: any) => a === b,
  '!==': (a: any, b: any) => a !== b,
  '<': (a: any, b: any) => a < b,
  '>': (a: any, b: any) => a > b,
  '<=': (a: any, b: any) => a <= b,
  '>=': (a: any, b: any) => a >= b,
  in: (a: any, b: any) => a in b,
  '<<': (a: any, b: any) => a << b,
  '>>': (a: any, b: any) => a >> b,
  '>>>': (a: any, b: any) => a >>> b,
   
  '+': (a: any, b: any) => a + b,
  '-': (a: any, b: any) => a - b,
  '*': (a: any, b: any) => a * b,
  '/': (a: any, b: any) => a / b,
  '%': (a: any, b: any) => a % b,
  '**': (a: any, b: any) => a ** b,
}

const evalUnaryOp = {
  '-': (a: any) => -a,
  '+': (a: any) => +a,
  '!': (a: any) => !a,
  '~': (a: any) => ~a,
  new: (a: any) => a, // placed here for type safety, never executed,
}

const spreadArgs = (args: any[]): any[] => {
  if (!args?.some(shouldSpreadArray)) return args
  const result: any[] = []
  args.forEach((x) =>
    shouldSpreadArray(x) ? result.push(...x) : result.push(x),
  )
  return result
}
const arrayEvaluator = (...args: any[]): any[] => spreadArgs(args)

const createLazyContext = (
  e: Event | undefined,
  context?: Context,
): Context | undefined => {
  if (!e) return context

  const ctx: Record<string, unknown> = Object.create(context ?? {})
  ctx.$event = e
  return ctx
}

const evalPrefixUpdate = {
  '++': (context: Context, key: any) => {
    const v = context[key]
    if (isRef(v)) {
      let r = v()
      v(++r)
      return r
    }
    return ++context[key]
  },
  '--': (context: Context, key: any) => {
    const v = context[key]
    if (isRef(v)) {
      let r = v()
      v(--r)
      return r
    }
    return --context[key]
  },
}

const evalPostUpdate = {
  '++': (context: Context, key: any) => {
    const v = context[key]
    if (isRef(v)) {
      const r = v()
       
      v(r + 1)
      return r
    }
    return context[key]++
  },
  '--': (context: Context, key: any) => {
    const v = context[key]
    if (isRef(v)) {
      const r = v()
      v(r - 1)
      return r
    }
    return context[key]--
  },
}
const applyAssigment = {
  '=': (context: Context, key: any, value: any) => {
    const v = context[key]
    if (isRef(v)) {
      return v(value)
    }
    return (context[key] = value)
  },
  '+=': (context: Context, key: any, value: any) => {
    const v = context[key]
    if (isRef(v)) {
       
      return v(v() + value)
    }
     
    return (context[key] += value)
  },
  '-=': (context: Context, key: any, value: any) => {
    const v = context[key]
    if (isRef(v)) {
      return v(v() - value)
    }
    return (context[key] -= value)
  },
  '*=': (context: Context, key: any, value: any) => {
    const v = context[key]
    if (isRef(v)) {
      return v(v() * value)
    }
    return (context[key] *= value)
  },
  '/=': (context: Context, key: any, value: any) => {
    const v = context[key]
    if (isRef(v)) {
      return v(v() / value)
    }
    return (context[key] /= value)
  },
  '%=': (context: Context, key: any, value: any) => {
    const v = context[key]
    if (isRef(v)) {
      return v(v() % value)
    }
    return (context[key] %= value)
  },
  '**=': (context: Context, key: any, value: any) => {
    const v = context[key]
    if (isRef(v)) {
      return v(v() ** value)
    }
    return (context[key] **= value)
  },
  '<<=': (context: Context, key: any, value: any) => {
    const v = context[key]
    if (isRef(v)) {
      return v(v() << value)
    }
    return (context[key] <<= value)
  },
  '>>=': (context: Context, key: any, value: any) => {
    const v = context[key]
    if (isRef(v)) {
      return v(v() >> value)
    }
    return (context[key] >>= value)
  },
  '>>>=': (context: Context, key: any, value: any) => {
    const v = context[key]
    if (isRef(v)) {
      return v(v() >>> value)
    }
    return (context[key] >>>= value)
  },
  '|=': (context: Context, key: any, value: any) => {
    const v = context[key]
    if (isRef(v)) {
      return v(v() | value)
    }
    return (context[key] |= value)
  },
  '&=': (context: Context, key: any, value: any) => {
    const v = context[key]
    if (isRef(v)) {
      return v(v() & value)
    }
    return (context[key] &= value)
  },
  '^=': (context: Context, key: any, value: any) => {
    const v = context[key]
    if (isRef(v)) {
      return v(v() ^ value)
    }
    return (context[key] ^= value)
  },
}

const associateThis = (value: any, thisObj: any): any =>
  isFunction(value) ? value.bind(thisObj) : value

type Context = Record<string, any>

/**
 * @internal
 */
export interface RegorEvalResult {
  /** The value result. The value is never a ref. */
  value: any
  /** Collects all the refs accessed during eval. */
  refs: AnyRef[]
  /** The ref if the value is a value of a ref. It is required for model binding. */
  ref?: AnyRef
}

class RegorEval {
  __contexts: Context[]

  __globalContext?: Record<string, any>

  __isLazy?: IsLazy

  __isLazyKey?: IsLazyKey

  __lastEvaluatedValueBeforeUnref?: any

  __lastExpressionType?: ExpressionType

  __collectRefObj: boolean

  constructor(
    contexts: Context[],
    globalContext?: Record<string, any>,
    isLazy?: IsLazy,
    isLazyKey?: IsLazyKey,
    collectRefObj?: boolean,
  ) {
    this.__contexts = isArray(contexts) ? contexts : [contexts]
    this.__globalContext = globalContext
    this.__isLazy = isLazy
    this.__isLazyKey = isLazyKey
    this.__collectRefObj = !!collectRefObj
  }

  __findContext(name: string, context?: Context): Context | undefined {
    if (context && name in context) return context
    for (const ctx of this.__contexts) {
      if (name in ctx) return ctx
    }
    return undefined
  }

  [ExpressionType.Identifier](
    expr: Identifier,
    _: number,
    context?: Context,
  ): any {
    const name = expr.name
    if (name === '$root') return this.__contexts[this.__contexts.length - 1]
    if (name === '$parent') return this.__contexts[1]
    if (name === '$ctx') return [...this.__contexts]
    if (context && name in context) {
      this.__lastEvaluatedValueBeforeUnref = context[name]
      return associateThis(unref(context[name]), context)
    }
    for (const ctx of this.__contexts) {
      if (name in ctx) {
        this.__lastEvaluatedValueBeforeUnref = ctx[name]
        return associateThis(unref(ctx[name]), ctx)
      }
    }
    const globalContext = this.__globalContext
    if (globalContext && name in globalContext) {
      this.__lastEvaluatedValueBeforeUnref = globalContext[name]
      return associateThis(unref(globalContext[name]), globalContext)
    }
  }

  [ExpressionType.This](
    _: ThisExpression,
    _depth: number,
    _context?: Context,
  ): any {
    return this.__contexts[0]
  }

  [ExpressionType.Compound](
    expr: Compound,
    depth: number,
    context?: Context,
  ): [] {
    return this.__transformLazy(depth, context, arrayEvaluator, ...expr.body)
  }

  [ExpressionType.Sequence](
    expr: SequenceExpression,
    depth: number,
    context?: Context,
  ): any {
    return this.__transform(
      depth,
      context,
      (...args: any[]) => args.pop(),
      ...expr.expressions,
    )
  }

  [ExpressionType.Member](
    expr: MemberExpression,
    depth: number,
    context?: Context,
  ): any {
    const { obj, key } = this.__getMemberExpressionTuple(expr, depth, context)
    const result = obj?.[key]
    this.__lastEvaluatedValueBeforeUnref = result
    return associateThis(unref(result), obj)
  }

  [ExpressionType.Literal](expr: Literal, _d: number, _?: Context): any {
    return expr.value
  }

  [ExpressionType.Call](
    expr: CallExpression,
    depth: number,
    context?: Context,
  ): any {
    const evaluator = (func: any, ...args: any[]): any =>
      isFunction(func) ? func(...spreadArgs(args)) : func

    const result = this.__transform(
      ++depth,
      context,
      evaluator,
      expr.callee,
      ...expr.arguments,
    )
    this.__lastEvaluatedValueBeforeUnref = result
    return result
  }

  [ExpressionType.Unary](
    expr: UnaryExpression,
    depth: number,
    context?: Context,
  ): any {
    return this.__transform(
      depth,
      context,
      evalUnaryOp[expr.operator],
      expr.argument,
    )
  }

  [ExpressionType.Binary](
    expr: BinaryExpression,
    depth: number,
    context?: Context,
  ): any {
    const evaluator = evalBinaryOp[expr.operator]
    switch (expr.operator) {
      case '||':
      case '&&':
      case '??': {
        return evaluator(
          () => this.__eval(expr.left, depth, context),
          () => this.__eval(expr.right, depth, context),
        )
      }
    }
    return this.__transform(depth, context, evaluator, expr.left, expr.right)
  }

  [ExpressionType.ArrayExp](
    expr: ArrayExpression,
    depth: number,
    context?: Context,
  ): [] {
    return this.__transformLazy(
      ++depth,
      context,
      arrayEvaluator,
      ...expr.elements,
    )
  }

  [ExpressionType.ObjectExp](
    expr: ObjectExpression,
    depth: number,
    context?: Context,
  ): any {
    const obj = {}
    const objEvaluator = (...args: any[]): void => {
      args.forEach((arg) => {
        Object.assign(obj, arg)
      })
    }
    this.__transform(++depth, context, objEvaluator, ...expr.properties)
    return obj
  }

  [ExpressionType.Conditional](
    expr: ConditionalExpression,
    depth: number,
    context?: Context,
  ): any {
    return this.__transform(
      depth,
      context,
      (test) =>
        this.__eval(test ? expr.consequent : expr.alternate, depth, context),
      expr.test,
    )
  }

  [ExpressionType.PropertyExp](
    expr: Property,
    depth: number,
    context?: Context,
  ): any {
    const obj: Record<string, any> = {}
    const isNotArrowExpr = (key?: Expression): boolean =>
      key?.type !== ExpressionType.Arrow
    const isLazyKey = this.__isLazyKey ?? ((() => false) as IsLazyKey)
    const collectRef = depth === 0 && this.__collectRefObj
    const eval1 = (e?: Event): any =>
      this.__evalRefObj(
        collectRef,
        expr.key,
        depth,
        createLazyContext(e, context),
      )
    const eval2 = (e?: Event): any =>
      this.__evalRefObj(
        collectRef,
        expr.value as Expression,
        depth,
        createLazyContext(e, context),
      )
    if (expr.shorthand) {
      const key = (expr.key as Identifier).name
      obj[key] =
        isNotArrowExpr(expr.key) && isLazyKey(key, depth) ? eval1 : eval1()
    } else if (expr.computed) {
      const key = unref(eval1())
      obj[key] =
        isNotArrowExpr(expr.value) && isLazyKey(key, depth) ? eval2 : eval2()
    } else {
      const key = (
        expr.key.type === ExpressionType.Literal
          ? (expr.key as Literal).value
          : (expr.key as Identifier).name
      ) as string
      obj[key] =
        isNotArrowExpr(expr.value) && isLazyKey(key, depth)
          ? () => eval2
          : eval2()
    }
    return obj
  }

  __getMemberExpressionTuple(
    expr: MemberExpression,
    depth: number,
    context?: Context,
  ): any {
    const obj = this.__eval(expr.object, depth, context)
    const key = expr.computed
      ? this.__eval(expr.property, depth, context)
      : (expr.property as Identifier).name
    return { obj, key }
  }

  [ExpressionType.Update](
    expr: UpdateExpression,
    depth: number,
    context?: Context,
  ): any {
    const arg = expr.argument
    const op = expr.operator
    const updater = expr.prefix ? evalPrefixUpdate : evalPostUpdate
    if (arg.type === ExpressionType.Identifier) {
      const name = (arg as Identifier).name
      const ctx = this.__findContext(name, context)
      if (isNullOrUndefined(ctx)) return undefined
      return updater[op](ctx, name)
    }
    if (arg.type === ExpressionType.Member) {
      const { obj, key } = this.__getMemberExpressionTuple(
        arg as MemberExpression,
        depth,
        context,
      )
      return updater[op](obj, key)
    }
  }

  [ExpressionType.Assignment](
    expr: AssignmentExpression,
    depth: number,
    context?: Context,
  ): any {
    const arg = expr.left
    const op = expr.operator
    if (arg.type === ExpressionType.Identifier) {
      const name = (arg as Identifier).name
      const ctx = this.__findContext(name, context)
      if (isNullOrUndefined(ctx)) return undefined
      const value = this.__eval(expr.right, depth, context)
      return applyAssigment[op](ctx, name, value)
    }
    if (arg.type === ExpressionType.Member) {
      const { obj, key } = this.__getMemberExpressionTuple(
        arg as MemberExpression,
        depth,
        context,
      )
      const value = this.__eval(expr.right, depth, context)
      return applyAssigment[op](obj, key, value)
    }
  }

  [ExpressionType.Spread](
    expr: SpreadElement,
    depth: number,
    context?: Context,
  ): any {
    const spreaded = this.__eval(expr.argument, depth, context)
    if (isArray(spreaded)) (spreaded as any).s = spreadElementSymbol
    return spreaded
  }

  [ExpressionType.TaggedTemplateExpression](
    expr: TaggedTemplateExpression,
    depth: number,
    context?: Context,
  ): any {
    return this[ExpressionType.Call](
      {
        type: ExpressionType.Call,
        callee: expr.tag,
        arguments: [
          {
            type: ExpressionType.ArrayExp,
            elements: expr.quasi.quasis,
          } satisfies ArrayExpression,
          ...expr.quasi.expressions,
        ],
      },
      depth,
      context,
    )
  }

  [ExpressionType.TemplateLiteral](
    expr: TemplateLiteral,
    depth: number,
    context?: Context,
  ): any {
    const evaluator = (...values: any[]): any =>
      values.reduce(
        (r: string, e: string, i) => (r += e + expr.quasis[i + 1].value.cooked),
        expr.quasis[0].value.cooked,
      )
    return this.__transform(depth, context, evaluator, ...expr.expressions)
  }

  [ExpressionType.TemplateElement](
    expr: TemplateElement,
    _d: number,
    _c?: Context,
  ): any {
    return expr.value.cooked
  }

  [ExpressionType.NewExpression](
    expr: NewExpression,
    depth: number,
    context?: Context,
  ): any {
    const evaluator = (
      Callee: new (...args: any[]) => any,
      ...args: any[]
    ): any => new Callee(...args)
    return this.__transform(
      depth,
      context,
      evaluator,
      expr.callee,
      ...expr.arguments,
    )
  }

  [ExpressionType.Arrow](
    expr: ArrowExpression,
    depth: number,
    context?: Context,
  ): any {
    return (...args: any[]) => {
      const ctx: Record<string, unknown> = Object.create(context ?? {})
      const params = expr.params
      if (params) {
        let i = 0
        for (const p of params) {
          ctx[(p as Identifier).name] = args[i++]
        }
      }
      return this.__eval(expr.body, depth, ctx)
    }
  }

  __eval(expr: Expression, depth: number, context?: Context): any {
    const result = unref(this[expr.type](expr as any, depth, context))
    this.__lastExpressionType = expr.type
    return result
  }

  __evalRefObj(
    collectRef: boolean,
    expr: Expression,
    depth: number,
    context?: Context,
  ): any {
    const result = this.__eval(expr, depth, context)
    if (collectRef && this.__isLastEvaluationARef()) {
      return this.__lastEvaluatedValueBeforeUnref
    }
    return result
  }

  __isLastEvaluationARef(): boolean {
    const lastType = this.__lastExpressionType
    return (
      (lastType === ExpressionType.Identifier ||
        lastType === ExpressionType.Member ||
        lastType === ExpressionType.Call) &&
      isRef(this.__lastEvaluatedValueBeforeUnref)
    )
  }

  eval(expr: Expression, context?: Context): RegorEvalResult {
    const { value, refs } = collectRefs(() => this.__eval(expr, -1, context))

    const evalResult: RegorEvalResult = {
      value,
      refs,
    }

    if (this.__isLastEvaluationARef()) {
      evalResult.ref = this.__lastEvaluatedValueBeforeUnref
    }
    return evalResult
  }

  __transform(
    depth: number,
    context: Context | undefined,
    evaluator: (...args: any[]) => any,
    ...args: Expression[]
  ): any {
    const evaluatedArgs = args.map(
      (arg) => arg && this.__eval(arg, depth, context),
    )
    return evaluator(...evaluatedArgs)
  }

  __transformLazy(
    depth: number,
    context: Context | undefined,
    evaluator: (...args: any[]) => any,
    ...args: Expression[]
  ): any {
    const isLazy = this.__isLazy
    if (!isLazy) return this.__transform(depth, context, evaluator, ...args)
    const evaluatedArgs = args.map(
      (arg, i) =>
        arg &&
        (arg.type !== ExpressionType.Arrow && isLazy(i, depth)
          ? (e: Event) => this.__eval(arg, depth, createLazyContext(e, context))
          : this.__eval(arg, depth, context)),
    )
    return evaluator(...evaluatedArgs)
  }
}

const spreadElementSymbol = Symbol('s')
const shouldSpreadArray = (arg: any): boolean => arg?.s === spreadElementSymbol

/**
 * @internal
 */
export const regorEval = (
  expr: Expression,
  contexts: Context[],
  globalContext?: Record<string, any>,
  isLazy?: IsLazy,
  isLazyKey?: IsLazyKey,
  context?: any,
  collectRefObj?: boolean,
): RegorEvalResult =>
  new RegorEval(contexts, globalContext, isLazy, isLazyKey, collectRefObj).eval(
    expr,
    context,
  )
