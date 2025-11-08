/**
 * Image optimization utilities for format conversion and compression
 */

export interface ImageOptimizationOptions {
  quality?: number
  format?: "webp" | "avif" | "jpeg" | "png"
  width?: number
  height?: number
  fit?: "cover" | "contain" | "fill" | "inside" | "outside"
}

/**
 * Generates optimized image URLs with different formats and sizes
 * Supports integration with image optimization services like Cloudinary, ImageKit, or Next.js Image Optimization
 * 
 * To enable CDN optimization, set IMAGE_CDN_URL environment variable:
 * - Cloudinary: https://res.cloudinary.com/your-cloud/image/fetch
 * - ImageKit: https://ik.imagekit.io/your-imagekit-id
 * - Cloudflare Images: https://imagedelivery.net/your-account-id
 */
export const getOptimizedImageUrl = (
  src: string,
  options: ImageOptimizationOptions = {}
): string => {
  const { quality = 75, format = "webp", width, height, fit = "cover" } = options

  // Early return for empty src
  if (!src) {
    return ""
  }

  // Check for CDN configuration
  const imageCdnUrl = typeof process !== "undefined" && process.env?.IMAGE_CDN_URL
    ? process.env.IMAGE_CDN_URL
    : null

  // If CDN is configured, use it
  if (imageCdnUrl) {
    const params = new URLSearchParams()
    if (quality) params.set("q", quality.toString())
    if (format) params.set("f", format)
    if (width) params.set("w", width.toString())
    if (height) params.set("h", height.toString())
    if (fit) params.set("fit", fit)

    // Cloudinary format
    if (imageCdnUrl.includes("cloudinary.com")) {
      const transformParams = [
        `q_${quality}`,
        `f_${format}`,
        width && `w_${width}`,
        height && `h_${height}`,
        `c_${fit}`,
      ]
        .filter(Boolean)
        .join(",")
      return `${imageCdnUrl}/${transformParams}/${encodeURIComponent(src)}`
    }

    // ImageKit format
    if (imageCdnUrl.includes("imagekit.io")) {
      const transformParams = [
        `q-${quality}`,
        `f-${format}`,
        width && `w-${width}`,
        height && `h-${height}`,
        `c-${fit}`,
      ]
        .filter(Boolean)
        .join(",")
      return `${imageCdnUrl}/tr:${transformParams}/${src}`
    }

    // Generic CDN with query params
    return `${imageCdnUrl}${src.startsWith("/") ? "" : "/"}${src}?${params.toString()}`
  }

  // For local images or external images without CDN, return as-is
  // In production, consider implementing server-side image optimization
  return src
}

/**
 * Generates responsive image srcSet for different screen sizes
 * Supports both CDN-based and local image optimization
 */
export const generateResponsiveSrcSet = (
  baseSrc: string,
  sizes: number[] = [320, 640, 768, 1024, 1280, 1536, 1920]
): string => {
  if (!baseSrc) {
    return ""
  }

  // Check for CDN configuration
  const imageCdnUrl = typeof process !== "undefined" && process.env?.IMAGE_CDN_URL
    ? process.env.IMAGE_CDN_URL
    : null

  // If CDN is configured, generate srcSet with CDN URLs
  if (imageCdnUrl) {
    return sizes
      .map((size) => {
        const optimizedUrl = getOptimizedImageUrl(baseSrc, {
          width: size,
          quality: 80,
          format: "webp",
        })
        return `${optimizedUrl} ${size}w`
      })
      .join(", ")
  }

  // For local images, try to generate srcSet based on common naming conventions
  // This assumes you have multiple image sizes available (e.g., image-320w.jpg, image-640w.jpg)
  const baseUrl = baseSrc.replace(/\.[^/.]+$/, "")
  const extension = baseSrc.split(".").pop() || "jpg"

  return sizes.map((size) => `${baseUrl}-${size}w.${extension} ${size}w`).join(", ")
}

/**
 * Generates appropriate sizes attribute for responsive images
 */
export const generateSizesAttribute = (breakpoints: { maxWidth: number; size: string }[] = [
    { maxWidth: 640, size: "100vw" },
    { maxWidth: 768, size: "50vw" },
    { maxWidth: 1024, size: "33vw" },
    { maxWidth: 1280, size: "25vw" },
  ]): string => breakpoints.map(bp => `(max-width: ${bp.maxWidth}px) ${bp.size}`).join(", ") +
  ", 20vw"

/**
 * Determines if an image should be loaded with priority
 */
export const shouldLoadWithPriority = (
  src: string,
  context: "hero" | "above-fold" | "below-fold" | "lazy" = "lazy"
): boolean => context === "hero" || context === "above-fold"

/**
 * Generates a blur data URL for placeholder images
 */
export const generateBlurDataURL = (
  width: number = 10,
  height: number = 10
): string => {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext("2d")
  if (!ctx) {
    return ""
  }

  // Create a simple gradient blur
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, "#f3f4f6")
  gradient.addColorStop(1, "#e5e7eb")

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  return canvas.toDataURL("image/jpeg", 0.1)
}

/**
 * Preloads critical images
 */
export const preloadImage = (src: string): Promise<void> => new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`))
    img.src = src
  })

/**
 * Preloads multiple images
 */
export const preloadImages = async (srcs: string[]): Promise<void> => {
  const promises = srcs.map(preloadImage)
  await Promise.allSettled(promises)
}

/**
 * Gets the appropriate image format based on browser support
 */
export const getOptimalImageFormat = (): "webp" | "avif" | "jpeg" => {
  // Check for AVIF support
  if (typeof window !== "undefined" && "createImageBitmap" in window) {
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext("2d")
    if (ctx) {
      try {
        ctx.drawImage(new Image(), 0, 0)
        // AVIF is supported
        return "avif"
      } catch (e) {
        // AVIF not supported, check for WebP
      }
    }
  }

  // Check for WebP support
  if (typeof window !== "undefined") {
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0
      ? "webp"
      : "jpeg"
  }

  return "jpeg"
}

/**
 * Calculates the optimal image dimensions based on container size and device pixel ratio
 */
export const calculateOptimalDimensions = (
  containerWidth: number,
  containerHeight: number,
  devicePixelRatio: number = 1
): { width: number; height: number } => ({
  width: Math.ceil(containerWidth * devicePixelRatio),
  height: Math.ceil(containerHeight * devicePixelRatio),
})
