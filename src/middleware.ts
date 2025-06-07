import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const authToken = request.cookies.get("authToken")?.value;
  const tokens = Number(request.cookies.get("tokens")?.value || "0");

  // Protect authentication routes - redirect to dashboard if already logged in
  if (
    authToken &&
    ["/sign-in", "/sign-up", "/forgot-password"].includes(url.pathname)
  ) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Protect dashboard and other authenticated routes
  if (!authToken && ["/dashboard", "/profile"].includes(url.pathname)) {
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
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
