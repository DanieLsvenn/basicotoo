"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Page = () => {
  const router = useRouter();
  const params = useParams();
  const serviceSlug = params.serviceSlug as string;

  const [tokens, setTokens] = useState<number | null>(null);

  useEffect(() => {
    const tokenCount = Number(localStorage.getItem("userTokens") || "50");
    setTokens(tokenCount);
  }, []);

  const handleBookNow = () => {
    if (tokens !== null) {
      if (tokens >= 15) {
        router.push(`/booking?service=${serviceSlug}`);
      } else {
        router.push("/buy-tickets");
      }
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Service: {serviceSlug}</h1>
      <p className="mb-6">Service details go here...</p>

      <button
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        onClick={handleBookNow}
        disabled={tokens === null}
      >
        {tokens === null ? "Checking..." : "Book Now"}
      </button>
    </div>
  );
};

export default Page;
