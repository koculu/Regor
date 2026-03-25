/**
 * @internal
 */
export const toClassTokens = (value: string): string[] => {
  const trimmed = value.trim()
  return trimmed ? trimmed.split(/\s+/) : []
}
