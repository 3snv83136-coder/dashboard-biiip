import { requireSession } from "@/lib/api-auth";
import { put } from "@vercel/blob";
import { saveUploadFile } from "@/lib/uploads";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(req: Request) {
  const { error } = await requireSession(["admin", "staff"]);
  if (error) return error;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Fichier illisible ou trop lourd" },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Aucun fichier reçu" },
      { status: 400 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length === 0) {
    return NextResponse.json({ error: "Fichier vide" }, { status: 400 });
  }
  if (bytes.length > MAX_BYTES) {
    return NextResponse.json(
      { error: "Fichier trop lourd (max 4 Mo après compression)" },
      { status: 400 }
    );
  }

  const mime =
    file.type ||
    (file.name.match(/\.(png)$/i)
      ? "image/png"
      : file.name.match(/\.(webp)$/i)
        ? "image/webp"
        : file.name.match(/\.(gif)$/i)
          ? "image/gif"
          : file.name.match(/\.(mp4|mov|webm|m4v)$/i)
            ? "video/mp4"
            : "image/jpeg");

  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 80) || "media";

  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`medias/${Date.now()}-${safeName}`, bytes, {
        access: "public",
        contentType: mime,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      return NextResponse.json({
        url: blob.url,
        media_type: mime.startsWith("video/") ? "video" : "photo",
      });
    }

    const saved = await saveUploadFile({
      bytes,
      mime_type: mime,
      file_name: safeName,
    });

    return NextResponse.json({
      url: saved.public_path,
      media_type: mime.startsWith("video/") ? "video" : "photo",
    });
  } catch (err) {
    console.error("upload failed", err);
    return NextResponse.json(
      { error: "Échec de l’enregistrement du fichier" },
      { status: 500 }
    );
  }
}
