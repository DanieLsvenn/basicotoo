//src/app/services/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import { MaxWidthWrapper } from "@/components/max-width-wrapper";
import Link from "next/link";
import { assets } from "../../../public/assets/assets";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormTemplate {
  formTemplateId?: string;
  id?: string;
  serviceId: string;
  formTemplateName: string;
  formTemplateData: string;
  status?: string;
}

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
  {
    keyword: "Intellectual Property",
    image: "/assets/IntellectualProperty.png",
  },
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
function getServiceImage(serviceName: string): string {
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
function getServiceSlug(serviceName: string): string {
  return serviceName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric except space and dash
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .replace(/-+/g, "-") // Replace multiple dashes with single dash
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing dashes
}

interface ServiceLinkProps {
  service: Service;
}

function ServiceLink({ service }: ServiceLinkProps) {
  const [expanded, setExpanded] = useState(false);
  const maxLength = 100; // Number of characters to show before "Read more"
  const shouldTruncate = service.serviceDescription.length > maxLength;
  const displayDescription =
    shouldTruncate && !expanded
      ? service.serviceDescription.slice(0, maxLength) + "..."
      : service.serviceDescription;

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  return (
    <Link
      href={`/services/${getServiceSlug(service.serviceName)}`}
      className="group block border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-blue-200"
    >
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={getServiceImage(service.serviceName)}
          alt={service.serviceName}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-3 group-hover:text-blue-600 transition-colors">
          {service.serviceName}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          {displayDescription}
          {shouldTruncate && (
            <button
              type="button"
              className="ml-2 text-gray-600 hover:text-gray-800 hover:underline transition-colors font-medium"
              onClick={handleToggleExpand}
            >
              {expanded ? "Read less" : "Read more"}
            </button>
          )}
        </p>
      </div>
    </Link>
  );
}

export default function UserServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFormTemplates = async () => {
      try {
        setLoading(true);
        setError(null);

        // Using the same API endpoint from your dashboard
        const response = await fetch(
          "https://localhost:7276/api/templates-active"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch form templates");
        }

        const data = await response.json();
        setFormTemplates(data);
      } catch (err) {
        console.error("Error fetching form templates:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch form templates"
        );
        // Fallback to empty array on error
        setFormTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFormTemplates();
  }, []);

  const getTemplateId = (template: FormTemplate): string => {
    return template.formTemplateId || template.id || template.serviceId;
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const getPlaceholderImage = (templateName: string): string => {
    const name = templateName.toLowerCase();
    if (name.includes("divorce")) return "/assets/DivorcePetition.png";
    if (name.includes("lease") || name.includes("rental"))
      return "/assets/LeaseAgreement.png";
    if (name.includes("will") || name.includes("testament"))
      return "/assets/LastWillTestament.png";
    if (name.includes("contract")) return "/assets/Contract.png";
    if (name.includes("agreement")) return "/assets/Agreement.png";

    return "";
  };

  const getPredefinedDescription = (templateName: string): string => {
    const name = templateName.toLowerCase();

    const descriptions = {
      divorce:
        "Legal document template for divorce proceedings and petition filing.",
      petition:
        "Official petition template for legal requests and formal applications.",
      contract:
        "Professional contract template for business and legal agreements.",
      agreement:
        "Comprehensive agreement template for various legal arrangements.",
      will: "Last will and testament template for estate planning and inheritance.",
      lease: "Rental and lease agreement template for property transactions.",
      "power of attorney":
        "Legal authorization document template for representative appointments.",
      employment:
        "Employment contract and agreement templates for workplace arrangements.",
      partnership:
        "Business partnership agreement template for collaborative ventures.",
      incorporation:
        "Business incorporation and registration document templates.",
      trademark: "Intellectual property and trademark registration templates.",
      loan: "Loan agreement and financial document templates.",
      confidentiality:
        "Non-disclosure and confidentiality agreement templates.",
      settlement: "Legal settlement and resolution document templates.",
      "li hôn": "Mẫu tài liệu pháp lý cho thủ tục li hôn và đơn khởi kiện.",
      "hợp đồng":
        "Mẫu hợp đồng chuyên nghiệp cho các thỏa thuận kinh doanh và pháp lý.",
      đơn: "Mẫu đơn chính thức cho các yêu cầu pháp lý và đơn xin.",
    };

    // Find matching description
    for (const [key, description] of Object.entries(descriptions)) {
      if (name.includes(key)) {
        return description;
      }
    }

    return "Professional legal document template for your business needs.";
  };

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) {
        throw new Error(`Failed to fetch services: ${res.status}`);
      }
      const data: Service[] = await res.json();
      setServices(data);
    } catch (err) {
      console.error("Failed to fetch services", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const activeServices = services.filter(
    (service) => service.status === "Active"
  );

  return (
    <>
      {/* Hero Section */}
      <div className="relative h-64 md:h-80 lg:h-[500px]">
        <Image
          src={assets.Services}
          alt="Legal Services"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60 flex flex-col items-start justify-center px-6 md:px-16 text-white">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold uppercase mb-4">
            Need counseling for your everything?
          </h1>
          <p className="text-base md:text-lg lg:text-xl mb-4 max-w-2xl">
            <span className="text-white font-bold italic">BASICOTOO</span>{" "}
            accompanies customers in every step of the way.
          </p>
        </div>
      </div>

      <MaxWidthWrapper>
        <div className="py-12 px-4">
          {/* Services Section */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Services
            </h2>
            <p className="text-lg md:text-xl text-gray-600 italic max-w-4xl mx-auto">
              BASICOTOO provides a wide range of comprehensive legal services
              across all areas of core business activities.
            </p>
          </div>

          {/* Services Grid */}
          <div className="mb-20">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-600" />
                <p className="text-gray-500">Loading services...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-red-500 mb-4">Error: {error}</p>
                <button
                  onClick={fetchServices}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : activeServices.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">
                  No services available at the moment.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {activeServices.map((service) => (
                  <ServiceLink key={service.serviceId} service={service} />
                ))}
              </div>
            )}
          </div>

          {/* Documentation Section */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Documentation
            </h2>
            <p className="text-lg md:text-xl text-gray-600 italic max-w-4xl mx-auto">
              BASICOTOO provides official documentation for your legal needs.
            </p>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-gray-600">Loading form templates...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12">
              <div className="mx-auto max-w-md">
                <h3 className="text-lg font-semibold mb-2 text-red-600">
                  Unable to load templates
                </h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              {formTemplates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {formTemplates.map((template) => {
                    const templateId = getTemplateId(template);
                    const slug = generateSlug(template.formTemplateName);

                    return (
                      <Link
                        key={templateId}
                        href={`/services/${slug}`}
                        className="border rounded-lg overflow-hidden hover:shadow-lg transition group"
                      >
                        <img
                          src={getPlaceholderImage(template.formTemplateName)}
                          alt={template.formTemplateName}
                          className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            // Fallback to a default image if the placeholder doesn't exist
                            (e.target as HTMLImageElement).src =
                              "/assets/DefaultDocument.png";
                          }}
                        />
                        <div className="p-4">
                          <h2 className="text-xl font-semibold mb-2">
                            {template.formTemplateName}
                          </h2>
                          <p className="text-gray-600 text-sm">
                            {getPredefinedDescription(
                              template.formTemplateName
                            )}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto max-w-md">
                    <h3 className="text-lg font-semibold mb-2">
                      No templates available
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Form templates will appear here once they are created in
                      the dashboard.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </MaxWidthWrapper>
    </>
  );
}
