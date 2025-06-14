"use client";

import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AuthProvider>{children}</AuthProvider>
      <Toaster />
    </SessionProvider>
  );
}
