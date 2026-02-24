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
    if (!aValidType || !bValidType) return false
    const aKeysCount = Object.keys(a).length
    const bKeysCount = Object.keys(b).length
    if (aKeysCount !== bKeysCount) {
      return false
    }
    for (const key in a) {
      const aHasKey = Object.prototype.hasOwnProperty.call(a, key)
      const bHasKey = Object.prototype.hasOwnProperty.call(b, key)
      if ((aHasKey && !bHasKey) || !looseEqual(a[key], b[key])) {
        return false
      }
    }
    return true
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
