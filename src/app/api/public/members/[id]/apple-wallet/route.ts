import { findMemberById } from "@/lib/public-store";
import {
  buildMemberApplePass,
  isAppleWalletConfigured,
} from "@/lib/wallet/apple-pass";
import { NextResponse } from "next/server";

/** Télécharge la carte adhérent en .pkpass (Apple Wallet). */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!isAppleWalletConfigured()) {
    return NextResponse.json(
      {
        error:
          "Apple Wallet n’est pas encore activé. Configure les certificats Pass Type ID sur Vercel (voir integrations.md).",
        wallet_available: false,
      },
      { status: 503 }
    );
  }

  const member = await findMemberById(params.id);
  if (!member) {
    return NextResponse.json({ error: "Carte introuvable" }, { status: 404 });
  }

  try {
    const { buffer, filename } = await buildMemberApplePass(member);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[apple-wallet]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Impossible de générer la carte Wallet",
      },
      { status: 500 }
    );
  }
}
