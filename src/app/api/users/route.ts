import { requireSession } from "@/lib/api-auth";
import { getStore } from "@/lib/store";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireSession(["admin"]);
  if (error) return error;

  const users = getStore().users.map((u) => {
    const { password_hash, ...rest } = u;
    void password_hash;
    return rest;
  });
  return NextResponse.json({ users });
}
