/** Extensions image courantes (y compris iPhone HEIC). */
const IMAGE_EXT =
  /\.(jpe?g|png|gif|webp|avif|bmp|tiff?|heic|heif|jfif|svg)$/i;

function looksLikeImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  if (IMAGE_EXT.test(file.name)) return true;
  // iOS envoie souvent un type vide pour les photos de la pellicule
  if (!file.type && file.size > 0) return true;
  return false;
}

async function bitmapFromFile(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, {
      imageOrientation: "from-image",
    } as ImageBitmapOptions);
  } catch {
    // fallback sans options
  }

  try {
    return await createImageBitmap(file);
  } catch {
    // continue
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () =>
        reject(new Error("Format non décodable par ce navigateur"));
      el.src = url;
    });
    return await createImageBitmap(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.size === 0) {
          reject(new Error("Compression JPEG impossible"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality
    );
  });
}

/**
 * Compresse une image en JPEG File via canvas.toBlob (pas de FileReader / data URL).
 * Lance une erreur si le navigateur ne peut pas décoder (ex. HEIC sur Chrome).
 */
export async function fileToJpegFile(
  file: File,
  maxSize = 1200,
  quality = 0.78
): Promise<File> {
  if (!looksLikeImage(file)) {
    throw new Error("Choisis une image (JPG, PNG, WEBP, HEIC, GIF…)");
  }
  if (file.size > 40 * 1024 * 1024) {
    throw new Error("Fichier trop lourd (max 40 Mo)");
  }

  const bitmap = await bitmapFromFile(file);
  try {
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    let width = Math.max(1, Math.round(bitmap.width * scale));
    let height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Impossible de traiter l'image");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    let q = quality;
    let blob = await canvasToJpegBlob(canvas, q);

    // Si encore trop gros pour Vercel (~4 Mo), réduire
    while (blob.size > 3.5 * 1024 * 1024 && q > 0.4) {
      q -= 0.1;
      blob = await canvasToJpegBlob(canvas, q);
    }
    while (blob.size > 3.5 * 1024 * 1024 && Math.max(width, height) > 640) {
      width = Math.max(640, Math.round(width * 0.75));
      height = Math.max(640, Math.round(height * 0.75));
      canvas.width = width;
      canvas.height = height;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(bitmap, 0, 0, width, height);
      blob = await canvasToJpegBlob(canvas, 0.72);
    }

    if (blob.size > 4 * 1024 * 1024) {
      throw new Error("Photo encore trop lourde après compression");
    }

    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}

/**
 * Pour les flux qui veulent encore une data URL (ex. portail artiste).
 */
export async function fileToPhotoDataUrl(
  file: File,
  maxSize = 900,
  quality = 0.82
): Promise<string> {
  const jpeg = await fileToJpegFile(file, maxSize, quality);
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Lecture impossible"));
    };
    reader.onerror = () => reject(new Error("Lecture impossible"));
    reader.readAsDataURL(jpeg);
  });
}
