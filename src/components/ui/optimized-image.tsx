/**
 * OptimizedImage — thin next/image wrapper with sensible defaults.
 *
 * - Defaults to `loading="lazy"` unless `priority` is set (LCP images should
 *   use `priority` instead of explicit `loading="eager"`).
 * - Defaults `sizes` to `"100vw"` to prevent layout-shift warnings when no
 *   explicit value is supplied.
 * - All other next/image props are forwarded unchanged.
 */
import NextImage, { type ImageProps } from "next/image"

type OptimizedImageProps = ImageProps

export function OptimizedImage({
  priority,
  sizes,
  loading,
  ...props
}: OptimizedImageProps) {
  return (
    <NextImage
      priority={priority}
      // Don't set loading when priority is true — Next.js handles preload automatically
      loading={priority ? undefined : (loading ?? "lazy")}
      sizes={sizes ?? "100vw"}
      {...props}
    />
  )
}
