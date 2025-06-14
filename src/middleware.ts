import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // Check for both NextAuth session and custom auth token
  const nextAuthToken = await getToken({ req: request });
  const authToken = request.cookies.get("authToken")?.value;
  const tokens = Number(request.cookies.get("tokens")?.value || "0");

  // User is authenticated if they have either NextAuth token or custom auth token
  const isAuthenticated = !!nextAuthToken || !!authToken;

  // Protect authentication routes - redirect to dashboard if already logged in
  if (
    isAuthenticated &&
    ["/sign-in", "/sign-up", "/forgot-password"].includes(url.pathname)
  ) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Protect dashboard and other authenticated routes
  if (!isAuthenticated && ["/dashboard", "/profile"].includes(url.pathname)) {
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  // Token-based access control for booking
  if (url.pathname.startsWith("/booking") && tokens < 15) {
    url.pathname = "/buy-tickets";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
