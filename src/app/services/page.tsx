"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { MaxWidthWrapper } from "@/components/max-width-wrapper";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Link from "next/link";
import { assets } from "../../../public/assets/assets";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Autoplay from "embla-carousel-autoplay";
import { Loader2 } from "lucide-react";

const services = [
  {
    name: "In-house Lawyer Services",
    slug: "in-house-lawyer-services",
    image: "/assets/InHouseLawyerServices.png",
    description: "Expert advice from top-tier legal professionals.",
  },
  {
    name: "Taxes, Corporate Finance",
    slug: "taxes-corporate-finance",
    image: "/assets/TaxesCorporateFinance.png",
    description: "Ensure your contracts are legally sound and risk-free.",
  },
  {
    name: "Intellectual property",
    slug: "intellectual-property",
    image: "/assets/IntellectualProperty.png",
    description: "Manage all your legal cases in one secure dashboard.",
  },
  {
    name: "Corporate Legal Services",
    slug: "corporate-legal-services",
    image: "/assets/CorporateLegalServices.png",
    description: "Custom legal documents drafted by experts.",
  },
  {
    name: "Banking and finance",
    slug: "banking-finance",
    image: "/assets/BankingFinance.png",
    description: "Book appointments with qualified lawyers easily.",
  },
  {
    name: "Insurance",
    slug: "insurance",
    image: "/assets/Insurance.png",
    description: "Stay on top of legal obligations for your business.",
  },
];

const documentations = [
  {
    name: "Divorce Petition",
    slug: "divorce-petition",
    image: "/assets/DivorcePetition.png",
    description: "A divorce settlement template.",
  },
  {
    name: "Lease Agreement",
    slug: "lease-agreement",
    image: "/assets/LeaseAgreement.png",
    description: "Lease agreement template.",
  },
  {
    name: "Last Will and Testament",
    slug: "last-will-testament",
    image: "/assets/LastWillTestament.png",
    description: "Last will and testament template.",
  },
];

interface Service {
  serviceId: string;
  serviceName: string;
  serviceDescription: string;
  status: "Active" | "Inactive";
}

const API_URL = "https://localhost:7218/api/Service";

// Fixed image mapping for service types
const SERVICE_IMAGE_MAP: { keyword: string; image: string }[] = [
  { keyword: "In-house", image: "/assets/InHouseLawyerServices.png" },
  { keyword: "Taxes", image: "/assets/TaxesCorporateFinance.png" },
  { keyword: "Corporate Finance", image: "/assets/TaxesCorporateFinance.png" },
  { keyword: "Intellectual Property", image: "/assets/IntellectualProperty.png" },
  { keyword: "Corporate Legal", image: "/assets/CorporateLegalServices.png" },
  { keyword: "Banking", image: "/assets/BankingFinance.png" },
  { keyword: "Finance", image: "/assets/BankingFinance.png" },
  { keyword: "Insurance", image: "/assets/Insurance.png" },
];

// Fallback random images
const RANDOM_SERVICE_IMAGES = [
  "/assets/ServiceImagePool/1.png",
  "/assets/ServiceImagePool/2.png",
  "/assets/ServiceImagePool/3.png",
  "/assets/ServiceImagePool/4.png",
];

// Helper to get image for a service name
function getServiceImage(serviceName: string) {
  for (const { keyword, image } of SERVICE_IMAGE_MAP) {
    if (serviceName.toLowerCase().includes(keyword.toLowerCase())) {
      return image;
    }
  }
  // If no keyword matched, pick a random fallback image
  const idx = Math.floor(Math.random() * RANDOM_SERVICE_IMAGES.length);
  return RANDOM_SERVICE_IMAGES[idx];
}

// Helper to generate a user-friendly URL slug from the service name
function getUrl(serviceName: string) {
  return serviceName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric except space and dash
    .replace(/\s+/g, "-")         // Replace spaces with dashes
    .replace(/-+/g, "-")          // Replace multiple dashes with single dash
    .replace(/^-+|-+$/g, "");     // Trim leading/trailing dashes
}

function ServiceLink({ service }: { service: Service }) {
  const [expanded, setExpanded] = useState(false);
  const maxLength = 80; // Number of characters to show before "Read more"
  const shortDesc = service.serviceDescription.slice(0, maxLength);

  return (
    <Link
      key={service.serviceId}
      href={`/services/${getUrl(service.serviceName)}`}
      className="border rounded-lg overflow-hidden hover:shadow-lg transition group"
    >
      <div className="relative h-48 w-full">
        <Image
          src={getServiceImage(service.serviceName)}
          alt={service.serviceName}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2">{service.serviceName}</h2>
        <p className="text-gray-600 text-sm">
          {expanded ? service.serviceDescription : `${shortDesc}... `}
          <button
            type="button"
            className={`text-gray-400 hover:underline hover:text-gray-700 transition-colors duration-500${expanded ? " ml-1" : ""}`}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setExpanded(prev => !prev);
            }}
          >
            {expanded ? "Read less" : "Read more"}
          </button>
        </p>
      </div>
    </Link>
  );
}

export default function UserServicesPage() {
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [services, setServices] = useState<Service[]>([]);

  const autoplay = Autoplay({ delay: 4000, stopOnInteraction: true });

  // --- LOGIC METHODS ---

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch services");
      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.error("Failed to fetch services", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- EFFECTS ---

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // --- RENDER ---

  return (
    <>
      <div className="relative h-64 md:h-80 lg:h-[500px]">
        <Image
          src={assets.Services}
          alt="Services"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60 flex flex-col items-start justify-center px-6 md:px-16 text-white">
          <h2 className="text-2xl md:text-3xl font-bold uppercase mb-2">
            Need counseling for your everything?
          </h2>
          <p className="text-base md:text-lg mb-4">
            <span className="text-white font-bold italic">BASICOTOO</span> -
            accompanies customers in every step of the way.
          </p>
        </div>
      </div>
      <MaxWidthWrapper>
        <div className="p-8 max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-10 text-center">Our Services</h1>
          <div className="text-xl italic mb-10 text-center">
            BASICOTOO provides a wide range of comprehensive legal services
            across all areas of core business activities.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-full text-center text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                Loading services...
              </div>
            ) : (
              services
                .filter(service => service.status === "Active")
                .map(service => (
                  <ServiceLink key={service.serviceId} service={service} />
                ))
            )}
          </div>

          <h1 className="text-4xl font-bold mb-10 text-center mt-20">
            Our Documentations
          </h1>
          <div className="text-xl italic mb-10 text-center">
            BASICOTOO provides official documentations for your legal needs.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-full text-center text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                Loading documentations...
              </div>
            ) : (
              documentations.map((doc) => (
                <Link
                  key={doc.slug}
                  href={`/documents/${doc.slug}`}
                  className="border rounded-lg overflow-hidden hover:shadow-lg transition group"
                >
                  <div className="relative h-48 w-full">
                    <Image
                      src={doc.image}
                      alt={doc.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="p-4">
                    <h2 className="text-xl font-semibold mb-2">{doc.name}</h2>
                    <p className="text-gray-600 text-sm">{doc.description}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </MaxWidthWrapper>
    </>
  );
}