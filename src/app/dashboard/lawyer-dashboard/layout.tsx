import { AuthProvider } from "@/lib/auth-context";
import { LawyerOnlyGuard } from "@/lib/auth-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <LawyerOnlyGuard>
        <div className="flex h-screen bg-gray-50">
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">{children}</div>
          </main>
        </div>
      </LawyerOnlyGuard>
    </AuthProvider>
  );
}
