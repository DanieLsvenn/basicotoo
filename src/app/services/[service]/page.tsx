"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Loader2, ArrowLeft, AlertTriangle } from "lucide-react";
import { MaxWidthWrapper } from "@/components/max-width-wrapper";
import AnimatedContent from "@/components/ui/animatedcontent";

// Helper to generate the slug from the service name
function getUrl(serviceName: string) {
  return serviceName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Optional: Helper to get a service image (customize as needed)
function getServiceImage(serviceName: string) {
  if (serviceName.toLowerCase().includes("in-house")) return "/assets/InHouseLawyerServices.png";
  if (serviceName.toLowerCase().includes("taxes")) return "/assets/TaxesCorporateFinance.png";
  if (serviceName.toLowerCase().includes("intellectual")) return "/assets/IntellectualProperty.png";
  if (serviceName.toLowerCase().includes("corporate")) return "/assets/CorporateLegalServices.png";
  if (serviceName.toLowerCase().includes("banking") || serviceName.toLowerCase().includes("finance")) return "/assets/BankingFinance.png";
  if (serviceName.toLowerCase().includes("insurance")) return "/assets/Insurance.png";
  return "/assets/ServiceImagePool/1.png";
}

interface Service {
  serviceId: string;
  serviceName: string;
  serviceDescription: string;
  status: "Active" | "Inactive";
}

export default function UserServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceSlug = params.service as string;
  const [service, setService] = useState<Service>();
  const [loading, setLoading] = useState(true);

  const fetchService = useCallback(async () => {
    setLoading(true);
    if (!serviceSlug) return;
    try {
      const response = await fetch("https://localhost:7218/api/Service");
      const data: Service[] = await response.json();
      const found = data.find((s) => getUrl(s.serviceName) === serviceSlug);
      setService(found);
    } catch (error) {
      setService(undefined);
      console.error("Failed to fetch service:", error);
    } finally {
      setLoading(false);
    }
  }, [serviceSlug]);

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  return (
    <MaxWidthWrapper>
      <div className="flex flex-col items-center justify-center min-h-[75vh] w-full">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 transition-colors duration-500"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Services</span>
        </button>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center w-full">
            <Loader2 className="h-20 w-20 animate-spin mb-4 text-gray-400" />
            <span className="text-2xl font-semibold">Loading service details...</span>
          </div>
        )}

        {/* Error State */}
        {!loading && !service && (
          <div className="flex flex-col items-center justify-center w-full">
            <AlertTriangle className="h-16 w-16 text-red-400 mb-4" />
            <span className="text-2xl font-semibold mb-2">Cannot fetch service details</span>
            <span className="text-gray-500">Please try again later or contact support.</span>
          </div>
        )}

        {/* Service Card */}
        {!loading && service && (
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl w-full mx-auto transition-all duration-500 animate-fade-in">
              <img
                src={getServiceImage(service.serviceName)}
                alt={service.serviceName}
                className="w-full h-56 object-cover rounded-lg mb-6"
              />
              <h1 className="text-3xl font-bold mb-4">{service.serviceName}</h1>
              <p className="mb-6 text-gray-700 text-lg">{service.serviceDescription}</p>
              <div className="text-sm text-gray-400">Service ID: {service.serviceId}</div>
            </div>
        )}
      </div>
      {/* Simple fade-in animation */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.6s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px);}
          to { opacity: 1; transform: translateY(0);}
        }
      `}</style>
    </MaxWidthWrapper>
  );
}