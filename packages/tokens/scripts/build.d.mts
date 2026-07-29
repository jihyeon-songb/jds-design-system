export interface TokenBuildResult {
  css: string
  source: string
  declarations: string
}

export function buildTokens(source: Record<string, unknown>): TokenBuildResult
