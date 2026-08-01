import { buildLlmsTxt } from "@/lib/llms-txt";
import { getStore } from "@/lib/store";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Public : consommé par biiipcomedyclub.fr (ou des crawlers IA), pas de données privées.
export async function GET() {
  const store = getStore();
  const body = buildLlmsTxt(store.media_assets);
  return new NextResponse(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
