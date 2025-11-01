declare module "../../api/utils" {
  export function parseCookies(headers: { cookie: string }): Record<string, string>
  export function verifyJwt(token: string): { userId?: string } | null
}
