"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  ArrowLeft,
  AlertTriangle,
  Star,
  User,
  FileText,
  Download,
  Eye,
  Phone,
} from "lucide-react";
import { MaxWidthWrapper } from "@/components/max-width-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import Cookies from "js-cookie";

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

interface PurchaseFormRequest {
  userId: string;
  totalPrice: number;
  orderDetails: {
    formTemplateId: string;
    quantity: number;
    price: number;
  }[];
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
            {/* Fix: Only render AvatarImage if lawyer.image exists and is not empty */}
            {lawyer.image && lawyer.image.trim() !== "" ? (
              <AvatarImage src={lawyer.image} alt={lawyer.fullName} />
            ) : null}
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
                <Phone className="h-4 w-4 mr-2" />
                <span>{lawyer.phone}</span>
              </div>
            </div>

            {/* Price and Rating */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
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
              <Link href={`/checkout/booking/${serviceId}/${lawyer.lawyerId}`}>
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
  template: FormTemplate & { price: number };
  userTickets: number;
  onPurchase: (templateId: string, price: number) => void;
}

function FormTemplateCard({
  template,
  userTickets,
  onPurchase,
}: FormTemplateCardProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Determine if the user can afford the template
  const canAfford = userTickets >= template.price;

  const getTemplateId = (template: FormTemplate): string => {
    const id = template.formTemplateId || template.id;

    if (!id) {
      console.error("Template missing ID:", template);
      throw new Error("Template ID is required for purchase");
    }

    return id;
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

  const handlePurchase = async () => {
    const templateId = getTemplateId(template);
    const templatePrice = template.price;

    console.log("FormTemplateCard handlePurchase:", {
      templateId,
      templatePrice,
      userTickets,
      canAfford,
      template,
    });

    if (userTickets < templatePrice) {
      toast.error("Insufficient tickets", {
        description: `You need ${templatePrice} tickets but only have ${userTickets}.`,
      });
      return;
    }

    setIsPurchasing(true);
    try {
      await onPurchase(templateId, templatePrice);
    } finally {
      setIsPurchasing(false);
    }
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
        {/* Price Badge */}
        <div className="absolute top-3 right-3">
          <Badge className="bg-green-600 text-white">
            {template.price} tickets
          </Badge>
        </div>
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
            className={`flex-1 ${canAfford
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
              }`}
            onClick={handlePurchase}
            disabled={!canAfford || isPurchasing}
          >
            {isPurchasing ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            {isPurchasing ? "Purchasing..." : `Buy (${template.price} tickets)`}
          </Button>
        </div>

        {!canAfford && (
          <p className="text-xs text-red-500 mt-2 text-center">
            Need {template.price - userTickets} more tickets
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Fixed purchaseFormTemplate function
export const purchaseFormTemplate = async (
  userId: string,
  formTemplateId: string,
  price: number
): Promise<boolean> => {
  try {
    const token = Cookies.get("authToken");

    if (!token) {
      toast.error("Authentication required", {
        description: "Please log in to purchase forms.",
      });
      return false;
    }

    if (!formTemplateId) {
      toast.error("Invalid template", {
        description: "Template ID is missing.",
      });
      return false;
    }

    // Additional validation and debugging
    console.log("Purchase inputs BEFORE validation:", {
      userId,
      formTemplateId,
      price,
      userIdType: typeof userId,
      priceType: typeof price,
      formTemplateIdType: typeof formTemplateId,
    });

    // Ensure price is a number and greater than 0
    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      console.error("Invalid price detected:", { price, numericPrice });
      toast.error("Invalid price", {
        description: `Template price is invalid. Received: ${price}`,
      });
      return false;
    }

    // Log the numeric price to ensure it's correct
    console.log("Numeric price after validation:", numericPrice);

    const purchaseRequest: PurchaseFormRequest = {
      userId: userId,
      totalPrice: numericPrice, // Make sure this uses the validated numeric price
      orderDetails: [
        {
          formTemplateId: formTemplateId,
          quantity: 1,
          price: numericPrice, // Make sure this also uses the validated numeric price
        },
      ],
    };

    console.log("Final purchase request object:", purchaseRequest);
    console.log(
      "Purchase request JSON:",
      JSON.stringify(purchaseRequest, null, 2)
    );

    const response = await fetch(
      "https://localhost:7024/api/order/create-form",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(purchaseRequest),
      }
    );

    const responseText = await response.text();
    console.log("Purchase response status:", response.status);
    console.log("Purchase response body:", responseText);

    if (response.ok) {
      toast.success("Form template purchased successfully!", {
        description: "The form is now available in your profile.",
      });
      return true;
    } else {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText || "Unknown error" };
      }

      console.error("Purchase failed:", errorData);
      toast.error("Purchase failed", {
        description:
          errorData.message || `HTTP ${response.status}: ${responseText}`,
      });
      return false;
    }
  } catch (error) {
    console.error("Purchase error:", error);
    toast.error("Purchase failed", {
      description:
        error instanceof Error ? error.message : "Please try again later.",
    });
    return false;
  }
};

export const fetchFormTemplatesWithPrice = async (): Promise<any[]> => {
  const endpoints = [
    "https://localhost:7276/api/templates",
    "https://localhost:7276/api/template?page=1",
    "https://localhost:7276/api/templates-active",
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying endpoint: ${endpoint}`);
      const response = await fetch(endpoint);

      if (response.ok) {
        const templates = await response.json();
        console.log(
          `Success with ${endpoint}, got ${templates.length} templates`
        );

        // Ensure all templates have required fields
        interface RawTemplate {
          formTemplateId?: string;
          id?: string;
          serviceId?: string;
          formTemplateName?: string;
          formTemplateData?: string;
          status?: string;
          price?: number;
          [key: string]: any;
        }

        const validTemplates: (FormTemplate & { price: number })[] = (
          templates as RawTemplate[]
        ).filter(
          (t) =>
            t.formTemplateId &&
            t.formTemplateName &&
            typeof t.price === "number"
        ) as (FormTemplate & { price: number })[];

        if (validTemplates.length > 0) {
          return validTemplates;
        }
      }
    } catch (error) {
      console.warn(`Endpoint ${endpoint} failed:`, error);
      continue;
    }
  }

  return [];
};

export const getUserProfile = async (): Promise<{
  accountTicketRequest: number;
  accountId: string;
} | null> => {
  try {
    const token = Cookies.get("authToken");
    if (!token) {
      console.warn("No auth token found");
      return null;
    }

    const response = await fetch("https://localhost:7218/api/Account/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const profile = await response.json();
      console.log("Profile fetched:", profile);
      return {
        accountTicketRequest: profile.accountTicketRequest || 0,
        accountId: profile.accountId,
      };
    } else {
      const errorText = await response.text();
      console.error("Profile fetch failed:", response.status, errorText);
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return null;
  }
};

export default function UserServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceSlug = params.service as string;

  const [service, setService] = useState<Service | null>(null);
  const [formTemplate, setFormTemplate] = useState<(FormTemplate & { price: number }) | null>(null);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [lawyersLoading, setLawyersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentType, setContentType] = useState<"service" | "template">("service");
  const [userTickets, setUserTickets] = useState(0);
  const [userAccountId, setUserAccountId] = useState<string>("");
  const [isPurchasingTemplate, setIsPurchasingTemplate] = useState(false);

  const fetchUserProfile = useCallback(async () => {
    const profileData = await getUserProfile();
    if (profileData) {
      setUserTickets(profileData.accountTicketRequest);
      setUserAccountId(profileData.accountId);
    }
  }, []);

  const handleFormPurchase = async (formTemplateId: string, price: number) => {
    if (!userAccountId) {
      toast.error("Please log in to purchase forms");
      return;
    }

    // Additional validation and debugging
    console.log("HandleFormPurchase called with:", {
      formTemplateId,
      price,
      userAccountId,
      userTickets,
      priceType: typeof price,
      templateIdType: typeof formTemplateId,
    });

    // Ensure we have valid values
    if (!formTemplateId || formTemplateId.trim() === "") {
      toast.error("Invalid template ID");
      return;
    }

    // Make sure price is a number and valid
    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      console.error("Invalid price in handleFormPurchase:", {
        price,
        numericPrice,
      });
      toast.error("Invalid price", {
        description: `Price must be a positive number. Received: ${price}`,
      });
      return;
    }

    if (userTickets < numericPrice) {
      toast.error("Insufficient tickets", {
        description: `You need ${numericPrice} tickets but only have ${userTickets}.`,
      });
      return;
    }

    console.log("About to call purchaseFormTemplate with:", {
      userAccountId,
      formTemplateId,
      numericPrice,
    });

    setIsPurchasingTemplate(true); // Add this line
    try {
      const success = await purchaseFormTemplate(
        userAccountId,
        formTemplateId,
        numericPrice
      );

      if (success) {
        // Refresh user tickets
        console.log("Purchase successful, refreshing profile...");
        await fetchUserProfile();
      }
    } finally {
      setIsPurchasingTemplate(false); // Add this line
    }
  };

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
          console.log(
            "Found service:",
            foundService.serviceName,
            "-> slug:",
            getServiceSlug(foundService.serviceName)
          );
          setService(foundService);
          setContentType("service");
          setLoading(false);
          return;
        }
      }

      // If not found in services, try form templates using the working endpoint
      console.log("Service not found, trying templates...");

      // Try multiple endpoints that work in your dashboard
      let templateData: (FormTemplate & { price: number })[] = [];

      try {
        // First try the all templates endpoint (works in dashboard)
        const templateResponse = await fetch(
          "https://localhost:7276/api/templates"
        );
        if (templateResponse.ok) {
          templateData = await templateResponse.json();
        }
      } catch (err) {
        console.warn("All templates endpoint failed, trying paginated:", err);
      }

      // If that fails, try the paginated endpoint
      if (templateData.length === 0) {
        try {
          const paginatedResponse = await fetch(
            "https://localhost:7276/api/template?page=1"
          );
          if (paginatedResponse.ok) {
            templateData = await paginatedResponse.json();
          }
        } catch (err) {
          console.warn("Paginated endpoint failed:", err);
        }
      }

      // If that also fails, try active templates endpoint
      if (templateData.length === 0) {
        try {
          const activeResponse = await fetch(
            "https://localhost:7276/api/templates-active"
          );
          if (activeResponse.ok) {
            templateData = await activeResponse.json();
          }
        } catch (err) {
          console.warn("Active templates endpoint failed:", err);
        }
      }

      console.log("Template data received:", templateData);
      console.log("Looking for serviceSlug:", serviceSlug);

      if (templateData.length > 0) {
        const foundTemplate = templateData.find(
          (t) => getServiceSlug(t.formTemplateName) === serviceSlug
        );

        if (foundTemplate) {
          console.log(
            "Found template:",
            foundTemplate.formTemplateName,
            "-> slug:",
            getServiceSlug(foundTemplate.formTemplateName)
          );
          setFormTemplate(foundTemplate);
          setContentType("template");
          setLoading(false);
          return;
        }
      }

      // If still not found, set a more specific error
      setError("Service or template not found");
    } catch (error) {
      console.error("Failed to fetch service or template:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [serviceSlug]);

  useEffect(() => {
    fetchServiceOrTemplate();
    fetchUserProfile();
  }, [fetchServiceOrTemplate, fetchUserProfile]);

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
                  // onError={(e) => {
                  //   (e.target as HTMLImageElement).src =
                  //     "/assets/DefaultDocument.png";
                  // }}
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
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      window.open(
                        `/templates/preview/${formTemplate.formTemplateId || formTemplate.id
                        }`,
                        "_blank"
                      );
                    }}
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    Preview Template
                  </Button>
                  <Button
                    size="lg"
                    className={`${userTickets >= formTemplate.price
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-400 cursor-not-allowed"
                      }`}
                    onClick={() =>
                      handleFormPurchase(
                        formTemplate.formTemplateId || formTemplate.id || "",
                        formTemplate.price
                      )
                    }
                    disabled={userTickets < formTemplate.price || isPurchasingTemplate}
                  >
                    {isPurchasingTemplate ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-5 w-5 mr-2" />
                    )}
                    {isPurchasingTemplate
                      ? "Purchasing..."
                      : `Buy Template (${formTemplate.price} tickets)`
                    }
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MaxWidthWrapper>
    );
  }

  // Render service view
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
