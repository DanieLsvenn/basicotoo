import { AuthProvider } from "@/lib/auth-context";
import { StaffOnlyGuard } from "@/lib/auth-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <StaffOnlyGuard>
        <div className="flex h-screen bg-gray-50">
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">{children}</div>
          </main>
        </div>
      </StaffOnlyGuard>
    </AuthProvider>
  );
}
