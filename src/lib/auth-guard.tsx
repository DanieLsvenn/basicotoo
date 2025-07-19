"use client";

import { useAuth, UserRole } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  allowedRoles?: UserRole[];
  blockedRoles?: UserRole[];
  redirectTo?: string;
  allowNoUser?: boolean; // <-- Add this prop
}

export function AuthGuard({
  children,
  fallback,
  allowedRoles = [UserRole.USER, UserRole.LAWYER, UserRole.STAFF, UserRole.ADMIN],
  blockedRoles = [],
  redirectTo,
  allowNoUser = false, // <-- Default to false for backward compatibility
}: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user && !allowNoUser) { // <-- Only redirect if not allowed
        router.push("/");
        return;
      }

      // Blocked roles logic
      if (user && blockedRoles.length > 0 && blockedRoles.includes(user.role)) {
        const defaultRedirect = redirectTo || getDefaultRedirectForRole(user.role);
        router.push(defaultRedirect);
        return;
      }

      // Allowed roles logic
      if (user && !allowedRoles.includes(user.role)) {
        const defaultRedirect = redirectTo || getDefaultRedirectForRole(user.role);
        router.push(defaultRedirect);
        return;
      }
    }
  }, [user, isLoading, router, allowedRoles, blockedRoles, redirectTo, allowNoUser]);

  const getDefaultRedirectForRole = (role: UserRole): string => {
    switch (role) {
      case UserRole.USER:
        return "/";
      case UserRole.LAWYER:
        return "/dashboard/lawyer-dashboard";
      case UserRole.STAFF:
        return "/dashboard/staff-dashboard";
        case UserRole.MANAGER:
        return "/dashboard";
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

  if (!user && !allowNoUser) {
    return fallback || null;
  }

  if (user && blockedRoles.length > 0 && blockedRoles.includes(user.role)) {
    return fallback || null;
  }

  if (user && !allowedRoles.includes(user.role)) {
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

export function ManagerOnlyGuard({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={[UserRole.MANAGER, UserRole.ADMIN]} fallback={fallback}>
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

export function EmployeeGuard({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={[UserRole.LAWYER, UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN]} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

export function BlockEmployeeAllowGuestGuard({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <AuthGuard
      blockedRoles={[UserRole.LAWYER, UserRole.STAFF, UserRole.MANAGER]}
      allowNoUser={true}
      fallback={fallback}
    >
      {children}
    </AuthGuard>
  );
}

export function BlockEmployeeGuardBlockGuest({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <AuthGuard
      blockedRoles={[UserRole.LAWYER, UserRole.STAFF, UserRole.MANAGER]}
      allowNoUser={false}
      fallback={fallback}
    >
      {children}
    </AuthGuard>
  );
}