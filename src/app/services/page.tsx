"use client";

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
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";

// Keep your existing services array
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

// Interface for form templates from your API
interface FormTemplate {
  formTemplateId?: string;
  id?: string;
  serviceId: string;
  formTemplateName: string;
  formTemplateData: string;
  status?: string;
}

const Page = () => {
  const autoplay = Autoplay({ delay: 4000, stopOnInteraction: true });
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch form templates from API
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

  // Helper function to get template ID (same as in your dashboard)
  const getTemplateId = (template: FormTemplate): string => {
    return template.formTemplateId || template.id || template.serviceId;
  };

  // Helper function to generate slug from template name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .trim();
  };

  // Helper function to get a placeholder image based on template type
  const getPlaceholderImage = (templateName: string): string => {
    const name = templateName.toLowerCase();

    // You can customize these based on your actual template types
    if (name.includes("divorce")) return "/assets/DivorcePetition.png";
    if (name.includes("lease") || name.includes("rental"))
      return "/assets/LeaseAgreement.png";
    if (name.includes("will") || name.includes("testament"))
      return "/assets/LastWillTestament.png";
    if (name.includes("contract")) return "/assets/Contract.png";
    if (name.includes("agreement")) return "/assets/Agreement.png";

    // Default placeholder
    return "";
  };

  // Helper function to get predefined descriptions based on template name
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
            {services.map((service) => (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition group"
              >
                <img
                  src={service.image}
                  alt={service.name}
                  className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2">{service.name}</h2>
                  <p className="text-gray-600 text-sm">{service.description}</p>
                </div>
              </Link>
            ))}
          </div>

          <h1 className="text-4xl font-bold mb-10 text-center mt-20">
            Our Documentations
          </h1>
          <div className="text-xl italic mb-10 text-center">
            BASICOTOO provides official documentations for your legal needs.
          </div>

          {/* Loading State */}
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

          {/* Form Templates Grid */}
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
};

export default Page;
