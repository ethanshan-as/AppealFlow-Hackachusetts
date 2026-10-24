/**
 * Graceful handling of image previews, including HEIC and other formats most
 * browsers cannot render inline (P0 #4). We never upload the file; previews are
 * client-only object URLs. For unsupported formats we return a friendly notice
 * instead of a broken image.
 */

export interface PreviewResult {
  kind: "image" | "unsupported";
  /** Object URL for a renderable image, or null when unsupported. */
  url: string | null;
  /** Human-readable note for unsupported files (e.g. HEIC). */
  message?: string;
  fileName: string;
  fileType: string;
}

// Browsers generally cannot render these inline via <img>.
const UNSUPPORTED_INLINE = [
  "image/heic",
  "image/heif",
  "image/tiff",
  "image/avif", // inconsistent support; treat as needs-fallback
];

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

const UNSUPPORTED_EXTENSIONS = new Set(["heic", "heif", "tif", "tiff"]);

export function isLikelyUnsupportedImage(file: {
  type: string;
  name: string;
}): boolean {
  if (UNSUPPORTED_INLINE.includes(file.type.toLowerCase())) return true;
  // HEIC files sometimes arrive with an empty or generic MIME type.
  if (UNSUPPORTED_EXTENSIONS.has(extensionOf(file.name))) return true;
  return false;
}

export function buildPreview(
  file: File,
  createObjectUrl: (f: File) => string = (f) => URL.createObjectURL(f)
): PreviewResult {
  const base = { fileName: file.name, fileType: file.type || "unknown" };

  if (!file.type.startsWith("image/") && extensionOf(file.name) === "") {
    return {
      ...base,
      kind: "unsupported",
      url: null,
      message: `This file type can't be previewed here. It stays on your device; you can still attach it when you submit.`,
    };
  }

  if (isLikelyUnsupportedImage(file)) {
    const label = extensionOf(file.name).toUpperCase() || "This format";
    return {
      ...base,
      kind: "unsupported",
      url: null,
      message: `${label} images can't be previewed in most browsers. The file stays on your device; you can still attach it when you submit, or convert it to JPG/PNG to preview.`,
    };
  }

  try {
    return { ...base, kind: "image", url: createObjectUrl(file) };
  } catch {
    return {
      ...base,
      kind: "unsupported",
      url: null,
      message: "Could not generate a preview for this file.",
    };
  }
}
