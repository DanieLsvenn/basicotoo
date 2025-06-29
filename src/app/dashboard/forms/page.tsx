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
import { Loader2, Plus, ArrowLeft, Eye, Edit, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

// Dynamic import for TinyMCE editor to avoid SSR issues
const DynamicEditor = dynamic(() => import("@/components/DynamicEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-muted animate-pulse rounded-md"></div>
  ),
});

// Constants
const API_BASE_URL = "https://localhost:7276/api";
const API_SERVICE = "https://localhost:7218/api/Service";
const STATUS_OPTIONS = ["ACTIVE", "INACTIVE"] as const;
const CURRENCY_OPTIONS = ["VND", "USD"] as const;

// Types
type Status = typeof STATUS_OPTIONS[number];
type Currency = typeof CURRENCY_OPTIONS[number];

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
  const [currency, setCurrency] = useState<Currency>("VND");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TemplateListItem | null>(null);
  const [usdToVndRate, setUsdToVndRate] = useState<number>(24000); // fallback default

  // --- LOGIC METHODS ---

  // API request wrapper
  const apiRequest = useCallback(async (url: string, options?: RequestInit) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    return response.json();
  }, []);

  // Fetch all services
  const fetchServices = useCallback(async () => {
    try {
      const response = await fetch(API_SERVICE);
      if (!response.ok) {
        throw new Error(`Failed to fetch services: ${response.status}`);
      }
      const data = await response.json();
      setServices(data);
    } catch (err) {
      console.error("Failed to fetch services:", err);
      toast.error("Failed to fetch services");
    }
  }, []);

  // Fetch templates
  const fetchTemplates = useCallback(async (mode: FilterMode = "all") => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = mode === "active" ? "/templates-active" : "/templates";
      const data = await apiRequest(endpoint);
      setTemplates(data);
      setFilterMode(mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch templates");
      toast.error("Failed to fetch templates");
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  // Fetch template by ID
  const fetchTemplateById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest(`/template/${id}`);

      setFormData({
        serviceId: data.serviceId || "",
        formTemplateName: data.formTemplateName || "",
        formTemplateData: data.formTemplateData || "",
        status: data.status?.toUpperCase() === "ACTIVE" ? "ACTIVE" : "INACTIVE",
        price: data.price || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch template");
      toast.error("Failed to fetch template");
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  // Create new template
  const createTemplate = async () => {
    setLoading(true);
    try {
      // Convert price to VND for API
      const priceInVND = currency === "USD" ? formData.price * usdToVndRate : formData.price;
      const payload = { ...formData, price: priceInVND };

      await apiRequest("/template", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      toast.success("Template created successfully");
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create template";
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
      // Convert price to VND for API
      const priceInVND = currency === "USD" ? formData.price * usdToVndRate : formData.price;
      const payload = { ...formData, price: priceInVND };

      await apiRequest(`/template/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      
      toast.success("Template updated successfully");
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update template";
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
      await fetchTemplates(filterMode);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete template";
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

    const isSuccess = viewMode === "edit" ? await updateTemplate() : await createTemplate();
    
    if (isSuccess) {
      resetForm();
      setViewMode("list");
      await fetchTemplates(filterMode);
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

  // Format price display
  const formatPrice = useCallback((price: number): string => {
    if (currency === "USD") {
      const priceInUSD = price / usdToVndRate;
      return `$${priceInUSD.toFixed(2)}`;
    }
    return `${price.toLocaleString("en-US")} VND`;
  }, [currency, usdToVndRate]);

  // Get service name by ID
  const getServiceName = useCallback((serviceId: string): string => {
    const service = services.find(s => s.serviceId === serviceId);
    return service ? service.serviceName : serviceId;
  }, [services]);

  // --- HANDLER METHODS ---

  // Handle creating new template
  const handleCreateNew = useCallback(() => {
    resetForm();
    setViewMode("create");
  }, [resetForm]);

  // Handle editing template
  const handleEdit = useCallback(async (template: TemplateListItem) => {
    const id = getTemplateId(template);
    setEditingId(id);
    await fetchTemplateById(id);
    setViewMode("edit");
  }, [getTemplateId, fetchTemplateById]);

  // Handle viewing template
  const handleView = useCallback(async (template: TemplateListItem) => {
    const id = getTemplateId(template);
    await fetchTemplateById(id);
    setViewMode("view");
  }, [getTemplateId, fetchTemplateById]);

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
    setFormData(prev => ({ ...prev, formTemplateData: content }));
  }, []);

  // Handle input field changes
  const handleInputChange = useCallback((field: keyof FormTemplate, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle price change with validation
  const handlePriceChange = useCallback((value: string) => {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue >= 0) {
      handleInputChange("price", numericValue);
    }
  }, [handleInputChange]);

  // Effects
  useEffect(() => {
    fetchTemplates("all");
    fetchServices();
  }, []);

  useEffect(() => {
    fetch("https://api.getgeoapi.com/v2/currency/convert?api_key=05585d2dbe81b54873e6a5ec72b0ad7e423bbcc0&from=USD&to=VND&amount=1&format=json")
      .then(res => res.json())
      .then(data => {
        // Check if the response is successful and has the expected structure
        if (
          data &&
          data.status === "success" &&
          data.rates &&
          data.rates.VND &&
          data.rates.VND.rate
        ) {
          setUsdToVndRate(Number(data.rates.VND.rate));
        }
      })
      .catch(() => {
        setUsdToVndRate(26086.9826); // fallback
      });
  }, []);

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
          <Select value={currency} onValueChange={(value: Currency) => setCurrency(value)}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map(curr => (
                <SelectItem key={curr} value={curr}>
                  {curr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => fetchTemplates("active")}
            variant={filterMode === "active" ? "default" : "outline"}
            disabled={loading}
          >
            Show Active Only
          </Button>
          <Button
            onClick={() => fetchTemplates("all")}
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template, index) => (
            <Card
              key={getTemplateId(template) || index}
              className="hover:shadow-md transition-shadow h-full flex flex-col overflow-hidden"
            >
              <CardHeader className="flex-1 min-h-0 pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg leading-tight">
                      <span
                        className="block break-words hyphens-auto line-clamp-2"
                        style={{ wordBreak: 'break-word' }}
                        title={template.formTemplateName}
                      >
                        {template.formTemplateName}
                      </span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      <span
                        className="block break-words hyphens-auto line-clamp-1"
                        style={{ wordBreak: 'break-word' }}
                        title={`Service: ${getServiceName(template.serviceId)}`}
                      >
                        Service: {getServiceName(template.serviceId)}
                      </span>
                    </CardDescription>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-medium text-green-600 break-words">
                        {formatPrice(template.price || 0)}
                      </span>
                    </div>
                  </div>
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
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(template)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template)}
                    disabled={loading}
                    className="flex-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
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
                  onChange={(e) => handleInputChange("formTemplateName", e.target.value)}
                  placeholder="Enter template name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service">Service *</Label>
                <Select
                  value={formData.serviceId}
                  onValueChange={(value) => handleInputChange("serviceId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services
                      .filter(service => service.status === "Active")
                      .map(service => (
                        <SelectItem key={service.serviceId} value={service.serviceId}>
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
                  onValueChange={(value: Status) => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(status => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (VND) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="0"
                  min="0"
                  step={currency === "USD" ? "0.01" : "1"}
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
              <Button type="button" variant="outline" onClick={handleBackToList}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  const renderTemplateView = () => (
    <div className="max-w-2xl mx-auto space-y-6">
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
          <CardTitle className="flex items-center justify-between">
            {formData.formTemplateName || "Unnamed Template"}
            {formData.status && (
              <Badge
                variant={
                  formData.status === "ACTIVE" ? "default" : "secondary"
                }
              >
                {formData.status}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">
                Service
              </Label>
              <p className="font-medium">
                {formData.serviceId ? getServiceName(formData.serviceId) : "No service selected"}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">
                Price
              </Label>
              <p className="text-2xl font-bold text-green-600">
                {formatPrice(formData.price)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Template Content
            </Label>
            <div className="border rounded-md p-4 bg-muted/50 prose max-w-none min-h-[200px]">
              <div
                dangerouslySetInnerHTML={{
                  __html: formData.formTemplateData || "<p>No content available</p>",
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
            const template = templates.find(t => getTemplateId(t) === editingId) || {
              formTemplateId: editingId,
              serviceId: formData.serviceId,
              formTemplateName: formData.formTemplateName,
              formTemplateData: formData.formTemplateData,
              status: formData.status,
              price: formData.price,
            } as TemplateListItem;
            handleEdit(template);
          }}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Templat
        </Button>
        <Button variant="outline" onClick={handleBackToList}>
          Close
        </Button>
      </div>
    </div>
  );

  // Main render logic
  return (
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
  );
}