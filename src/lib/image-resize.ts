/** Redimensionne une image côté client → data URL JPEG légère. */
export async function fileToPhotoDataUrl(
  file: File,
  maxSize = 900,
  quality = 0.82
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choisis une image (JPG, PNG, HEIC…).");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("Image trop lourde (max 12 Mo).");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Impossible de traiter l'image.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", quality);
}
