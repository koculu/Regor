import type { AssignmentOperator, BinaryOperator, UnaryOperator } from './jsep'

type BaseTypes = string | number | boolean | RegExp | null | undefined | object
/**
 * @internal
 */
export interface Expression {
  type: ExpressionType
  [key: string]: BaseTypes | Expression | Array<BaseTypes | Expression>
}
/**
 * @internal
 */
export interface ArrayExpression extends Expression {
  type: ExpressionType.ArrayExp
  elements: Expression[]
}
/**
 * @internal
 */
export interface BinaryExpression extends Expression {
  type: ExpressionType.Binary
  operator: BinaryOperator
  left: Expression
  right: Expression
}
/**
 * @internal
 */
export interface CallExpression extends Expression {
  type: ExpressionType.Call
  arguments: Expression[]
  callee: Expression
}
/**
 * @internal
 */
export interface Compound extends Expression {
  type: ExpressionType
  body: Expression[]
}
/**
 * @internal
 */
export interface ConditionalExpression extends Expression {
  type: ExpressionType.Conditional
  test: Expression
  consequent: Expression
  alternate: Expression
}
/**
 * @internal
 */
export interface Identifier extends Expression {
  type: ExpressionType.Identifier
  name: string
}
/**
 * @internal
 */
export interface Literal extends Expression {
  type: ExpressionType.Literal
  value: boolean | number | string | RegExp | null
  raw: string
}
/**
 * @internal
 */
export interface MemberExpression extends Expression {
  type: ExpressionType.Member
  computed: boolean
  object: Expression
  property: Expression
  optional?: boolean
}
/**
 * @internal
 */
export interface ThisExpression extends Expression {
  type: ExpressionType.This
}
/**
 * @internal
 */
export interface UnaryExpression extends Expression {
  type: ExpressionType.Unary
  operator: UnaryOperator
  argument: Expression
}
/**
 * @internal
 */
export interface SequenceExpression extends Expression {
  type: ExpressionType.Compound
  expressions: Expression[]
}
/**
 * @internal
 */
export interface TaggedTemplateExpression extends Expression {
  type: ExpressionType.TaggedTemplateExpression
  readonly tag: Expression
  readonly quasi: TemplateLiteral
}
/**
 * @internal
 */
export interface TemplateElement extends Expression {
  type: ExpressionType.TemplateElement
  value: { cooked: string; raw: string }
  tail: boolean
}
/**
 * @internal
 */
export interface TemplateLiteral extends Expression {
  type: ExpressionType.TemplateLiteral
  quasis: TemplateElement[]
  expressions: Expression[]
}
/**
 * @internal
 */
export interface NewExpression extends Expression {
  type: ExpressionType.NewExpression
  arguments: Expression[]
  callee: Expression
}
/**
 * @internal
 */
export enum ExpressionType {
  Compound,
  Sequence,
  Identifier,
  Member,
  Literal,
  This,
  Call,
  Unary,
  Binary,
  ArrayExp,
  ObjectExp,
  Conditional,
  PropertyExp,
  Update,
  Spread,
  Arrow,
  Assignment,
  TaggedTemplateExpression,
  TemplateElement,
  TemplateLiteral,
  NewExpression,
}
/**
 * @internal
 */
export enum HookType {
  gobbleExpression,
  afterExpression,
  gobbleToken,
  afterToken,
}
/**
 * @internal
 */
export interface ObjectExpression extends Expression {
  type: ExpressionType.ObjectExp
  properties: Expression[]
}
/**
 * @internal
 */
export interface Property extends Expression {
  type: ExpressionType.PropertyExp
  computed: boolean
  key: Expression
  shorthand: boolean
  value?: Expression
}
/**
 * @internal
 */
export interface UpdateExpression extends Expression {
  type: ExpressionType.Update
  operator: '++' | '--'
  argument: Expression
  prefix: boolean
}
/**
 * @internal
 */
export interface AssignmentExpression extends Expression {
  type: ExpressionType.Assignment
  operator: AssignmentOperator
  left: Expression
  right: Expression
}
/**
 * @internal
 */
export interface SpreadElement extends Expression {
  type: ExpressionType.Spread
  argument: Expression
}
/**
 * @internal
 */
export interface ArrowExpression extends Expression {
  type: ExpressionType.Arrow
  params: Expression[] | null
  body: Expression
  async?: boolean
}
