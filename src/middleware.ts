import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

export function middleware(request: NextRequest) {
  const tokens = Number(request.cookies.get("tokens")?.value || "0");
  const url = request.nextUrl;

  if (url.pathname.startsWith("/booking") && tokens < 15) {
    url.pathname = "/buy-tickets";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
