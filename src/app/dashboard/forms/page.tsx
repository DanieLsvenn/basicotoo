"use client";

import { useEffect, useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, ArrowLeft, Eye, Edit, Trash2 } from "lucide-react";

// Dynamic import for TinyMCE editor to avoid SSR issues
const DynamicEditor = dynamic(() => import("@/components/DynamicEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-muted animate-pulse rounded-md"></div>
  ),
});

interface FormTemplate {
  serviceId: string;
  formTemplateName: string;
  formTemplateData: string;
  status?: string;
}

interface TemplateListItem extends FormTemplate {
  formTemplateId?: string; // Changed from 'id' to 'formTemplateId' to match API
  id?: string; // Keep both for backward compatibility
}

type ViewMode = "list" | "create" | "edit" | "view";

export default function FormTemplatesPage() {
  // State management
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<FormTemplate>({
    serviceId: "",
    formTemplateName: "",
    formTemplateData: "<p>Start creating your template...</p>",
    status: "active",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Fetch templates on component mount - default to show all templates
  useEffect(() => {
    fetchAllTemplates();
  }, []);

  // Only use pagination when specifically requested
  const fetchTemplates = async (page: number = 0) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://localhost:7276/api/template?page=${page}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch templates"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "https://localhost:7276/api/templates-active"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch active templates");
      }
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch active templates"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("https://localhost:7276/api/templates");
      if (!response.ok) {
        throw new Error("Failed to fetch all templates");
      }
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch all templates"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplateById = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching template by ID:", id); // Debug log
      const response = await fetch(`https://localhost:7276/api/template/${id}`);
      if (!response.ok) {
        throw new Error(`Template not found (${response.status})`);
      }
      const data = await response.json();
      console.log("Received template data:", data); // Debug log

      // Handle the API response structure based on your Swagger documentation
      // Update this mapping based on the actual API response structure
      setCurrentTemplate({
        serviceId: data.serviceId || "",
        formTemplateName: data.formTemplateName || "",
        formTemplateData:
          data.formTemplateData || "<p>No content available</p>",
        status: data.status || "ACTIVE", // Note: API shows "ACTIVE" in caps
      });
    } catch (err) {
      console.error("Error fetching template:", err); // Debug log
      setError(err instanceof Error ? err.message : "Failed to fetch template");
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async () => {
    if (
      !currentTemplate.formTemplateName.trim() ||
      !currentTemplate.serviceId.trim()
    ) {
      setError("Template name and service ID are required");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("https://localhost:7276/api/template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(currentTemplate),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create template: ${errorText}`);
      }

      await fetchAllTemplates();
      resetForm();
      setViewMode("list");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create template"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateTemplate = async () => {
    if (
      !editingId ||
      !currentTemplate.formTemplateName.trim() ||
      !currentTemplate.serviceId.trim()
    ) {
      setError("Template name and service ID are required");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://localhost:7276/api/template/${editingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(currentTemplate),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update template: ${errorText}`);
      }

      await fetchAllTemplates();
      resetForm();
      setViewMode("list");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update template"
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://localhost:7276/api/template/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete template: ${errorText}`);
      }

      await fetchAllTemplates();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete template"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentTemplate({
      serviceId: "",
      formTemplateName: "",
      formTemplateData: "<p>Start creating your template...</p>",
      status: "active",
    });
    setEditingId(null);
    setError(null);
  };

  // Helper function to get the correct ID from template
  const getTemplateId = (template: TemplateListItem): string => {
    return template.formTemplateId || template.id || template.serviceId;
  };

  const handleEdit = async (template: TemplateListItem) => {
    const id = getTemplateId(template);
    console.log("Editing template with ID:", id); // Debug log
    setEditingId(id);
    await fetchTemplateById(id);
    setViewMode("edit");
  };

  const handleView = async (template: TemplateListItem) => {
    const id = getTemplateId(template);
    console.log("Viewing template with ID:", id); // Debug log
    await fetchTemplateById(id);
    setViewMode("view");
  };

  const handleContentChange = (content: string) => {
    setCurrentTemplate((prev) => ({
      ...prev,
      formTemplateData: content,
    }));
  };

  // Add pagination handlers for when needed
  const handlePagination = (direction: "next" | "prev") => {
    const newPage =
      direction === "next" ? currentPage + 1 : Math.max(0, currentPage - 1);
    setCurrentPage(newPage);
    fetchTemplates(newPage);
  };

  const renderTemplateList = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Form Templates</h1>
          <p className="text-muted-foreground">
            Manage your form templates and content
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={fetchActiveTemplates}
            variant="outline"
            disabled={loading}
          >
            Show Active Only
          </Button>
          <Button
            onClick={fetchAllTemplates}
            variant="outline"
            disabled={loading}
          >
            Show All
          </Button>
          <Button
            onClick={() => fetchTemplates(0)}
            variant="outline"
            disabled={loading}
          >
            Paginated View
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setViewMode("create");
            }}
          >
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
      {!loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template, index) => (
            <Card
              key={getTemplateId(template) || index}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {template.formTemplateName}
                    </CardTitle>
                    <CardDescription>
                      Service ID: {template.serviceId}
                    </CardDescription>
                    {/* Debug info - remove in production */}
                    <CardDescription className="text-xs text-muted-foreground">
                      ID: {getTemplateId(template)}
                    </CardDescription>
                  </div>
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
              </CardHeader>
              <CardContent>
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
                    onClick={() => deleteTemplate(getTemplateId(template))}
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

      {/* Pagination - only show when using paginated view */}
      {!loading && templates.length > 0 && currentPage >= 0 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handlePagination("prev")}
            disabled={currentPage === 0}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-sm text-muted-foreground">
            Page {currentPage + 1}
          </span>
          <Button variant="outline" onClick={() => handlePagination("next")}>
            Next
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && templates.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first template
            </p>
            <Button
              onClick={() => {
                resetForm();
                setViewMode("create");
              }}
            >
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
        <Button
          variant="outline"
          onClick={() => {
            resetForm();
            setViewMode("list");
          }}
        >
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
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name *</Label>
              <Input
                id="templateName"
                value={currentTemplate.formTemplateName}
                onChange={(e) =>
                  setCurrentTemplate((prev) => ({
                    ...prev,
                    formTemplateName: e.target.value,
                  }))
                }
                placeholder="Enter template name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceId">Service ID *</Label>
              <Input
                id="serviceId"
                value={currentTemplate.serviceId}
                onChange={(e) =>
                  setCurrentTemplate((prev) => ({
                    ...prev,
                    serviceId: e.target.value,
                  }))
                }
                placeholder="Enter service ID"
                required
              />
            </div>
          </div>

          {currentTemplate.status !== undefined && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={currentTemplate.status}
                onValueChange={(value) =>
                  setCurrentTemplate((prev) => ({
                    ...prev,
                    status: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="active">active</SelectItem>
                  <SelectItem value="inactive">inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Template Content</Label>
            <div className="border rounded-md overflow-hidden">
              <DynamicEditor
                content={currentTemplate.formTemplateData}
                onContentChange={handleContentChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={viewMode === "create" ? createTemplate : updateTemplate}
          disabled={
            loading ||
            !currentTemplate.formTemplateName.trim() ||
            !currentTemplate.serviceId.trim()
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
          variant="outline"
          onClick={() => {
            resetForm();
            setViewMode("list");
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  const renderTemplateView = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => setViewMode("list")}>
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
          <CardTitle>Template Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">
                Template Name
              </Label>
              <p className="font-medium">
                {currentTemplate.formTemplateName || "No name provided"}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">
                Service ID
              </Label>
              <p className="font-medium">
                {currentTemplate.serviceId || "No service ID provided"}
              </p>
            </div>
          </div>

          {currentTemplate.status && (
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">
                Status
              </Label>
              <div>
                <Badge
                  variant={
                    currentTemplate.status.toLowerCase() === "active"
                      ? "default"
                      : "secondary"
                  }
                >
                  {currentTemplate.status}
                </Badge>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Template Content
            </Label>
            <div className="border rounded-md p-4 bg-muted/50 prose max-w-none min-h-[200px]">
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    currentTemplate.formTemplateData ||
                    "<p>No content available</p>",
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
            // Find the current template in the list to pass to handleEdit
            const template =
              templates.find((t) => getTemplateId(t) === editingId) ||
              ({
                formTemplateId: editingId,
                serviceId: currentTemplate.serviceId,
                formTemplateName: currentTemplate.formTemplateName,
                formTemplateData: currentTemplate.formTemplateData,
                status: currentTemplate.status,
              } as TemplateListItem);
            handleEdit(template);
          }}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Template
        </Button>
        <Button variant="outline" onClick={() => setViewMode("list")}>
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
    </div>
  );
}
