import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // If Supabase env vars not configured yet, allow all traffic through
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  const { supabaseResponse, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  console.log("[middleware] pathname:", pathname, "user:", !!user);

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isPlayerRoute =
    pathname.startsWith("/feed") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/venues") ||
    pathname.startsWith("/dealer") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/announce");
  const isOrganizerRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/events") ||
    pathname.startsWith("/requests");

  if (!user && (isPlayerRoute || isOrganizerRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }


  // Role check for organizer routes is handled at the layout level
  // (Prisma can't run in Edge middleware)

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
