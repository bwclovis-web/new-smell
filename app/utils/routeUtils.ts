const DEFAULT_REDIRECT = "/"

// eslint-disable-next-line complexity
export const safeRedirect = (
  to: FormDataEntryValue | string | null | undefined,
  defaultRedirect: string = DEFAULT_REDIRECT
) => {
  if (!to || typeof to !== "string") {
    return defaultRedirect
  }

  if (!to.startsWith("/") || to.startsWith("//")) {
    return defaultRedirect
  }

  return to
}
