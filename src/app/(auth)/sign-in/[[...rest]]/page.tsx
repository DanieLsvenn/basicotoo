"use client";

import { SignInForm } from "@/components/auth/sign-in-form";

const Page = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <SignInForm />
    </div>
  );
};

export default Page;
