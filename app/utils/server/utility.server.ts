import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['production', 'development', 'test'] as const)
})


export function initEnvs() {
  const parsed = schema.safeParse(process.env)

  if (parsed.success === false) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
    throw new Error('Invalid environment variables.')
  }
}

export function getDomainPathname(request: Request) {
  const pathname = new URL(request.url).pathname
  if (!pathname) {
    return null
  }
  return pathname
}

export const singleton = <Value>(
  name: string,
  valueFactory: () => Value
): Value => {
  const g = global as unknown as { __singletons: Record<string, Value> }
  g.__singletons = g.__singletons ?? {}
  g.__singletons[name] ??= valueFactory()
  return g.__singletons[name] as Value
}

export const mergeHeaders = (...headers: Array<ResponseInit['headers'] | null | undefined>) => {
  const mergedHeaders = new Headers()

  for (const header of headers) {
    if (!header) {
      continue
    }
    for (const [key, value] of new Headers(header).entries()) {
      mergedHeaders.append(key, value)
    }
  }
  return mergedHeaders
}
