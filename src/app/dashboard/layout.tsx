import { Sidebar } from "@/components/dashboard/sidebar";
import { AuthProvider } from "@/lib/auth-context";
import { StaffOrLawyerGuard } from "@/lib/auth-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <StaffOrLawyerGuard>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">{children}</div>
          </main>
        </div>
      </StaffOrLawyerGuard>
    </AuthProvider>
  );
}
