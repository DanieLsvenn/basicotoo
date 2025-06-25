"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  ArrowLeft,
  AlertTriangle,
  Star,
  DollarSign,
  User,
  FileText,
  Download,
  Eye,
} from "lucide-react";
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
    taxes: "/assets/TaxesCorporateFinance.png",
    intellectual: "/assets/IntellectualProperty.png",
    corporate: "/assets/CorporateLegalServices.png",
    banking: "/assets/BankingFinance.png",
    finance: "/assets/BankingFinance.png",
    insurance: "/assets/Insurance.png",
  };

  const serviceLower = serviceName.toLowerCase();
  for (const [key, image] of Object.entries(imageMap)) {
    if (serviceLower.includes(key)) {
      return image;
    }
  }
  return "/assets/ServiceImagePool/1.png";
}

// Helper to get form template image
function getPlaceholderImage(templateName: string): string {
  const name = templateName.toLowerCase();
  if (name.includes("divorce")) return "/assets/DivorcePetition.png";
  if (name.includes("lease") || name.includes("rental"))
    return "/assets/LeaseAgreement.png";
  if (name.includes("will") || name.includes("testament"))
    return "/assets/LastWillTestament.png";
  if (name.includes("contract")) return "/assets/Contract.png";
  if (name.includes("agreement")) return "/assets/Agreement.png";
  return "/assets/DefaultDocument.png";
}

// Helper to get initials from name
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Helper to format price
function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

interface Service {
  serviceId: string;
  serviceName: string;
  serviceDescription: string;
  status: "Active" | "Inactive";
}

interface FormTemplate {
  formTemplateId?: string;
  id?: string;
  serviceId: string;
  formTemplateName: string;
  formTemplateData: string;
  status?: string;
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

interface FormTemplateCardProps {
  template: FormTemplate;
}

function FormTemplateCard({ template }: FormTemplateCardProps) {
  const getTemplateId = (template: FormTemplate): string => {
    return template.formTemplateId || template.id || template.serviceId;
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

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-blue-200">
      <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
        <img
          src={getPlaceholderImage(template.formTemplateName)}
          alt={template.formTemplateName}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/assets/DefaultDocument.png";
          }}
        />
      </div>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {template.formTemplateName}
          </h3>
          {template.status && (
            <Badge
              variant={
                template.status.toLowerCase() === "active"
                  ? "default"
                  : "secondary"
              }
            >
              {template.status}
            </Badge>
          )}
        </div>

        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
          {getPredefinedDescription(template.formTemplateName)}
        </p>

        <div className="text-xs text-gray-500 mb-4">
          Template ID: {getTemplateId(template)}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              // View template content in a modal or new page
              window.open(
                `/templates/view/${getTemplateId(template)}`,
                "_blank"
              );
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              // Download or use template
              window.open(
                `/templates/download/${getTemplateId(template)}`,
                "_blank"
              );
            }}
          >
            <Download className="h-4 w-4 mr-1" />
            Use Template
          </Button>
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
  const [formTemplate, setFormTemplate] = useState<FormTemplate | null>(null);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [lawyersLoading, setLawyersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentType, setContentType] = useState<"service" | "template">(
    "service"
  );

  const fetchServiceOrTemplate = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!serviceSlug) {
      setError("Service not found");
      setLoading(false);
      return;
    }

    try {
      // First, try to fetch from services
      const serviceResponse = await fetch("https://localhost:7218/api/Service");
      if (serviceResponse.ok) {
        const serviceData: Service[] = await serviceResponse.json();
        const foundService = serviceData.find(
          (s) => getServiceSlug(s.serviceName) === serviceSlug
        );

        if (foundService) {
          setService(foundService);
          setContentType("service");
          setLoading(false);
          return;
        }
      }

      // If not found in services, try form templates
      const templateResponse = await fetch(
        "https://localhost:7276/api/templates-active"
      );
      if (templateResponse.ok) {
        const templateData: FormTemplate[] = await templateResponse.json();
        const foundTemplate = templateData.find(
          (t) => getServiceSlug(t.formTemplateName) === serviceSlug
        );

        if (foundTemplate) {
          setFormTemplate(foundTemplate);
          setContentType("template");
          setLoading(false);
          return;
        }
      }

      // If neither found, throw error
      throw new Error("Service or template not found");
    } catch (error) {
      console.error("Failed to fetch service or template:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [serviceSlug]);

  const fetchLawyers = useCallback(async (serviceId: string) => {
    setLawyersLoading(true);

    try {
      const response = await fetch(
        `https://localhost:7218/api/Lawyer/service/${serviceId}`
      );
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
    fetchServiceOrTemplate();
  }, [fetchServiceOrTemplate]);

  useEffect(() => {
    if (service && contentType === "service") {
      fetchLawyers(service.serviceId);
    }
  }, [service, contentType, fetchLawyers]);

  const handleRetry = () => {
    fetchServiceOrTemplate();
  };

  if (loading) {
    return (
      <MaxWidthWrapper>
        <div className="flex flex-col items-center justify-center min-h-[75vh]">
          <Loader2 className="h-12 w-12 animate-spin mb-4 text-blue-600" />
          <span className="text-xl font-semibold">Loading details...</span>
        </div>
      </MaxWidthWrapper>
    );
  }

  if (error || (!service && !formTemplate)) {
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
          <h1 className="text-2xl font-semibold mb-2">Content Not Found</h1>
          <p className="text-gray-500 mb-4">
            {error ||
              "The service or template you're looking for doesn't exist."}
          </p>
          <Button onClick={handleRetry} variant="outline">
            Try Again
          </Button>
        </div>
      </MaxWidthWrapper>
    );
  }

  // Render form template view
  if (contentType === "template" && formTemplate) {
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

          {/* Template Header */}
          <div className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-1">
                <div className="relative h-64 w-full rounded-lg overflow-hidden">
                  <img
                    src={getPlaceholderImage(formTemplate.formTemplateName)}
                    alt={formTemplate.formTemplateName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/assets/DefaultDocument.png";
                    }}
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    {formTemplate.formTemplateName}
                  </h1>
                  {formTemplate.status && (
                    <Badge
                      variant={
                        formTemplate.status.toLowerCase() === "active"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {formTemplate.status}
                    </Badge>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Template Content
                    </h3>
                    <div className="border rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto">
                      <div
                        dangerouslySetInnerHTML={{
                          __html:
                            formTemplate.formTemplateData ||
                            "<p>No content available</p>",
                        }}
                        className="prose prose-sm max-w-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Service ID: {formTemplate.serviceId}</span>
                    <span>•</span>
                    <span>
                      Template ID:{" "}
                      {formTemplate.formTemplateId || formTemplate.id}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-6">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      // Implement template download/use functionality
                      window.open(
                        `/templates/download/${
                          formTemplate.formTemplateId || formTemplate.id
                        }`,
                        "_blank"
                      );
                    }}
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Use This Template
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      // Implement template preview functionality
                      window.open(
                        `/templates/preview/${
                          formTemplate.formTemplateId || formTemplate.id
                        }`,
                        "_blank"
                      );
                    }}
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    Full Preview
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MaxWidthWrapper>
    );
  }

  // Render service view (existing code)
  if (contentType === "service" && service) {
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
                  {lawyers.length} lawyer{lawyers.length !== 1 ? "s" : ""}{" "}
                  available
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

  return null;
}
