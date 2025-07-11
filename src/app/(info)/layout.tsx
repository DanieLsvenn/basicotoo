import { ReactNode } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AuthProvider } from "@/lib/auth-context";
import { BlockLawyerAndStaffGuardAllowGuest } from "@/lib/auth-guard";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      <BlockLawyerAndStaffGuardAllowGuest>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
      </BlockLawyerAndStaffGuardAllowGuest>
    </AuthProvider>
  );
};

export default Layout;
