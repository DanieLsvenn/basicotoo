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
  allowedRoles = [UserRole.USER, UserRole.LAWYER, UserRole.STAFF, UserRole.ADMIN],
  redirectTo,
}: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      console.log(user);
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
        return "/";
      case UserRole.LAWYER:
        return "/dashboard/lawyer-dashboard";
      case UserRole.STAFF:
        return "/dashboard/staff-dashboard";
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
    <AuthGuard allowedRoles={[UserRole.USER, UserRole.ADMIN]} fallback={fallback}>
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
    <AuthGuard allowedRoles={[UserRole.LAWYER, UserRole.ADMIN]} fallback={fallback}>
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
    <AuthGuard allowedRoles={[UserRole.STAFF, UserRole.ADMIN]} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

export function AdminOnlyGuard({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={[UserRole.ADMIN]} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

export function StaffOrLawyerGuard({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={[UserRole.LAWYER, UserRole.STAFF, UserRole.ADMIN]} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

export function AuthenticatedGuard({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={[UserRole.USER, UserRole.LAWYER, UserRole.STAFF, UserRole.ADMIN]} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}
