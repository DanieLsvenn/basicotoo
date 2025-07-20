// src/app/dashboard/forms/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
  FileText,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import { MaxWidthWrapper } from "@/components/max-width-wrapper";
import { apiFetch, API_ENDPOINTS } from "@/lib/api-utils";

// Dynamic import for TinyMCE editor to avoid SSR issues
const DynamicEditor = dynamic(() => import("@/components/DynamicEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-muted animate-pulse rounded-md"></div>
  ),
});

// Constants
const STATUS_OPTIONS = ["ACTIVE", "INACTIVE"] as const;

// Types
type Status = (typeof STATUS_OPTIONS)[number];

interface ServiceOption {
  serviceId: string;
  serviceName: string;
  status: "Active" | "Inactive";
}

interface FormTemplate {
  serviceId: string;
  formTemplateName: string;
  formTemplateData: string;
  status: Status;
  price: number;
}

interface TemplateListItem extends FormTemplate {
  formTemplateId?: string;
  id?: string;
}

type ViewMode = "list" | "create" | "edit" | "view";
type FilterMode = "all" | "active";

const initialFormData: FormTemplate = {
  serviceId: "",
  formTemplateName: "",
  formTemplateData: "",
  status: "ACTIVE",
  price: 0,
};

export default function FormTemplatesPage() {
  // --- STATE MANAGEMENT ---
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [formData, setFormData] = useState<FormTemplate>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TemplateListItem | null>(
    null
  );
  const [refreshKey, setRefreshKey] = useState(0);

  // --- LOGIC METHODS ---

  // API request wrapper
  const apiRequest = useCallback(async (url: string, options?: RequestInit) => {
    const fullUrl = url.startsWith('http') ? url : `${API_ENDPOINTS.FORM.BASE}${url}`;
    const response = await apiFetch(fullUrl, options);
    
    if (!response.data && response.error) {
      throw new Error(response.error);
    }
    
    return response.data;
  }, []);

  // Fetch all services
  const fetchServices = useCallback(async () => {
    try {
      const response = await apiFetch(API_ENDPOINTS.SERVICE.BASE);
      if (!response.data) {
        throw new Error(response.error || "Failed to fetch services");
      }
      setServices(response.data);
    } catch (err) {
      console.error("Failed to fetch services:", err);
      toast.error("Failed to fetch services");
    }
  }, []);

  // Fetch templates
  const fetchTemplates = useCallback(
    async (mode: FilterMode = "all") => {
      setLoading(true);
      setError(null);

      try {
        const endpoint = mode === "active" ? "/templates-active" : "/templates";
        const data = await apiRequest(endpoint);
        setTemplates(data);
        setFilterMode(mode);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch templates"
        );
        toast.error("Failed to fetch templates");
      } finally {
        setLoading(false);
      }
    },
    [apiRequest]
  );

  // Fetch template by ID
  const fetchTemplateById = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const data = await apiRequest(`/template/${id}`);

        setFormData({
          serviceId: data.serviceId || "",
          formTemplateName: data.formTemplateName || "",
          formTemplateData: data.formTemplateData || "",
          status:
            data.status?.toUpperCase() === "ACTIVE" ? "ACTIVE" : "INACTIVE",
          price: data.price || 0,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch template"
        );
        toast.error("Failed to fetch template");
      } finally {
        setLoading(false);
      }
    },
    [apiRequest]
  );

  // Create new template
  const createTemplate = async () => {
    setLoading(true);
    try {
      await apiRequest("/template", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      toast.success("Template created successfully");
      setRefreshKey((prev) => prev + 1);
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create template";
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update existing template
  const updateTemplate = async () => {
    if (!editingId) return false;

    setLoading(true);
    try {
      await apiRequest(`/template/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });

      toast.success("Template updated successfully");
      setRefreshKey((prev) => prev + 1);
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update template";
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete template
  const deleteTemplate = async (template: TemplateListItem) => {
    const id = getTemplateId(template);
    setLoading(true);

    try {
      await apiRequest(`/template/${id}`, { method: "DELETE" });
      toast.success("Template deleted successfully");
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete template";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Submit form (create or update)
  const submitTemplateForm = async () => {
    const { formTemplateName, serviceId } = formData;

    if (!formTemplateName.trim() || !serviceId.trim()) {
      setError("Template name and service are required");
      toast.error("Template name and service are required");
      return;
    }

    const isSuccess =
      viewMode === "edit" ? await updateTemplate() : await createTemplate();

    if (isSuccess) {
      resetForm();
      setViewMode("list");
    }
  };

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setEditingId(null);
    setError(null);
  }, []);

  // Get template ID from template object
  const getTemplateId = useCallback((template: TemplateListItem): string => {
    return template.formTemplateId || template.id || template.serviceId;
  }, []);

  // Format price display in tickets
  const formatPrice = useCallback((price: number): string => {
    return `${price.toLocaleString("en-US")} Tickets`;
  }, []);

  // Get service name by ID
  const getServiceName = useCallback(
    (serviceId: string): string => {
      const service = services.find((s) => s.serviceId === serviceId);
      return service ? service.serviceName : serviceId;
    },
    [services]
  );

  // --- HANDLER METHODS ---

  // Handle creating new template
  const handleCreateNew = useCallback(() => {
    resetForm();
    setViewMode("create");
  }, [resetForm]);

  // Handle editing template
  const handleEdit = useCallback(
    async (template: TemplateListItem) => {
      const id = getTemplateId(template);
      setEditingId(id);
      await fetchTemplateById(id);
      setViewMode("edit");
    },
    [getTemplateId, fetchTemplateById]
  );

  // Handle viewing template
  const handleView = useCallback(
    async (template: TemplateListItem) => {
      const id = getTemplateId(template);
      await fetchTemplateById(id);
      setViewMode("view");
    },
    [getTemplateId, fetchTemplateById]
  );

  // Handle delete confirmation
  const handleDelete = (template: TemplateListItem) => {
    setDeleteTarget(template);
    setDeleteDialogOpen(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteTemplate(deleteTarget);
  };

  // Handle going back to list
  const handleBackToList = useCallback(() => {
    resetForm();
    setViewMode("list");
  }, [resetForm]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitTemplateForm();
  };

  // Handle content change from editor
  const handleContentChange = useCallback((content: string) => {
    setFormData((prev) => ({ ...prev, formTemplateData: content }));
  }, []);

  // Handle input field changes
  const handleInputChange = useCallback(
    (field: keyof FormTemplate, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Handle price change with validation
  const handlePriceChange = useCallback(
    (value: string) => {
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue) && numericValue >= 0) {
        handleInputChange("price", numericValue);
      }
    },
    [handleInputChange]
  );

  // Handle filter mode change
  const handleFilterChange = useCallback((mode: FilterMode) => {
    setFilterMode(mode);
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Effects
  useEffect(() => {
    fetchTemplates(filterMode);
  }, [refreshKey, filterMode, fetchTemplates]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // --- RENDER METHODS ---

  const renderTemplateList = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Form Templates
          </h1>
          <p className="text-muted-foreground">
            Manage your form templates and content
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => handleFilterChange("active")}
            variant={filterMode === "active" ? "default" : "outline"}
            disabled={loading}
          >
            Show Active Only
          </Button>
          <Button
            onClick={() => handleFilterChange("all")}
            variant={filterMode === "all" ? "default" : "outline"}
            disabled={loading}
          >
            Show All
          </Button>
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Template
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      )}

      {/* Templates Grid */}
      {!loading && templates.length > 0 && (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template, index) => (
            <Card
              key={getTemplateId(template) || index}
              className="hover:shadow-md transition-shadow h-full flex flex-col overflow-hidden"
            >
              <CardHeader className="flex-1 min-h-0 pb-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg leading-tight flex-1">
                      <span
                        className="block break-words hyphens-auto line-clamp-2"
                        style={{ wordBreak: "break-word" }}
                        title={template.formTemplateName}
                      >
                        {template.formTemplateName}
                      </span>
                    </CardTitle>
                    {template.status && (
                      <Badge
                        variant={
                          template.status.toUpperCase() === "ACTIVE"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs shrink-0"
                      >
                        {template.status.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs sm:text-sm">
                    <span
                      className="block break-words hyphens-auto line-clamp-1"
                      style={{ wordBreak: "break-word" }}
                      title={`Service: ${getServiceName(template.serviceId)}`}
                    >
                      Service: {getServiceName(template.serviceId)}
                    </span>
                  </CardDescription>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 text-xs sm:text-sm font-medium text-amber-600">
                      <Ticket className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="break-words">
                        {formatPrice(template.price || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(template)}
                    className="flex-1 min-w-0 text-xs sm:text-sm"
                  >
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="truncate">View</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                    className="flex-1 min-w-0 text-xs sm:text-sm"
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="truncate">Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template)}
                    disabled={loading}
                    className="flex-1 min-w-0 text-xs sm:text-sm text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="truncate">Delete</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && templates.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first template
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Template
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderTemplateForm = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBackToList}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {viewMode === "create" ? "Create New Template" : "Edit Template"}
          </h1>
          <p className="text-muted-foreground">
            {viewMode === "create"
              ? "Create a new form template with custom content"
              : "Update the template information and content"}
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
          <CardDescription>
            Fill in the basic information for your template
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name *</Label>
                <Input
                  id="templateName"
                  value={formData.formTemplateName}
                  onChange={(e) =>
                    handleInputChange("formTemplateName", e.target.value)
                  }
                  placeholder="Enter template name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service">Service *</Label>
                <Select
                  value={formData.serviceId}
                  onValueChange={(value) =>
                    handleInputChange("serviceId", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services
                      .filter((service) => service.status === "Active")
                      .map((service) => (
                        <SelectItem
                          key={service.serviceId}
                          value={service.serviceId}
                        >
                          {service.serviceName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Status) =>
                    handleInputChange("status", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-amber-600" />
                  Price (Tickets) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Template Content</Label>
              <div className="border rounded-md overflow-hidden">
                <DynamicEditor
                  content={formData.formTemplateData}
                  onContentChange={handleContentChange}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={
                  loading ||
                  !formData.formTemplateName.trim() ||
                  !formData.serviceId.trim()
                }
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading
                  ? "Saving..."
                  : viewMode === "create"
                  ? "Create Template"
                  : "Update Template"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToList}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  const renderTemplateView = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBackToList}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">View Template</h1>
          <p className="text-muted-foreground">
            Template details and content preview
          </p>
        </div>
      </div>

      {/* Template Details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle>
              {formData.formTemplateName || "Unnamed Template"}
            </CardTitle>
            {formData.status && (
              <Badge
                variant={
                  formData.status.toUpperCase() === "ACTIVE"
                    ? "default"
                    : "secondary"
                }
              >
                {formData.status.toUpperCase()}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">
                Service
              </Label>
              <p className="font-medium">
                {formData.serviceId
                  ? getServiceName(formData.serviceId)
                  : "No service selected"}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">
                Price
              </Label>
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-amber-600" />
                <p className="text-2xl font-bold text-amber-600">
                  {formatPrice(formData.price)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Template Content
            </Label>
            <div className="border rounded-md p-4 bg-muted/50 prose max-w-none min-h-[200px]">
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    formData.formTemplateData || "<p>No content available</p>",
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={() => {
            const template =
              templates.find((t) => getTemplateId(t) === editingId) ||
              ({
                formTemplateId: editingId,
                serviceId: formData.serviceId,
                formTemplateName: formData.formTemplateName,
                formTemplateData: formData.formTemplateData,
                status: formData.status,
                price: formData.price,
              } as TemplateListItem);
            handleEdit(template);
          }}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Template
        </Button>
        <Button variant="outline" onClick={handleBackToList}>
          Close
        </Button>
      </div>
    </div>
  );

  // Main render logic
  return (
    <MaxWidthWrapper>
      <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        {viewMode === "list" && renderTemplateList()}
        {(viewMode === "create" || viewMode === "edit") && renderTemplateForm()}
        {viewMode === "view" && renderTemplateView()}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Template</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-semibold">
                  {deleteTarget?.formTemplateName}
                </span>
                ? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MaxWidthWrapper>
  );
}
