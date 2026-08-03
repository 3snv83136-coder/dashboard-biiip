import { getUploadFile } from "@/lib/uploads";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const doc = await getUploadFile(params.id);
  if (!doc) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  const bytes = Buffer.from(doc.data, "base64");
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": doc.mime_type || "application/octet-stream",
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
