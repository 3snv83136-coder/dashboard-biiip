import { isAppleWalletConfigured } from "@/lib/wallet/apple-pass";
import { NextResponse } from "next/server";

/** Indique si le bouton Apple Wallet peut être proposé aux adhérents. */
export async function GET() {
  return NextResponse.json({
    apple_wallet: isAppleWalletConfigured(),
  });
}
