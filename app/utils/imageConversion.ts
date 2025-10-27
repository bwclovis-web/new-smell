// Image conversion utilities using Sharp
import { promises as fs } from 'fs'
import { basename, dirname, extname, join } from 'path'
import sharp from 'sharp'

export interface ConversionOptions {
  quality?: number // 1-100, default 80
  lossless?: boolean // default false
  effort?: number // 0-6, default 4 (higher = better compression, slower)
  metadata?: boolean // default false
  progressive?: boolean // default false
  resize?: {
    width?: number
    height?: number
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
    position?: 'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top' | 'center'
  }
}

export interface ConversionResult {
  inputPath: string
  outputPath: string
  originalSize: number
  convertedSize: number
  compressionRatio: number
  success: boolean
  error?: string
}

/**
 * Convert a single PNG file to WebP format
 */
export async function convertPngToWebP(
  inputPath: string,
  outputPath?: string,
  options: ConversionOptions = {}
): Promise<ConversionResult> {
  const {
    quality = 80,
    lossless = false,
    effort = 4,
    metadata = false,
    progressive = false,
    resize
  } = options

  try {
    // Validate input file
    if (!inputPath || !inputPath.toLowerCase().endsWith('.png')) {
      throw new Error('Input must be a PNG file')
    }

    // Check if input file exists
    await fs.access(inputPath)
    const originalStats = await fs.stat(inputPath)
    const originalSize = originalStats.size

    // Generate output path if not provided
    if (!outputPath) {
      const dir = dirname(inputPath)
      const name = basename(inputPath, extname(inputPath))
      outputPath = join(dir, `${name}.webp`)
    }

    // Create output directory if it doesn't exist
    const outputDir = dirname(outputPath)
    await fs.mkdir(outputDir, { recursive: true })

    // Configure Sharp pipeline
    let pipeline = sharp(inputPath)

    // Apply resize if specified
    if (resize && (resize.width || resize.height)) {
      pipeline = pipeline.resize(resize.width, resize.height, {
        fit: resize.fit || 'cover',
        position: resize.position || 'center'
      })
    }

    // Convert to WebP
    const webpOptions: sharp.WebpOptions = {
      quality,
      effort,
      lossless,
      progressive
    }

    // Remove metadata if requested
    if (!metadata) {
      pipeline = pipeline.withMetadata(false)
    }

    // Process the image
    await pipeline.webp(webpOptions).toFile(outputPath)

    // Get converted file size
    const convertedStats = await fs.stat(outputPath)
    const convertedSize = convertedStats.size
    const compressionRatio = ((originalSize - convertedSize) / originalSize) * 100

    return {
      inputPath,
      outputPath,
      originalSize,
      convertedSize,
      compressionRatio,
      success: true
    }
  } catch (error) {
    return {
      inputPath,
      outputPath: outputPath || '',
      originalSize: 0,
      convertedSize: 0,
      compressionRatio: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Convert multiple PNG files to WebP format
 */
export async function convertMultiplePngToWebP(
  inputPaths: string[],
  outputDir?: string,
  options: ConversionOptions = {}
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []

  for (const inputPath of inputPaths) {
    let outputPath: string | undefined

    if (outputDir) {
      const name = basename(inputPath, extname(inputPath))
      outputPath = join(outputDir, `${name}.webp`)
    }

    const result = await convertPngToWebP(inputPath, outputPath, options)
    results.push(result)
  }

  return results
}

/**
 * Find all PNG files in a directory recursively
 */
export async function findPngFiles(directory: string): Promise<string[]> {
  const pngFiles: string[] = []

  async function scanDirectory(dir: string) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = join(dir, entry.name)

        if (entry.isDirectory()) {
          await scanDirectory(fullPath)
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) {
          pngFiles.push(fullPath)
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${dir}:`, error)
    }
  }

  await scanDirectory(directory)
  return pngFiles
}

/**
 * Get optimized conversion options for different use cases
 */
export function getOptimizedOptions(useCase: 'web' | 'mobile' | 'print' | 'thumbnail'): ConversionOptions {
  switch (useCase) {
    case 'web':
      return {
        quality: 85,
        effort: 6,
        progressive: true,
        metadata: false
      }
    case 'mobile':
      return {
        quality: 75,
        effort: 6,
        progressive: true,
        metadata: false,
        resize: {
          width: 800,
          fit: 'inside'
        }
      }
    case 'print':
      return {
        quality: 95,
        effort: 6,
        lossless: false,
        metadata: true
      }
    case 'thumbnail':
      return {
        quality: 70,
        effort: 4,
        metadata: false,
        resize: {
          width: 200,
          height: 200,
          fit: 'cover'
        }
      }
    default:
      return {}
  }
}

/**
 * Generate a summary report of conversion results
 */
export function generateConversionReport(results: ConversionResult[]): string {
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  const totalOriginalSize = successful.reduce((sum, r) => sum + r.originalSize, 0)
  const totalConvertedSize = successful.reduce((sum, r) => sum + r.convertedSize, 0)
  const avgCompressionRatio = successful.length > 0
    ? successful.reduce((sum, r) => sum + r.compressionRatio, 0) / successful.length
    : 0

  return `
📊 PNG to WebP Conversion Report
================================

✅ Successful conversions: ${successful.length}
❌ Failed conversions: ${failed.length}
📁 Total files processed: ${results.length}

📈 Compression Statistics:
   Original total size: ${formatBytes(totalOriginalSize)}
   Converted total size: ${formatBytes(totalConvertedSize)}
   Average compression: ${avgCompressionRatio.toFixed(1)}%
   Total space saved: ${formatBytes(totalOriginalSize - totalConvertedSize)}

${failed.length > 0 ? `
❌ Failed Conversions:
${failed.map(f => `   - ${f.inputPath}: ${f.error}`).join('\n')}
` : ''}
  `.trim()
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) {
 return '0 Bytes' 
}

  const k = 1024
  const sizes = [
'Bytes', 'KB', 'MB', 'GB'
]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Validate WebP support in the current environment
 */
export async function validateWebPSupport(): Promise<boolean> {
  try {
    // Create a simple test image
    const testBuffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
      .webp()
      .toBuffer()

    return testBuffer.length > 0
  } catch (error) {
    console.error('WebP support validation failed:', error)
    return false
  }
}
