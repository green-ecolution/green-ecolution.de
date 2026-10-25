import { getImage } from 'astro:assets'
import type { ImageMetadata } from 'astro'

// Social previews and structured data need an absolute URL, and JPEG is the one
// format every crawler and preview renderer reads.
export async function absoluteImageUrl(
  base: string,
  src: ImageMetadata,
  maxWidth?: number,
): Promise<string> {
  const image = await getImage({
    src,
    width: Math.min(maxWidth ?? src.width, src.width),
    format: 'jpg',
  })
  return `${base}${image.src}`
}
