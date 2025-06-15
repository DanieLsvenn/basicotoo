"use client";

import { useEffect, useState } from "react";
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
import {
  Loader2,
  Plus,
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
  Package,
} from "lucide-react";

interface TicketPackage {
  ticketPackageName: string;
  requestAmount: number;
  price: number;
  status?: string;
}

interface TicketPackageListItem extends TicketPackage {
  ticketPackageId: string;
}

type ViewMode = "list" | "create" | "edit" | "view";

export default function TicketPackagesPage() {
  // State management
  const [packages, setPackages] = useState<TicketPackageListItem[]>([]);
  const [currentPackage, setCurrentPackage] = useState<TicketPackage>({
    ticketPackageName: "",
    requestAmount: 0,
    price: 0,
    status: "ACTIVE",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch packages on component mount
  useEffect(() => {
    fetchAllPackages();
  }, []);

  // API Functions
  const fetchAllPackages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "https://localhost:7103/api/ticket-packages"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch packages");
      }
      const data = await response.json();
      setPackages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch packages");
    } finally {
      setLoading(false);
    }
  };

  const fetchActivePackages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "https://localhost:7103/api/ticket-packages-active"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch active packages");
      }
      const data = await response.json();
      setPackages(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch active packages"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchPackageById = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching package by ID:", id);
      const response = await fetch(
        `https://localhost:7103/api/ticket-package/${id}`
      );
      if (!response.ok) {
        throw new Error(`Package not found (${response.status})`);
      }
      const data = await response.json();
      console.log("Received package data:", data);

      setCurrentPackage({
        ticketPackageName: data.ticketPackageName || "",
        requestAmount: data.requestAmount || 0,
        price: data.price || 0,
        status: data.status || "ACTIVE",
      });
    } catch (err) {
      console.error("Error fetching package:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch package");
    } finally {
      setLoading(false);
    }
  };

  const createPackage = async () => {
    if (!currentPackage.ticketPackageName.trim()) {
      setError("Package name is required");
      return;
    }

    if (currentPackage.requestAmount <= 0) {
      setError("Request amount must be greater than 0");
      return;
    }

    if (currentPackage.price <= 0) {
      setError("Price must be greater than 0");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "https://localhost:7103/api/ticket-package",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(currentPackage),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create package: ${errorText}`);
      }

      await fetchAllPackages();
      resetForm();
      setViewMode("list");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create package");
    } finally {
      setLoading(false);
    }
  };

  const updatePackage = async () => {
    if (!editingId || !currentPackage.ticketPackageName.trim()) {
      setError("Package name is required");
      return;
    }

    if (currentPackage.requestAmount <= 0) {
      setError("Request amount must be greater than 0");
      return;
    }

    if (currentPackage.price <= 0) {
      setError("Price must be greater than 0");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://localhost:7103/api/ticket-package/${editingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(currentPackage),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update package: ${errorText}`);
      }

      await fetchAllPackages();
      resetForm();
      setViewMode("list");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update package");
    } finally {
      setLoading(false);
    }
  };

  const deletePackage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ticket package?")) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://localhost:7103/api/ticket-package/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete package: ${errorText}`);
      }

      await fetchAllPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete package");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentPackage({
      ticketPackageName: "",
      requestAmount: 0,
      price: 0,
      status: "ACTIVE",
    });
    setEditingId(null);
    setError(null);
  };

  const handleEdit = async (packageItem: TicketPackageListItem) => {
    setEditingId(packageItem.ticketPackageId);
    await fetchPackageById(packageItem.ticketPackageId);
    setViewMode("edit");
  };

  const handleView = async (packageItem: TicketPackageListItem) => {
    await fetchPackageById(packageItem.ticketPackageId);
    setViewMode("view");
  };

  // Render Functions
  const renderPackageList = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-8 w-8" />
            Ticket Packages
          </h1>
          <p className="text-muted-foreground">
            Manage your ticket packages and pricing
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={fetchActivePackages}
            variant="outline"
            disabled={loading}
          >
            Show Active Only
          </Button>
          <Button
            onClick={fetchAllPackages}
            variant="outline"
            disabled={loading}
          >
            Show All
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setViewMode("create");
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Package
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
          <p className="text-muted-foreground">Loading packages...</p>
        </div>
      )}

      {/* Packages Grid */}
      {!loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((packageItem) => (
            <Card
              key={packageItem.ticketPackageId}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {packageItem.ticketPackageName}
                    </CardTitle>
                    <CardDescription>
                      {packageItem.requestAmount} requests • $
                      {packageItem.price}
                    </CardDescription>
                  </div>
                  {packageItem.status && (
                    <Badge
                      variant={
                        packageItem.status.toLowerCase() === "active"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {packageItem.status}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Price per request:
                    </span>
                    <span className="font-medium">
                      $
                      {(packageItem.price / packageItem.requestAmount).toFixed(
                        2
                      )}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(packageItem)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(packageItem)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deletePackage(packageItem.ticketPackageId)}
                      disabled={loading}
                      className="flex-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && packages.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No packages found</h3>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first ticket package
            </p>
            <Button
              onClick={() => {
                resetForm();
                setViewMode("create");
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Package
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderPackageForm = () => (
    <div className="max-w-2xl mx-auto space-y-6">
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
            {viewMode === "create" ? "Create New Package" : "Edit Package"}
          </h1>
          <p className="text-muted-foreground">
            {viewMode === "create"
              ? "Create a new ticket package with pricing"
              : "Update the package information and pricing"}
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
          <CardTitle>Package Information</CardTitle>
          <CardDescription>
            Fill in the details for your ticket package
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="packageName">Package Name *</Label>
            <Input
              id="packageName"
              value={currentPackage.ticketPackageName}
              onChange={(e) =>
                setCurrentPackage((prev) => ({
                  ...prev,
                  ticketPackageName: e.target.value,
                }))
              }
              placeholder="e.g., Starter, Professional, Enterprise"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="requestAmount">Request Amount *</Label>
              <Input
                id="requestAmount"
                type="number"
                min="1"
                value={currentPackage.requestAmount}
                onChange={(e) =>
                  setCurrentPackage((prev) => ({
                    ...prev,
                    requestAmount: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder="Number of requests"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                min="0.01"
                step="0.01"
                value={currentPackage.price}
                onChange={(e) =>
                  setCurrentPackage((prev) => ({
                    ...prev,
                    price: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="Package price"
                required
              />
            </div>
          </div>

          {currentPackage.requestAmount > 0 && currentPackage.price > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm">
                <span className="text-muted-foreground">
                  Price per request:{" "}
                </span>
                <span className="font-medium">
                  $
                  {(
                    currentPackage.price / currentPackage.requestAmount
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={currentPackage.status}
              onValueChange={(value) =>
                setCurrentPackage((prev) => ({
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
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={viewMode === "create" ? createPackage : updatePackage}
          disabled={
            loading ||
            !currentPackage.ticketPackageName.trim() ||
            currentPackage.requestAmount <= 0 ||
            currentPackage.price <= 0
          }
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {loading
            ? "Saving..."
            : viewMode === "create"
            ? "Create Package"
            : "Update Package"}
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

  const renderPackageView = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => setViewMode("list")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">View Package</h1>
          <p className="text-muted-foreground">
            Package details and pricing information
          </p>
        </div>
      </div>

      {/* Package Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {currentPackage.ticketPackageName || "Unnamed Package"}
            {currentPackage.status && (
              <Badge
                variant={
                  currentPackage.status.toLowerCase() === "active"
                    ? "default"
                    : "secondary"
                }
              >
                {currentPackage.status}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">
                Request Amount
              </Label>
              <p className="text-2xl font-bold">
                {currentPackage.requestAmount.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">
                Total Price
              </Label>
              <p className="text-2xl font-bold text-green-600">
                ${currentPackage.price.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="text-center">
              <Label className="text-sm font-medium text-muted-foreground">
                Price per Request
              </Label>
              <p className="text-xl font-semibold">
                $
                {currentPackage.requestAmount > 0
                  ? (
                      currentPackage.price / currentPackage.requestAmount
                    ).toFixed(2)
                  : "0.00"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={() => {
            const packageItem =
              packages.find((p) => p.ticketPackageId === editingId) ||
              ({
                ticketPackageId: editingId || "",
                ticketPackageName: currentPackage.ticketPackageName,
                requestAmount: currentPackage.requestAmount,
                price: currentPackage.price,
                status: currentPackage.status,
              } as TicketPackageListItem);
            handleEdit(packageItem);
          }}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Package
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
      {viewMode === "list" && renderPackageList()}
      {(viewMode === "create" || viewMode === "edit") && renderPackageForm()}
      {viewMode === "view" && renderPackageView()}
    </div>
  );
}
