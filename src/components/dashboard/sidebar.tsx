"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  Settings,
  Scale,
  FileText,
  Package,
  LayoutDashboard,
} from "lucide-react";

const navItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Staff",
    href: "/dashboard/staff",
    icon: Users,
  },
  {
    title: "Services",
    href: "/dashboard/services",
    icon: Settings,
  },
  {
    title: "Lawyers",
    href: "/dashboard/lawyers",
    icon: Scale,
  },
  {
    title: "Form Templates",
    href: "/dashboard/forms",
    icon: FileText,
  },
  {
    title: "Ticket Packages",
    href: "/dashboard/tickets",
    icon: Package,
  },
  {
    title: "View Requests",
    href: "/dashboard/staff-dashboard",
    icon: Settings,
  },
  {
    title: "Schedule",
    href: "/dashboard/lawyer-dashboard",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      </div>
      <nav className="mt-6">
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
    </div>
  );
}
