import Image, { type ImageProps } from "next/image";
import { z } from "zod";

import { Skeleton } from "@/components/ui/skeleton";

const urlSchema = z.url({
  hostname: /^trip-loom-bucket\.s3\.sa-east-1\.amazonaws\.com$/,
  protocol: /^https$/,
});

function isValidImageSrc(src: ImageProps["src"]): boolean {
  if (!src || typeof src !== "string") return false;

  if (src.startsWith("./") || src.startsWith("/")) return true;

  return urlSchema.safeParse(src.trim()).success;
}

function ImageFallback({
  className,
  width,
  height,
  fill,
  alt,
}: {
  className?: string;
  width?: number | `${number}`;
  height?: number | `${number}`;
  fill?: boolean;
  alt: string;
}) {
  const style = fill
    ? undefined
    : {
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      };

  return (
    <Skeleton
      role="img"
      aria-label={alt}
      aria-busy="true"
      className={className}
      style={style}
    />
  );
}

/**
 * Safe `next/image` implementation that allows partial images to be rendered without throwing errors.
 *
 * The streamed URL is checked against our CDN to ensure
 * the image is valid before rendering Image. While streaming, it renders a skeleton loader.
 */
export function StreamingImage({
  src,
  alt,
  className,
  width,
  height,
  fill,
  ...props
}: ImageProps) {
  if (!isValidImageSrc(src)) {
    return (
      <ImageFallback
        className={className}
        width={width}
        height={height}
        fill={fill}
        alt={alt || "Streaming image..."}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt || "Streaming image..."}
      className={className}
      width={width}
      height={height}
      fill={fill}
      {...props}
    />
  );
}
