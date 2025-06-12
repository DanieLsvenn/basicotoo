"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  getTemplateContent,
  getTemplateName,
} from "@/components/DocumentTemplates";

const DynamicEditor = dynamic(() => import("@/components/DynamicEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] bg-gray-100 animate-pulse rounded"></div>
  ),
});

export default function Page() {
  const router = useRouter();
  const { documentSlug } = useParams<{ documentSlug: string }>();
  const [tokens, setTokens] = useState<number | null>(null);
  const [content, setContent] = useState("");

  useEffect(() => {
    // Safe localStorage access
    if (typeof window !== "undefined") {
      const tokenCount = Number(localStorage.getItem("userTokens") || "50");
      setTokens(tokenCount);
    }

    const defaultTemplate = getTemplateContent(documentSlug);
    setContent(defaultTemplate);
  }, [documentSlug]);

  const handleBuyNow = () => {
    if (tokens !== null) {
      if (tokens >= 15) {
        router.push(`/buy?document=${documentSlug}`);
      } else {
        router.push("/buy-tickets");
      }
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 capitalize">
        {getTemplateName(documentSlug)}
      </h1>

      <DynamicEditor content={content} onContentChange={setContent} />

      <button
        onClick={handleBuyNow}
        disabled={tokens === null}
        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {tokens === null ? "Checking..." : "Buy Now"}
      </button>
    </div>
  );
}
