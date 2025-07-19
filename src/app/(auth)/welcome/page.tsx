"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const Page = () => {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard after a short delay
    const timer = setTimeout(() => {
      router.replace("/dashboard");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome{user?.fullName ? `, ${user.fullName}` : ""}!
        </h1>
        <p className="text-gray-600 mb-8">
          Your account has been successfully created.
        </p>
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm text-gray-500 mt-4">
          Redirecting to dashboard...
        </p>
      </div>
    </div>
  );
};

export default Page;
