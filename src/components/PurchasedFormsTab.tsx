import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { Download, FileText, Loader2, Edit, Ticket } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import Link from "next/link";

// Updated interface to match the actual API response
interface PurchasedForm {
  customerFormId: string;
  customerId: string;
  formTemplateId: string;
  customerFormData: string;
  status: string;
  formTemplate: null;
}

// Interface for form template details
interface FormTemplate {
  formTemplateId: string;
  serviceId: string;
  formTemplateName: string;
  formTemplateData: string;
  price: number;
  status: string;
}

// Combined interface for display
interface PurchasedFormWithTemplate extends PurchasedForm {
  template?: FormTemplate;
}

interface PurchasedFormsTabProps {
  customerId: string;
}

export function PurchasedFormsTab({ customerId }: PurchasedFormsTabProps) {
  const [purchasedForms, setPurchasedForms] = useState<
    PurchasedFormWithTemplate[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [downloadingForms, setDownloadingForms] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    fetchPurchasedFormsWithTemplates();
  }, [customerId]);

  const fetchPurchasedFormsWithTemplates = async () => {
    try {
      const token = Cookies.get("authToken");

      if (!token) {
        toast.error("Please log in to view your forms");
        return;
      }

      console.log("Fetching forms for customer:", customerId);

      // First, fetch purchased forms
      const formsResponse = await fetch(
        `https://localhost:7276/api/form/customer/${customerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!formsResponse.ok) {
        if (formsResponse.status === 404) {
          console.log("No forms found for customer");
          setPurchasedForms([]);
          return;
        }
        throw new Error(`Failed to fetch forms: ${formsResponse.status}`);
      }

      const purchasedFormsData: PurchasedForm[] = await formsResponse.json();
      console.log("Fetched purchased forms:", purchasedFormsData);

      // Then fetch templates
      const templatesResponse = await fetch(
        `https://localhost:7276/api/templates`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (templatesResponse.ok) {
        const allTemplates: FormTemplate[] = await templatesResponse.json();
        console.log("Fetched templates:", allTemplates.length);

        // Create map and combine data
        const templatesMap = new Map<string, FormTemplate>();
        allTemplates.forEach((template) => {
          templatesMap.set(template.formTemplateId, template);
        });

        const formsWithTemplates: PurchasedFormWithTemplate[] =
          purchasedFormsData.map((form) => ({
            ...form,
            template: templatesMap.get(form.formTemplateId),
          }));

        console.log("Combined forms with templates:", formsWithTemplates);
        setPurchasedForms(formsWithTemplates);
      } else {
        console.warn(
          "Templates fetch failed, showing forms without template data"
        );
        setPurchasedForms(purchasedFormsData);
        toast.error("Failed to load form template details");
      }
    } catch (error) {
      console.error("Failed to fetch purchased forms:", error);
      toast.error("Failed to load purchased forms");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadForm = async (form: PurchasedFormWithTemplate) => {
    const formName = form.template?.formTemplateName || "Untitled Form";

    setDownloadingForms((prev) => new Set(prev).add(form.customerFormId));

    try {
      // Use the customer's form data (which might be edited) or fall back to template data
      const contentToDownload =
        form.customerFormData ||
        form.template?.formTemplateData ||
        "No content available";

      await generateAndDownloadPDF(contentToDownload, formName);
      toast.success("Form downloaded successfully");
    } catch (error) {
      console.error("Failed to download form:", error);
      toast.error("Failed to download form");
    } finally {
      setDownloadingForms((prev) => {
        const newSet = new Set(prev);
        newSet.delete(form.customerFormId);
        return newSet;
      });
    }
  };

  const generateAndDownloadPDF = async (
    formContent: string,
    formName: string
  ) => {
    const safeFormName = formName || "form_download";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${safeFormName}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              line-height: 1.6;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .content { 
              line-height: 1.6; 
            }
            h1 { 
              color: #333; 
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${safeFormName}</h1>
          </div>
          <div class="content">
            ${formContent}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeFormName.replace(/[^a-z0-9]/gi, "_")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEditForm = (form: PurchasedFormWithTemplate) => {
    // Navigate to edit page or open edit modal
    // You'll need to implement this based on your routing setup
    window.location.href = `/edit-form/${form.customerFormId}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading your forms...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Your Purchased Forms</h3>
          <p className="text-sm text-muted-foreground">
            Edit and download your purchased form templates. Forms can be edited
            once before finalization.
          </p>
        </div>
        <Badge variant="outline">
          {purchasedForms.length} form{purchasedForms.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {purchasedForms.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-600 mb-2">
                No forms purchased yet
              </h4>
              <p className="text-gray-500 mb-4">
                Browse our services to find and purchase form templates.
              </p>
              <Button asChild>
                <Link href="/services">Browse Services</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {purchasedForms.map((form) => {
            const formName = form.template?.formTemplateName || "Untitled Form";
            const isEditable = form.status === "NOTUSED";

            return (
              <Card
                key={form.customerFormId}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {formName}
                    </h4>
                    <Badge
                      variant={isEditable ? "default" : "secondary"}
                      className="ml-2"
                    >
                      {isEditable ? "Editable" : "Used"}
                    </Badge>
                  </div>

                  {form.template && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        Price: <Ticket className="w-4 h-4 text-amber-600" /> {form.template.price}
                      </p>
                      <p className="text-xs text-gray-400">
                        Status: {form.template.status}
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-gray-400 mb-4 truncate">
                    Form ID: {form.customerFormId}
                  </div>

                  <div className="space-y-2">
                    {/* Edit Button - only show if form is editable */}
                    {isEditable && (
                      <Button
                        onClick={() => handleEditForm(form)}
                        className="w-full"
                        size="sm"
                        variant="outline"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Form
                      </Button>
                    )}

                    {/* Download Button */}
                    <Button
                      onClick={() => handleDownloadForm(form)}
                      disabled={downloadingForms.has(form.customerFormId)}
                      className="w-full"
                      size="sm"
                    >
                      {downloadingForms.has(form.customerFormId) ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
