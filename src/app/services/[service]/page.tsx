//src/app/services/[service]/page.tsx

"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Loader2, ArrowLeft, AlertTriangle, Star, DollarSign, User } from "lucide-react";
import { MaxWidthWrapper } from "@/components/max-width-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";

// Helper to generate the slug from the service name
function getServiceSlug(serviceName: string): string {
  return serviceName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Helper to get a service image
function getServiceImage(serviceName: string): string {
  const imageMap: { [key: string]: string } = {
    "in-house": "/assets/InHouseLawyerServices.png",
    "taxes": "/assets/TaxesCorporateFinance.png",
    "intellectual": "/assets/IntellectualProperty.png",
    "corporate": "/assets/CorporateLegalServices.png",
    "banking": "/assets/BankingFinance.png",
    "finance": "/assets/BankingFinance.png",
    "insurance": "/assets/Insurance.png",
  };

  const serviceLower = serviceName.toLowerCase();
  for (const [key, image] of Object.entries(imageMap)) {
    if (serviceLower.includes(key)) {
      return image;
    }
  }
  return "/assets/ServiceImagePool/1.png";
}

// Helper to get initials from name
function getInitials(name: string): string {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Helper to format price
function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
}

interface Service {
  serviceId: string;
  serviceName: string;
  serviceDescription: string;
  status: "Active" | "Inactive";
}

interface Lawyer {
  lawyerId: string;
  fullName: string;
  email: string;
  phone: string;
  image: string;
  pricePerHour: number;
}

interface LawyerCardProps {
  lawyer: Lawyer;
  serviceId: string;
  serviceName: string;
}

function LawyerCard({ lawyer, serviceId, serviceName }: LawyerCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-blue-200">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <Avatar className="h-16 w-16 border-2 border-gray-100">
            <AvatarImage src={lawyer.image} alt={lawyer.fullName} />
            <AvatarFallback className="text-lg font-semibold bg-blue-50 text-blue-600">
              {getInitials(lawyer.fullName)}
            </AvatarFallback>
          </Avatar>

          {/* Lawyer Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
              {lawyer.fullName}
            </h3>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-2" />
                <span className="truncate">{lawyer.email}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">📞</span>
                <span>{lawyer.phone}</span>
              </div>
            </div>

            {/* Price and Rating */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-lg font-semibold text-green-600">
                  {formatPrice(lawyer.pricePerHour)}/hour
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-gray-600">4.8 (32 reviews)</span>
              </div>
            </div>

            {/* Book Button */}
            <div className="mt-4">
              <Link href={`/booking/${serviceId}/${lawyer.lawyerId}`}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 transition-colors">
                  Book Consultation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UserServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceSlug = params.service as string;
  
  const [service, setService] = useState<Service | null>(null);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [lawyersLoading, setLawyersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchService = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    if (!serviceSlug) {
      setError("Service not found");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("https://localhost:7218/api/Service");
      if (!response.ok) {
        throw new Error(`Failed to fetch services: ${response.status}`);
      }
      
      const data: Service[] = await response.json();
      const foundService = data.find((s) => getServiceSlug(s.serviceName) === serviceSlug);
      
      if (!foundService) {
        throw new Error("Service not found");
      }
      
      setService(foundService);
    } catch (error) {
      console.error("Failed to fetch service:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [serviceSlug]);

  const fetchLawyers = useCallback(async (serviceId: string) => {
    setLawyersLoading(true);
    
    try {
      const response = await fetch(`https://localhost:7218/api/Lawyer/service/${serviceId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch lawyers: ${response.status}`);
      }
      
      const data: Lawyer[] = await response.json();
      setLawyers(data);
    } catch (error) {
      console.error("Failed to fetch lawyers:", error);
      setLawyers([]);
    } finally {
      setLawyersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  useEffect(() => {
    if (service) {
      fetchLawyers(service.serviceId);
    }
  }, [service, fetchLawyers]);

  const handleRetry = () => {
    fetchService();
  };

  if (loading) {
    return (
      <MaxWidthWrapper>
        <div className="flex flex-col items-center justify-center min-h-[75vh]">
          <Loader2 className="h-12 w-12 animate-spin mb-4 text-blue-600" />
          <span className="text-xl font-semibold">Loading service details...</span>
        </div>
      </MaxWidthWrapper>
    );
  }

  if (error || !service) {
    return (
      <MaxWidthWrapper>
        <div className="flex flex-col items-center justify-center min-h-[75vh]">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Services</span>
          </button>

          <AlertTriangle className="h-16 w-16 text-red-400 mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Service Not Found</h1>
          <p className="text-gray-500 mb-4">
            {error || "The service you're looking for doesn't exist."}
          </p>
          <Button onClick={handleRetry} variant="outline">
            Try Again
          </Button>
        </div>
      </MaxWidthWrapper>
    );
  }

  return (
    <MaxWidthWrapper>
      <div className="py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Services</span>
        </button>

        {/* Service Header */}
        <div className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1">
              <div className="relative h-64 w-full rounded-lg overflow-hidden">
                <Image
                  src={getServiceImage(service.serviceName)}
                  alt={service.serviceName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
              </div>
            </div>
            
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {service.serviceName}
                </h1>
              </div>
              
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                {service.serviceDescription}
              </p>
              
              <div className="text-sm text-gray-500">
                Service ID: {service.serviceId}
              </div>
            </div>
          </div>
        </div>

        {/* Lawyers Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Available Lawyers
              </h2>
              <p className="text-gray-600 mt-2">
                Choose from our qualified legal professionals
              </p>
            </div>
            
            {lawyers.length > 0 && (
              <Badge variant="outline" className="text-lg px-3 py-1">
                {lawyers.length} lawyer{lawyers.length !== 1 ? 's' : ''} available
              </Badge>
            )}
          </div>

          {/* Lawyers Grid */}
          {lawyersLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-600" />
              <p className="text-gray-500">Loading lawyers...</p>
            </div>
          ) : lawyers.length === 0 ? (
            <div className="text-center py-20">
              <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No lawyers available
              </h3>
              <p className="text-gray-500">
                There are currently no lawyers available for this service.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {lawyers.map((lawyer) => (
                <LawyerCard
                  key={lawyer.lawyerId}
                  lawyer={lawyer}
                  serviceId={service.serviceId}
                  serviceName={service.serviceName}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </MaxWidthWrapper>
  );
}