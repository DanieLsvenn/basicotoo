"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";
import {
  Users,
  Settings,
  Scale,
  FileText,
  Package,
  LayoutDashboard,
  Archive,
} from "lucide-react";
import { useEffect, useState } from "react";
import { UserRole, useAuth } from "@/lib/auth-context";

const allNavItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: [UserRole.ADMIN, UserRole.LAWYER, UserRole.STAFF],
  },
  {
    title: "Staff",
    href: "/dashboard/staff",
    icon: Users,
    roles: [UserRole.ADMIN],
  },
  {
    title: "Services",
    href: "/dashboard/services",
    icon: Settings,
    roles: [UserRole.ADMIN],
  },
  {
    title: "Lawyers",
    href: "/dashboard/lawyers",
    icon: Scale,
    roles: [UserRole.ADMIN],
  },
  {
    title: "Form Templates",
    href: "/dashboard/forms",
    icon: FileText,
    roles: [UserRole.ADMIN],
  },
  {
    title: "Ticket Packages",
    href: "/dashboard/tickets",
    icon: Package,
    roles: [UserRole.ADMIN],
  },
  {
    title: "View Requests",
    href: "/dashboard/staff-dashboard",
    icon: Archive,
    roles: [UserRole.STAFF, UserRole.ADMIN],
  },
  {
    title: "Schedule",
    href: "/dashboard/lawyer-dashboard",
    icon: Settings,
    roles: [UserRole.LAWYER, UserRole.ADMIN],
  },
  {
    title: "Check Bookings",
    href: "/dashboard/check-bookings",
    icon: Settings,
    roles: [UserRole.STAFF, UserRole.ADMIN],
  },
  {
    title: "View Feedbacks",
    href: "/dashboard/view-feedbacks",
    icon: Settings,
    roles: [UserRole.STAFF, UserRole.ADMIN],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole | null>(null);
  const { logout } = useAuth();

  useEffect(() => {
    const role = Cookies.get("userRole") as UserRole | undefined;
    setRole(role ?? null);
  }, []);

  // Only show items allowed for this role
  const navItems = role
    ? allNavItems.filter((item) => item.roles.includes(role))
    : [];

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      </div>
      <nav className="mt-6 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-6 py-3 text-sm font-medium transition-colors hover:bg-gray-50",
                pathname === item.href
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>
      <div className="p-6 mt-auto">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-200 rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
