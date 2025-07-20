'use client';

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { Save, ArrowLeft, Loader2, FileText, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { API_ENDPOINTS, apiFetch } from "@/lib/api-utils";

// Dynamic import for TinyMCE editor
const DynamicEditor = dynamic(() => import("@/components/DynamicEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-muted animate-pulse rounded-md"></div>
  ),
});

// Interface for customer form data
interface CustomerForm {
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
interface CustomerFormWithTemplate extends CustomerForm {
  template?: FormTemplate;
}

export default function EditFormPage() {
  const params = useParams();
  const router = useRouter();
  const customerFormId = params.customerFormId as string;

  const [formData, setFormData] = useState<CustomerFormWithTemplate | null>(null);
  const [editedContent, setEditedContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (customerFormId) {
      fetchFormData();
    }
  }, [customerFormId]);

  const fetchFormData = async () => {
    try {
      // First, get the customer form data
      const formResponse = await apiFetch(
        API_ENDPOINTS.FORM.CUSTOMER_FORM(customerFormId)
      );

      if (!formResponse.data) {
        if (formResponse.error?.includes('404')) {
          toast.error("Form not found");
          router.push("/profile");
          return;
        }
        throw new Error(`Failed to fetch form: ${formResponse.error}`);
      }

      const customerForm: CustomerForm = formResponse.data;

      // Check if form is editable
      if (customerForm.status !== "NOTUSED") {
        toast.error("This form can no longer be edited");
        router.push("/profile");
        return;
      }

      // Then fetch the template details
      const templatesResponse = await apiFetch(API_ENDPOINTS.FORM.TEMPLATES);

      let template: FormTemplate | undefined;
      if (templatesResponse.data) {
        const allTemplates: FormTemplate[] = templatesResponse.data;
        template = allTemplates.find(t => t.formTemplateId === customerForm.formTemplateId);
      }

      const formWithTemplate: CustomerFormWithTemplate = {
        ...customerForm,
        template,
      };

      setFormData(formWithTemplate);

      // Set initial content - use customer's edited data if available, otherwise use template data
      const initialContent = customerForm.customerFormData || template?.formTemplateData || "";
      setEditedContent(initialContent);

    } catch (error) {
      console.error("Failed to fetch form data:", error);
      toast.error("Failed to load form data");
      router.push("/profile");
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = useCallback((content: string) => {
    setEditedContent(content);
  }, []);

  const handleSaveForm = async () => {
    if (!formData) return;

    setSaving(true);
    try {

      const response = await apiFetch(
        API_ENDPOINTS.FORM.CUSTOMER_FORM(customerFormId),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            formData: editedContent,
          }),
        }
      );

      if (!response.data) {
        throw new Error(`Failed to save form: ${response.error}`);
      }

      toast.success("Form saved successfully");

      // Navigate back to profile with forms tab active
      router.push("/profile?tab=forms");

    } catch (error) {
      console.error("Failed to save form:", error);
      toast.error("Failed to save form");
    } finally {
      setSaving(false);
    }
  };

  const handleGoBack = () => {
    router.push("/profile");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-3" />
          <span className="text-lg">Loading form data...</span>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-600 mb-2">
                Form not found
              </h4>
              <p className="text-gray-500 mb-4">
                The form you're looking for doesn't exist or you don't have permission to edit it.
              </p>
              <Button onClick={handleGoBack}>
                Go Back to Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formName = formData.template?.formTemplateName || "Untitled Form";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Profile
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Edit Form</h1>
              <p className="text-sm text-muted-foreground">
                Make changes to your form template
              </p>
            </div>
          </div>
        </div>

        {/* Form Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{formName}</span>
              {formData.template && (
                <Badge variant="outline">
                  <Ticket className="w-5 h-5 text-amber-600" />{formData.template.price}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Form ID:</span>
                <span className="ml-2 text-muted-foreground">{formData.customerFormId}</span>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <span className="ml-2 text-muted-foreground">
                  {formData.status === "NOTUSED" ? "Editable" : "Used"}
                </span>
              </div>
              {formData.template && (
                <>
                  <div>
                    <span className="font-medium">Template ID:</span>
                    <span className="ml-2 text-muted-foreground">{formData.template.formTemplateId}</span>
                  </div>
                  <div>
                    <span className="font-medium">Template Status:</span>
                    <span className="ml-2 text-muted-foreground">{formData.template.status}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Editor Card */}
        <Card>
          <CardHeader>
            <CardTitle>Form Content</CardTitle>
            <p className="text-sm text-muted-foreground">
              Edit your form content below. You can format text, add images, and customize the layout.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Form Content</Label>
                <div className="border rounded-md overflow-hidden">
                  <DynamicEditor
                    content={editedContent}
                    onContentChange={handleContentChange}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleGoBack}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveForm}
                  disabled={saving}
                  className="min-w-[120px]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Form
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning Notice */}
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <h4 className="font-medium text-amber-800 mb-1">
                  Important Notice
                </h4>
                <p className="text-sm text-amber-700">
                  Once you save and use this form, it can no longer be edited. Make sure all your changes are correct before saving.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}