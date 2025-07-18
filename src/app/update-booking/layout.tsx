import { ReactNode } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AuthProvider } from "@/lib/auth-context";
import { UserOnlyGuard } from "@/lib/auth-guard";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      <UserOnlyGuard>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
      </UserOnlyGuard>
    </AuthProvider>
  );
};

export default Layout;
