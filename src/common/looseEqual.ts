import { isArray, isDate, isObject, isSymbol } from './is-what'

// The looseEqual.ts is copied from vuejs/core.
// using the license: The MIT License (MIT)
// Copyright (c) 2018-present, Yuxi (Evan) You
// https://github.com/vuejs/core/blob/main/packages/shared/src/looseEqual.ts

function looseCompareArrays(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false
  let equal = true
  for (let i = 0; equal && i < a.length; i++) {
    equal = looseEqual(a[i], b[i])
  }
  return equal
}

/**
 * @internal
 */
export function looseEqual(a: any, b: any): boolean {
  if (a === b) return true
  let aValidType = isDate(a)
  let bValidType = isDate(b)
  if (aValidType || bValidType) {
    return aValidType && bValidType ? a.getTime() === b.getTime() : false
  }
  aValidType = isSymbol(a)
  bValidType = isSymbol(b)
  if (aValidType || bValidType) {
    return a === b
  }
  aValidType = isArray(a)
  bValidType = isArray(b)
  if (aValidType || bValidType) {
    return aValidType && bValidType ? looseCompareArrays(a, b) : false
  }
  aValidType = isObject(a)
  bValidType = isObject(b)
  if (aValidType || bValidType) {
    /* istanbul ignore if: this if will probably never be called */
    if (!aValidType || !bValidType) {
      return false
    }
    const aKeysCount = Object.keys(a).length
    const bKeysCount = Object.keys(b).length
    if (aKeysCount !== bKeysCount) {
      return false
    }
    for (const key in a) {
      // eslint-disable-next-line no-prototype-builtins
      const aHasKey = a.hasOwnProperty(key)
      // eslint-disable-next-line no-prototype-builtins
      const bHasKey = b.hasOwnProperty(key)
      if (
        (aHasKey && !bHasKey) ||
        (!aHasKey && bHasKey) ||
        !looseEqual(a[key], b[key])
      ) {
        return false
      }
    }
  }
  return String(a) === String(b)
}

/**
 * @internal
 */
export function looseIndexOf(arr: any[], val: any): number {
  return arr.findIndex((item) => looseEqual(item, val))
}

/**
 * @internal
 */
export const looseToNumber = (val: any): any => {
  const n = parseFloat(val)
  return isNaN(n) ? val : n
}
