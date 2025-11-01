declare module "c:/Repos/new-smell/api/utils.js" {
  export function parseCookies(req: {
    headers: { cookie: string }
  }): Record<string, string>
  export function verifyJwt(token: string): { userId: string } | null
}
