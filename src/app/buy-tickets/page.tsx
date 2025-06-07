"use client";

const page = () => {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Buy Tickets</h1>
      <p>
        You need more tokens to book this service. Please purchase tokens below.
      </p>
      <button className="mt-4 px-6 py-2 bg-green-600 text-white rounded">
        Buy 50 Tokens
      </button>
    </div>
  );
};
export default page;
