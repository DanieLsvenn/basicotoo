// app/welcome/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import axios from "axios";

const Page = () => {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    const syncToBackend = async () => {
      if (!user) return;

      try {
        // Call your backend register/login API
        const res = await axios.post("http://localhost:5144/api/register", {
          accountUsername:
            user.username || user.emailAddresses[0].emailAddress.split("@")[0],
          accountPassword: "defaultPassword123", // You might want to handle this better
          confirmPassword: "defaultPassword123",
          accountEmail: user.emailAddresses[0].emailAddress,
          accountFullName: `${user.firstName ?? ""} ${user.lastName ?? ""}`,
          accountGender: 0, // Default; adjust if needed
        });

        // Optional: Get profile or token
        // const profile = await axios.get("http://localhost:5144/api/profile");

        router.replace("/");
      } catch (err) {
        console.error("Backend sync failed", err);
        router.replace("/");
      }
    };

    syncToBackend();
  }, [user]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Syncing your account...</p>
    </div>
  );
};

export default Page;
