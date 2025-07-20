//src/app/services/page.tsx

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MaxWidthWrapper } from "@/components/max-width-wrapper";
import Link from "next/link";
import Image from "next/image";
import { Search, Loader2 } from "lucide-react";
import { assets } from "../../../public/assets/assets";
import { apiFetch, API_ENDPOINTS } from "@/lib/api-utils";

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

// Template image mapping
const TEMPLATE_IMAGE_MAP: { [key: string]: string } = {
  divorce: "/assets/DivorcePetition.png",
  petition: "/assets/DivorcePetition.png",
  lease: "/assets/LeaseAgreement.png",
  rental: "/assets/LeaseAgreement.png",
  will: "/assets/LastWillTestament.png",
  testament: "/assets/LastWillTestament.png",
  contract: "/assets/Contract.png",
  agreement: "/assets/Agreement.png",
  "li hôn": "/assets/DivorcePetition.png",
  "hợp đồng": "/assets/Contract.png",
};

// Template descriptions
const TEMPLATE_DESCRIPTIONS: { [key: string]: string } = {
  divorce: "Legal document template for divorce proceedings and petition filing.",
  petition: "Official petition template for legal requests and formal applications.",
  contract: "Professional contract template for business and legal agreements.",
  agreement: "Comprehensive agreement template for various legal arrangements.",
  will: "Last will and testament template for estate planning and inheritance.",
  lease: "Rental and lease agreement template for property transactions.",
  "power of attorney": "Legal authorization document template for representative appointments.",
  employment: "Employment contract and agreement templates for workplace arrangements.",
  partnership: "Business partnership agreement template for collaborative ventures.",
  incorporation: "Business incorporation and registration document templates.",
  trademark: "Intellectual property and trademark registration templates.",
  loan: "Loan agreement and financial document templates.",
  confidentiality: "Non-disclosure and confidentiality agreement templates.",
  settlement: "Legal settlement and resolution document templates.",
  "li hôn": "Mẫu tài liệu pháp lý cho thủ tục li hôn và đơn khởi kiện.",
  "hợp đồng": "Mẫu hợp đồng chuyên nghiệp cho các thỏa thuận kinh doanh và pháp lý.",
  đơn: "Mẫu đơn chính thức cho các yêu cầu pháp lý và đơn xin.",
};

