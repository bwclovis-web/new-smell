/**
 * Type declarations for api/utils.js
 */
declare module "@api/utils" {

  /**
   * Parse cookies from request
   */
  export function parseCookies(req: {
    headers: { cookie?: string }
  }): Record<string, string>

  /**
   * Verify JWT token
   */
  export function verifyJwt(token: string): { userId?: string } | null

  /**
   * Sign JWT token
   */
  export function signJwt(payload: Record<string, unknown>): string
}
