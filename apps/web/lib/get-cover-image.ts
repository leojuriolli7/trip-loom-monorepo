type ImageUrl = {
  url: string;
  isCover: boolean;
  caption: string;
};

/**
 * Tries to find the cover image via `isCover` attribute. If none has isCover true,
 * falls back to first image.
 */
export function getCoverImage(
  imagesUrls: ImageUrl[] | null | undefined,
  fallback = "/placeholder.png",
) {
  return (
    imagesUrls?.find((img) => img.isCover)?.url ??
    imagesUrls?.[0]?.url ??
    fallback
  );
}
