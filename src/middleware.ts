import { NextRequest, NextResponse } from "next/server";

// Define user roles
enum UserRole {
  USER = "USER",
  LAWYER = "LAWYER",
  STAFF = "STAFF",
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // Check for both NextAuth session and custom auth tokenW
  const authToken = request.cookies.get("authToken")?.value;
  const userRole = request.cookies.get("userRole")?.value as UserRole;
  const tokens = Number(request.cookies.get("tokens")?.value || "0");

  // User is authenticated if they have either NextAuth token or custom auth token
  const isAuthenticated = !!authToken;

  // Protect authentication routes - redirect to appropriate dashboard if already logged in
  if (
    isAuthenticated &&
    [
      "/sign-in",
      "/sign-up",
      "/forgot-password",
      "/lawyer-register",
      "/staff-register",
    ].includes(url.pathname)
  ) {
    // Redirect based on user role
    if (userRole === UserRole.LAWYER) {
      url.pathname = "/lawyer-dashboard";
    } else if (userRole === UserRole.STAFF) {
      url.pathname = "/staff-dashboard";
    } else {
      url.pathname = "/dashboard";
    }
    return NextResponse.redirect(url);
  }

  // Protect dashboard routes based on roles
  if (!isAuthenticated) {
    const protectedRoutes = [
      "/dashboard",
      "/profile",
      "/lawyer-dashboard",
      "/staff-dashboard",
      "/booking",
      "/buy-tickets",
    ];

    if (protectedRoutes.some((route) => url.pathname.startsWith(route))) {
      url.pathname = "/sign-in";
      return NextResponse.redirect(url);
    }
  }

  // Role-based access control for authenticated users
  if (isAuthenticated && userRole) {
    // User-only routes
    if (
      userRole !== UserRole.USER &&
      (url.pathname.startsWith("/dashboard") ||
        url.pathname.startsWith("/booking") ||
        url.pathname.startsWith("/buy-tickets"))
    ) {
      // Redirect to appropriate dashboard
      if (userRole === UserRole.LAWYER) {
        url.pathname = "/lawyer-dashboard";
      } else if (userRole === UserRole.STAFF) {
        url.pathname = "/staff-dashboard";
      }
      return NextResponse.redirect(url);
    }

    // Lawyer-only routes
    if (
      userRole !== UserRole.LAWYER &&
      url.pathname.startsWith("/lawyer-dashboard")
    ) {
      // Redirect to appropriate dashboard
      if (userRole === UserRole.USER) {
        url.pathname = "/dashboard";
      } else if (userRole === UserRole.STAFF) {
        url.pathname = "/staff-dashboard";
      }
      return NextResponse.redirect(url);
    }

    // Staff-only routes
    if (
      userRole !== UserRole.STAFF &&
      url.pathname.startsWith("/staff-dashboard")
    ) {
      // Redirect to appropriate dashboard
      if (userRole === UserRole.USER) {
        url.pathname = "/dashboard";
      } else if (userRole === UserRole.LAWYER) {
        url.pathname = "/lawyer-dashboard";
      }
      return NextResponse.redirect(url);
    }

    // Admin/Management routes (accessible by Staff and potentially Lawyers)
    if (url.pathname.startsWith("/admin") && userRole === UserRole.USER) {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Token-based access control for booking (User-specific feature)
  if (
    url.pathname.startsWith("/booking") &&
    userRole === UserRole.USER &&
    tokens < 15
  ) {
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
