const DEFAULT_REDIRECT = '/'

export const safeRedirect = (
  to: string | null | undefined,
  defaultRedirect: string = DEFAULT_REDIRECT
) => {
  if (!to || typeof to !== 'string') {
    return defaultRedirect
  }

  if (!to.startsWith('/') || to.startsWith('//')) {
    return defaultRedirect
  }

  return to
}