export default function UserServicesPage() {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [templatesSearchTerm, setTemplatesSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  // --- HELPER METHODS ---

  const getServiceImage = (serviceName: string): string => {
    for (const { keyword, image } of SERVICE_IMAGE_MAP) {
      if (serviceName.toLowerCase().includes(keyword.toLowerCase())) {
        return image;
      }
    }
    const idx = Math.floor(Math.random() * RANDOM_SERVICE_IMAGES.length);
    return RANDOM_SERVICE_IMAGES[idx];
  };

  const getServiceSlug = (serviceName: string): string => {
    return serviceName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const getTemplateImage = (templateName: string): string => {
    const name = templateName.toLowerCase();
    for (const [key, image] of Object.entries(TEMPLATE_IMAGE_MAP)) {
      if (name.includes(key)) {
        return image;
      }
    }
    return "/assets/DefaultDocument.png";
  };

  const getTemplateDescription = (templateName: string): string => {
    const name = templateName.toLowerCase();
    for (const [key, description] of Object.entries(TEMPLATE_DESCRIPTIONS)) {
      if (name.includes(key)) {
        return description;
      }
    }
    return "Professional legal document template for your business needs.";
  };

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

  // --- API METHODS ---

  const fetchServices = useCallback(async () => {
    try {
      const response = await apiFetch(API_ENDPOINTS.SERVICE.BASE);
      if (!response.data) {
        throw new Error(response.error || "Failed to fetch services");
      }
      setServices(response.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch services", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }, []);

  const fetchFormTemplates = useCallback(async () => {
    try {
      const response = await apiFetch(API_ENDPOINTS.FORM.TEMPLATES_ACTIVE);
      if (!response.data) {
        throw new Error(response.error || "Failed to fetch form templates");
      }
      setFormTemplates(response.data);
      setTemplatesError(null);
    } catch (err) {
      console.error("Error fetching form templates:", err);
      setTemplatesError(err instanceof Error ? err.message : "Failed to fetch form templates");
      setFormTemplates([]);
    }
  }, []);

  // --- EFFECTS ---

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchServices(), fetchFormTemplates()]);
      setLoading(false);
    };
    fetchData();
  }, [fetchServices, fetchFormTemplates]);

  // --- MEMOIZED FILTERS ---

  const filteredServices = useMemo(
    () =>
      services
        .filter((service) => service.status === "Active")
        .filter((service) =>
          service.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
        ),
    [services, searchTerm]
  );

  const filteredTemplates = useMemo(
    () =>
      formTemplates.filter((template) =>
        template.formTemplateName.toLowerCase().includes(templatesSearchTerm.toLowerCase())
      ),
    [formTemplates, templatesSearchTerm]
  );

  // --- COMPONENTS ---

  const ServiceLink = ({ service }: { service: Service }) => {
    const [expanded, setExpanded] = useState(false);
    const maxLength = 100;
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
                className="ml-2 text-blue-600 hover:text-blue-800 hover:underline transition-colors font-medium"
                onClick={handleToggleExpand}
              >
                {expanded ? "Read less" : "Read more"}
              </button>
            )}
          </p>
        </div>
      </Link>
    );
  };

  const TemplateLink = ({ template }: { template: FormTemplate }) => {
    const templateId = getTemplateId(template);
    const slug = generateSlug(template.formTemplateName);

    return (
      <Link
        key={templateId}
        href={`/services/${slug}`}
        className="group block border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-blue-200"
      >
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={getTemplateImage(template.formTemplateName)}
            alt={template.formTemplateName}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/assets/DefaultDocument.png";
            }}
          />
        </div>
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-3 group-hover:text-blue-600 transition-colors">
            {template.formTemplateName}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {getTemplateDescription(template.formTemplateName)}
          </p>
        </div>
      </Link>
    );
  };

  // --- RENDER COMPONENT ---

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
        <div className="py-12 px-4 space-y-16">
          {/* Services Section */}
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Services</h2>
              <p className="text-lg md:text-xl text-gray-600 italic max-w-4xl mx-auto">
                BASICOTOO provides a wide range of comprehensive legal services
                across all areas of core business activities.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Available Services</CardTitle>
                <CardDescription>Browse our comprehensive legal services</CardDescription>
                <div className="relative max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin mb-4" />
                    <p className="text-sm text-muted-foreground">Loading services...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <p className="text-red-500 mb-4">Error: {error}</p>
                    <Button onClick={fetchServices} variant="outline">
                      Try Again
                    </Button>
                  </div>
                ) : filteredServices.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-sm text-muted-foreground">
                      {searchTerm ? "No services found matching your search." : "No services available at the moment."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredServices.map((service) => (
                      <ServiceLink key={service.serviceId} service={service} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Documentation Section */}
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Documentation</h2>
              <p className="text-lg md:text-xl text-gray-600 italic max-w-4xl mx-auto">
                BASICOTOO provides official documentation for your legal needs.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Document Templates</CardTitle>
                <CardDescription>Professional legal document templates</CardDescription>
                <div className="relative max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={templatesSearchTerm}
                    onChange={(e) => setTemplatesSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin mb-4" />
                    <p className="text-sm text-muted-foreground">Loading templates...</p>
                  </div>
                ) : templatesError ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <p className="text-red-500 mb-4">Error: {templatesError}</p>
                    <Button onClick={fetchFormTemplates} variant="outline">
                      Try Again
                    </Button>
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-sm text-muted-foreground">
                      {templatesSearchTerm ? "No templates found matching your search." : "No templates available at the moment."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map((template) => (
                      <TemplateLink key={getTemplateId(template)} template={template} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </MaxWidthWrapper>
    </>
  );
}