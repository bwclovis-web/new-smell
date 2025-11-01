/**
 * Enhanced compression utilities for API responses
 */

export interface CompressionOptions {
  level?: number
  threshold?: number
  chunkSize?: number
  memLevel?: number
  strategy?: number
  windowBits?: number
}

export const defaultCompressionOptions: CompressionOptions = {
  level: 6,
  threshold: 1024,
  chunkSize: 16 * 1024,
  memLevel: 8,
  strategy: 0,
  windowBits: 15,
}

/**
 * Get compression headers for API responses
 * Note: Actual compression is handled by Express middleware
 */
export function getCompressionHeaders(
  data: any,
  options: CompressionOptions = defaultCompressionOptions
): Record<string, string> {
  const jsonString = JSON.stringify(data)
  const originalSize = Buffer.byteLength(jsonString, "utf8")

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Original-Size": originalSize.toString(),
    Vary: "Accept-Encoding",
  }

  // Add compression hint if above threshold
  if (originalSize >= (options.threshold || 1024)) {
    headers["X-Compression-Enabled"] = "true"
  }

  return headers
}

/**
 * Get pagination metadata with compression info
 */
export function getPaginatedMeta<T>(
  data: T[],
  meta: {
    page?: number
    limit?: number
    total?: number
    hasMore?: boolean
  }
) {
  return {
    ...meta,
    count: data.length,
    compressed: true,
  }
}

/**
 * Get analytics metadata with compression info
 */
export function getAnalyticsMeta(data: any) {
  return {
    ...data,
    meta: {
      compressed: true,
      timestamp: new Date().toISOString(),
      version: "1.0",
    },
  }
}

/**
 * Get search metadata with compression info
 */
export function getSearchMeta(results: any[], query: string, totalCount: number) {
  return {
    results,
    query,
    totalCount,
    meta: {
      compressed: true,
      searchTime: Date.now(),
      resultCount: results.length,
    },
  }
}

/**
 * Check if response should be compressed based on content type and size
 */
export function shouldCompressResponse(
  contentType: string,
  contentLength: number,
  threshold: number = 1024
): boolean {
  // Don't compress already compressed content
  if (
    contentType.includes("gzip") ||
    contentType.includes("deflate") ||
    contentType.includes("br")
  ) {
    return false
  }

  // Don't compress binary content
  if (
    contentType.includes("image/") ||
    contentType.includes("video/") ||
    contentType.includes("audio/")
  ) {
    return false
  }

  // Only compress if above threshold
  return contentLength > threshold
}

/**
 * Get compression statistics for monitoring
 */
export function getCompressionStats() {
  return {
    enabled: true,
    algorithm: "gzip",
    level: defaultCompressionOptions.level,
    threshold: defaultCompressionOptions.threshold,
    chunkSize: defaultCompressionOptions.chunkSize,
    memLevel: defaultCompressionOptions.memLevel,
    strategy: defaultCompressionOptions.strategy,
    windowBits: defaultCompressionOptions.windowBits,
  }
}
