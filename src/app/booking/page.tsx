"use client";

import { useSearchParams } from "next/navigation";

const page = () => {
  const searchParams = useSearchParams();
  const service = searchParams.get("service");

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Booking for: {service}</h1>
      <p>Booking form or calendar UI goes here...</p>
    </div>
  );
};

export default page;
