"use client";

import { SignUpForm } from "@/components/auth/sign-up-form";

const Page = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <SignUpForm />
    </div>
  );
};

export default Page;
