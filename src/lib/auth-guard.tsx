"use client";

import { useAuth, UserRole } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export function AuthGuard({
  children,
  fallback,
  allowedRoles = [UserRole.USER, UserRole.LAWYER, UserRole.STAFF],
  redirectTo,
}: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/sign-in");
        return;
      }

      // Check if user's role is allowed
      if (!allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard or specified redirect path
        const defaultRedirect =
          redirectTo || getDefaultRedirectForRole(user.role);
        router.push(defaultRedirect);
        return;
      }
    }
  }, [user, isLoading, router, allowedRoles, redirectTo]);

  const getDefaultRedirectForRole = (role: UserRole): string => {
    switch (role) {
      case UserRole.USER:
        return "/dashboard";
      case UserRole.LAWYER:
        return "/lawyer-dashboard";
      case UserRole.STAFF:
        return "/staff-dashboard";
      default:
        return "/";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return fallback || null;
  }

  if (!allowedRoles.includes(user.role)) {
    return fallback || null;
  }

  return <>{children}</>;
}

// Specific role guards for convenience
export function UserOnlyGuard({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={[UserRole.USER]} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

export function LawyerOnlyGuard({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={[UserRole.LAWYER]} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

export function StaffOnlyGuard({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={[UserRole.STAFF]} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

export function AdminGuard({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <AuthGuard
      allowedRoles={[UserRole.STAFF, UserRole.LAWYER]}
      fallback={fallback}
    >
      {children}
    </AuthGuard>
  );
}
