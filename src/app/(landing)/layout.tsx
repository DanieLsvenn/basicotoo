import { ReactNode } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AuthProvider } from "@/lib/auth-context";
import { BlockEmployeeAllowGuestGuard } from "@/lib/auth-guard";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      <BlockEmployeeAllowGuestGuard>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
      </BlockEmployeeAllowGuestGuard>
    </AuthProvider>
  );
};

export default Layout;
