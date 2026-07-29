import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const session = req.auth;

  if (path.startsWith("/api/") || path.startsWith("/_next")) {
    return NextResponse.next();
  }

  if (!session && path !== "/login") {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  if (session && path === "/login") {
    const dest =
      session.user.role === "artist" ? "/mon-espace" : "/calendrier";
    return NextResponse.redirect(new URL(dest, req.nextUrl.origin));
  }

  if (session?.user.role === "artist") {
    const allowed =
      path === "/mon-espace" || path.startsWith("/mon-espace/");
    if (!allowed && path !== "/login") {
      return NextResponse.redirect(new URL("/mon-espace", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
