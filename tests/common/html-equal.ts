import { expect } from 'vitest'

export const removeSpaces = (str: string) =>
  str.replace(/\s+/g, ' ').replace(/\s+>/g, '>').replace(/>\s+</g, '><').trim()

export const htmlEqual = (
  actual: string,
  expected: string,
  keepWhitespace?: boolean,
) => {
  if (keepWhitespace) expect(actual).toBe(expected)
  else expect(removeSpaces(actual)).toBe(removeSpaces(expected))
}
