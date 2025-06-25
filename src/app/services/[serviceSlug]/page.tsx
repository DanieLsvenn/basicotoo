"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Download, FileText } from "lucide-react";

// Interface for form templates
interface FormTemplate {
  formTemplateId?: string;
  id?: string;
  serviceId: string;
  formTemplateName: string;
  formTemplateData: string;
  status?: string;
}

// Predefined services (same as in your main services page)
const predefinedServices = [
  {
    name: "In-house Lawyer Services",
    slug: "in-house-lawyer-services",
    image: "/assets/InHouseLawyerServices.png",
    description: "Expert advice from top-tier legal professionals.",
    fullDescription:
      "Our in-house lawyer services provide comprehensive legal support for businesses and individuals. Get expert advice from top-tier legal professionals who understand your specific needs and industry requirements.",
  },
  {
    name: "Taxes, Corporate Finance",
    slug: "taxes-corporate-finance",
    image: "/assets/TaxesCorporateFinance.png",
    description: "Ensure your contracts are legally sound and risk-free.",
    fullDescription:
      "Navigate complex tax regulations and corporate finance matters with confidence. Our experts ensure your financial and legal structures are optimized for compliance and growth.",
  },
  {
    name: "Intellectual property",
    slug: "intellectual-property",
    image: "/assets/IntellectualProperty.png",
    description: "Manage all your legal cases in one secure dashboard.",
    fullDescription:
      "Protect your innovations, trademarks, and creative works with our comprehensive intellectual property services. From patent applications to trademark registration and IP strategy.",
  },
  {
    name: "Corporate Legal Services",
    slug: "corporate-legal-services",
    image: "/assets/CorporateLegalServices.png",
    description: "Custom legal documents drafted by experts.",
    fullDescription:
      "Complete corporate legal support including entity formation, contract drafting, compliance management, and strategic legal counsel for businesses of all sizes.",
  },
  {
    name: "Banking and finance",
    slug: "banking-finance",
    image: "/assets/BankingFinance.png",
    description: "Book appointments with qualified lawyers easily.",
    fullDescription:
      "Expert guidance on banking regulations, financial compliance, loan documentation, and financial services law. Navigate complex financial legal requirements with confidence.",
  },
  {
    name: "Insurance",
    slug: "insurance",
    image: "/assets/Insurance.png",
    description: "Stay on top of legal obligations for your business.",
    fullDescription:
      "Comprehensive insurance law services including policy review, claims assistance, coverage analysis, and regulatory compliance for insurance matters.",
  },
];

const Page = () => {
  const router = useRouter();
  const params = useParams();
  const serviceSlug = params.serviceSlug as string;

  const [tokens, setTokens] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [formTemplate, setFormTemplate] = useState<FormTemplate | null>(null);
  const [predefinedService, setPredefinedService] = useState<
    (typeof predefinedServices)[0] | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tokenCount = Number(localStorage.getItem("userTokens") || "50");
    setTokens(tokenCount);
  }, []);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);

        // First check if it's a predefined service
        const predefined = predefinedServices.find(
          (service) => service.slug === serviceSlug
        );
        if (predefined) {
          setPredefinedService(predefined);
          setLoading(false);
          return;
        }

        // If not predefined, try to fetch from form templates
        const response = await fetch(
          "https://localhost:7276/api/templates-active"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch templates");
        }

        const templates: FormTemplate[] = await response.json();

        // Generate slug from template name and find matching template
        const matchingTemplate = templates.find((template) => {
          const templateSlug = template.formTemplateName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();
          return templateSlug === serviceSlug;
        });

        if (matchingTemplate) {
          setFormTemplate(matchingTemplate);
        } else {
          setError("Service or template not found");
        }
      } catch (err) {
        console.error("Error fetching content:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch content"
        );
      } finally {
        setLoading(false);
      }
    };

    if (serviceSlug) {
      fetchContent();
    }
  }, [serviceSlug]);

  const handleBookNow = () => {
    if (tokens !== null) {
      if (tokens >= 15) {
        router.push(`/booking?service=${serviceSlug}`);
      } else {
        router.push("/buy-tickets");
      }
    }
  };

  const handleDownloadTemplate = () => {
    if (formTemplate) {
      // Create a blob with the HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${formTemplate.formTemplateName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          </style>
        </head>
        <body>
          <h1>${formTemplate.formTemplateName}</h1>
          ${formTemplate.formTemplateData}
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${formTemplate.formTemplateName.replace(
        /[^a-z0-9]/gi,
        "_"
      )}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push("/services")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Services
          </Button>
        </div>
      </div>
    );
  }

  // Render predefined service
  if (predefinedService) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-8 max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => router.push("/services")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Services
          </Button>

          <div className="mb-8">
            <img
              src={predefinedService.image}
              alt={predefinedService.name}
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
            <h1 className="text-4xl font-bold mb-4">
              {predefinedService.name}
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              {predefinedService.fullDescription}
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{predefinedService.fullDescription}</p>
              <div className="flex gap-4">
                <Button
                  onClick={handleBookNow}
                  disabled={tokens === null}
                  className="flex-1"
                >
                  {tokens === null
                    ? "Checking..."
                    : tokens >= 15
                    ? "Book Now (15 tokens)"
                    : "Get More Tokens"}
                </Button>
                {tokens !== null && tokens < 15 && (
                  <p className="text-sm text-red-600 flex items-center">
                    Insufficient tokens. You have {tokens}, need 15.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render form template
  if (formTemplate) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-8 max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => router.push("/services")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Services
          </Button>

          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  {formTemplate.formTemplateName}
                </h1>
                <p className="text-gray-600">
                  Service ID: {formTemplate.serviceId}
                </p>
              </div>
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
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Template Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose max-w-none border rounded-lg p-6 bg-gray-50 min-h-[300px]"
                dangerouslySetInnerHTML={{
                  __html:
                    formTemplate.formTemplateData ||
                    "<p>No content available</p>",
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  onClick={handleDownloadTemplate}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
                <Button
                  onClick={handleBookNow}
                  disabled={tokens === null}
                  className="flex-1"
                >
                  {tokens === null
                    ? "Checking..."
                    : tokens >= 15
                    ? "Get Legal Help (15 tokens)"
                    : "Get More Tokens"}
                </Button>
              </div>
              {tokens !== null && tokens < 15 && (
                <p className="text-sm text-red-600 mt-2">
                  Insufficient tokens. You have {tokens}, need 15 for legal
                  consultation.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};

export default Page;
