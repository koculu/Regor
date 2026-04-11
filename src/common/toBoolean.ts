/**
 * @internal
 */
export const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === '' || normalized === '0' || normalized === 'false')
      return false
    if (normalized === 'true') return true
  }
  return !!value
}
