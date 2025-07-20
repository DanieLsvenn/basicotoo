"use client";

import { useEffect, useState, useCallback } from "react";
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
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { MaxWidthWrapper } from "@/components/max-width-wrapper";
import { API_ENDPOINTS, apiFetch } from "@/lib/api-utils";

// Constants
const STATUS_OPTIONS = ["ACTIVE", "INACTIVE"] as const;
const CURRENCY_OPTIONS = ["VND", "USD"] as const;

// Types
type Status = (typeof STATUS_OPTIONS)[number];
type Currency = (typeof CURRENCY_OPTIONS)[number];

interface TicketPackage {
  ticketPackageName: string;
  requestAmount: number;
  price: number;
  status: Status;
}

interface TicketPackageListItem extends TicketPackage {
  ticketPackageId?: string;
  id?: string;
}

type ViewMode = "list" | "create" | "edit" | "view";
type FilterMode = "all" | "active";

const initialPackageData: TicketPackage = {
  ticketPackageName: "",
  requestAmount: 0,
  price: 0,
  status: "ACTIVE",
};

export default function TicketPackagesPage() {
  // --- STATE MANAGEMENT ---
  const [packages, setPackages] = useState<TicketPackageListItem[]>([]);
  const [packageData, setPackageData] =
    useState<TicketPackage>(initialPackageData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [currency, setCurrency] = useState<Currency>("VND");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<TicketPackageListItem | null>(null);
  const [usdToVndRate, setUsdToVndRate] = useState<number>(24000); // fallback default
  const [displayPrice, setDisplayPrice] = useState<number>(0); // New state for display price

  // --- LOGIC METHODS ---

  // API request wrapper
  const apiRequest = useCallback(async (url: string, options?: RequestInit) => {
    const response = await apiFetch(`${API_ENDPOINTS.TICKET.BASE}${url}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (response.error) {
      throw new Error(`API Error: ${response.error}`);
    }

    return response.data;
  }, []);

  // Fetch packages
  const fetchPackages = useCallback(
    async (mode: FilterMode = "all") => {
      setLoading(true);
      setError(null);

      try {
        const endpoint =
          mode === "active" ? "/ticket-packages-active" : "/ticket-packages";
        const data = await apiRequest(endpoint);
        setPackages(data);
        setFilterMode(mode);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch packages"
        );
        toast.error("Failed to fetch packages");
      } finally {
        setLoading(false);
      }
    },
    [apiRequest]
  );

  // Fetch package by ID
  const fetchPackageById = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const data = await apiRequest(`/ticket-package/${id}`);

        const packagePrice = data.price || 0;
        setPackageData({
          ticketPackageName: data.ticketPackageName || "",
          requestAmount: data.requestAmount || 0,
          price: packagePrice,
          status:
            data.status?.toUpperCase() === "ACTIVE" ? "ACTIVE" : "INACTIVE",
        });

        // Set display price based on current currency
        const priceToDisplay =
          currency === "USD" ? packagePrice / usdToVndRate : packagePrice;
        setDisplayPrice(priceToDisplay);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch package"
        );
        toast.error("Failed to fetch package");
      } finally {
        setLoading(false);
      }
    },
    [apiRequest, currency, usdToVndRate]
  );

  // Create new package
  const createPackage = async () => {
    setLoading(true);
    try {
      // Convert price to VND for API
      const priceInVND =
        currency === "USD" ? displayPrice * usdToVndRate : displayPrice;
      const payload = { ...packageData, price: priceInVND };

      await apiRequest("/ticket-package", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success("Package created successfully");
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create package";
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update existing package
  const updatePackage = async () => {
    if (!editingId) return false;

    setLoading(true);
    try {
      // Convert price to VND for API
      const priceInVND =
        currency === "USD" ? displayPrice * usdToVndRate : displayPrice;
      const payload = { ...packageData, price: priceInVND };

      await apiRequest(`/ticket-package/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      toast.success("Package updated successfully");
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update package";
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete package
  const deletePackage = async (packageItem: TicketPackageListItem) => {
    const id = getPackageId(packageItem);
    setLoading(true);

    try {
      await apiRequest(`/ticket-package/${id}`, { method: "DELETE" });
      toast.success("Package deleted successfully");
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      await fetchPackages(filterMode);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete package";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Submit form (create or update)
  const submitPackageForm = async () => {
    const { ticketPackageName, requestAmount } = packageData;

    if (!ticketPackageName.trim()) {
      setError("Package name is required");
      toast.error("Package name is required");
      return;
    }

    if (requestAmount <= 0) {
      setError("Request amount must be greater than 0");
      toast.error("Request amount must be greater than 0");
      return;
    }

    if (displayPrice <= 0) {
      setError("Price must be greater than 0");
      toast.error("Price must be greater than 0");
      return;
    }

    const isSuccess =
      viewMode === "edit" ? await updatePackage() : await createPackage();

    if (isSuccess) {
      resetForm();
      setViewMode("list");
      await fetchPackages(filterMode);
    }
  };

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setPackageData(initialPackageData);
    setDisplayPrice(0);
    setEditingId(null);
    setError(null);
  }, []);

  // Get package ID from package object
  const getPackageId = useCallback(
    (packageItem: TicketPackageListItem): string => {
      return packageItem.ticketPackageId || packageItem.id || "";
    },
    []
  );

  // Format price display
  const formatPrice = useCallback(
    (price: number): string => {
      if (currency === "USD") {
        const priceInUSD = price / usdToVndRate;
        return `$${priceInUSD.toFixed(2)}`;
      }
      return `${price.toLocaleString("en-US")} VND`;
    },
    [currency, usdToVndRate]
  );

  // --- HANDLER METHODS ---

  // Handle creating new package
  const handleCreateNew = useCallback(() => {
    resetForm();
    setViewMode("create");
  }, [resetForm]);

  // Handle editing package - FIXED: Use existing data instead of fetching
  const handleEdit = useCallback(
    async (packageItem: TicketPackageListItem) => {
      const id = getPackageId(packageItem);
      setEditingId(id);

      // Use existing package data instead of fetching again
      setPackageData({
        ticketPackageName: packageItem.ticketPackageName,
        requestAmount: packageItem.requestAmount,
        price: packageItem.price,
        status: packageItem.status,
      });

      // Set display price based on current currency
      const priceToDisplay =
        currency === "USD"
          ? packageItem.price / usdToVndRate
          : packageItem.price;
      setDisplayPrice(priceToDisplay);

      setViewMode("edit");
    },
    [getPackageId, currency, usdToVndRate]
  );

  // Handle viewing package
  const handleView = useCallback(
    async (packageItem: TicketPackageListItem) => {
      const id = getPackageId(packageItem);
      await fetchPackageById(id);
      setViewMode("view");
    },
    [getPackageId, fetchPackageById]
  );

  // Handle delete confirmation
  const handleDelete = (packageItem: TicketPackageListItem) => {
    setDeleteTarget(packageItem);
    setDeleteDialogOpen(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deletePackage(deleteTarget);
  };

  // Handle going back to list
  const handleBackToList = useCallback(() => {
    resetForm();
    setViewMode("list");
  }, [resetForm]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitPackageForm();
  };

  // Handle input field changes
  const handleInputChange = useCallback(
    (field: keyof TicketPackage, value: string | number) => {
      setPackageData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Handle price change with validation - FIXED: Use displayPrice
  const handlePriceChange = useCallback((value: string) => {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue >= 0) {
      setDisplayPrice(numericValue);
    }
  }, []);

  // Handle request amount change with validation
  const handleRequestAmountChange = useCallback(
    (value: string) => {
      const numericValue = parseInt(value);
      if (!isNaN(numericValue) && numericValue >= 0) {
        handleInputChange("requestAmount", numericValue);
      }
    },
    [handleInputChange]
  );

  // Handle filter mode change
  const handleFilterChange = useCallback(
    (mode: FilterMode) => {
      fetchPackages(mode);
    },
    [fetchPackages]
  );

  // Handle currency change - FIXED: Convert display price when currency changes
  const handleCurrencyChange = useCallback(
    (newCurrency: Currency) => {
      if (newCurrency !== currency) {
        // Convert current display price to new currency
        if (newCurrency === "USD" && currency === "VND") {
          // Converting from VND to USD
          setDisplayPrice((prev) => prev / usdToVndRate);
        } else if (newCurrency === "VND" && currency === "USD") {
          // Converting from USD to VND
          setDisplayPrice((prev) => prev * usdToVndRate);
        }
      }
      setCurrency(newCurrency);
    },
    [currency, usdToVndRate]
  );

  // Effects
  useEffect(() => {
    fetchPackages("all");
  }, [fetchPackages]);

  useEffect(() => {
    apiFetch(
      API_ENDPOINTS.EXTERNAL.CURRENCY_CONVERT("05585d2dbe81b54873e6a5ec72b0ad7e423bbcc0", "USD", "VND", 1)
    )
      .then((response) => {
        // Check if the response is successful and has the expected structure
        if (
          response.data &&
          response.data.status === "success" &&
          response.data.rates &&
          response.data.rates.VND &&
          response.data.rates.VND.rate
        ) {
          setUsdToVndRate(Number(response.data.rates.VND.rate));
        }
      })
      .catch(() => {
        setUsdToVndRate(26086.9826); // fallback
      });
  }, []);

  // --- RENDER METHODS ---

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
          <Select value={currency} onValueChange={handleCurrencyChange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((curr) => (
                <SelectItem key={curr} value={curr}>
                  {curr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      {!loading && packages.length > 0 && (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((packageItem, index) => (
            <Card
              key={getPackageId(packageItem) || index}
              className="hover:shadow-md transition-shadow h-full flex flex-col overflow-hidden"
            >
              <CardHeader className="flex-1 min-h-0 pb-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg leading-tight flex-1">
                      <span
                        className="block break-words hyphens-auto line-clamp-2"
                        style={{ wordBreak: "break-word" }}
                        title={packageItem.ticketPackageName}
                      >
                        {packageItem.ticketPackageName}
                      </span>
                    </CardTitle>
                    {packageItem.status && (
                      <Badge
                        variant={
                          packageItem.status.toUpperCase() === "ACTIVE"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs shrink-0"
                      >
                        {packageItem.status.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs sm:text-sm">
                    <span
                      className="block break-words hyphens-auto line-clamp-1"
                      style={{ wordBreak: "break-word" }}
                      title={`${packageItem.requestAmount} requests`}
                    >
                      {packageItem.requestAmount} requests
                    </span>
                  </CardDescription>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-medium text-green-600 break-words">
                      {formatPrice(packageItem.price || 0)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (
                      {formatPrice(
                        (packageItem.price || 0) /
                          (packageItem.requestAmount || 1)
                      )}{" "}
                      per request)
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(packageItem)}
                    className="flex-1 min-w-0 text-xs sm:text-sm"
                  >
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="truncate">View</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(packageItem)}
                    className="flex-1 min-w-0 text-xs sm:text-sm"
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="truncate">Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(packageItem)}
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
      {!loading && packages.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No packages found</h3>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first ticket package
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Package
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderPackageForm = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBackToList}>
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
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="packageName">Package Name *</Label>
                <Input
                  id="packageName"
                  value={packageData.ticketPackageName}
                  onChange={(e) =>
                    handleInputChange("ticketPackageName", e.target.value)
                  }
                  placeholder="e.g., Starter, Professional, Enterprise"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={packageData.status}
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
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="requestAmount">Request Amount *</Label>
                <Input
                  id="requestAmount"
                  type="number"
                  value={packageData.requestAmount}
                  onChange={(e) => handleRequestAmountChange(e.target.value)}
                  placeholder="Number of requests"
                  min="1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price ({currency}) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={displayPrice}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="Package price"
                  min="0"
                  step={currency === "USD" ? "0.01" : "1"}
                  required
                />
              </div>
            </div>

            {/* Price Calculation Preview */}
            {packageData.requestAmount > 0 && displayPrice > 0 && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm">
                  <span className="text-muted-foreground">
                    Price per request:{" "}
                  </span>
                  <span className="font-medium text-green-600">
                    {currency === "USD"
                      ? `$${(displayPrice / packageData.requestAmount).toFixed(
                          2
                        )}`
                      : `${Math.round(
                          displayPrice / packageData.requestAmount
                        ).toLocaleString("en-US")} VND`}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={
                  loading ||
                  !packageData.ticketPackageName.trim() ||
                  packageData.requestAmount <= 0 ||
                  displayPrice <= 0
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

  const renderPackageView = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBackToList}>
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
          <div className="flex items-start justify-between gap-4">
            <CardTitle>
              {packageData.ticketPackageName || "Unnamed Package"}
            </CardTitle>
            {packageData.status && (
              <Badge
                variant={
                  packageData.status.toUpperCase() === "ACTIVE"
                    ? "default"
                    : "secondary"
                }
              >
                {packageData.status.toUpperCase()}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">
                Request Amount
              </Label>
              <p className="text-2xl font-bold">
                {packageData.requestAmount.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">
                Total Price
              </Label>
              <p className="text-2xl font-bold text-green-600">
                {formatPrice(packageData.price)}
              </p>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="text-center">
              <Label className="text-sm font-medium text-muted-foreground">
                Price per Request
              </Label>
              <p className="text-xl font-semibold text-green-600">
                {packageData.requestAmount > 0
                  ? formatPrice(packageData.price / packageData.requestAmount)
                  : formatPrice(0)}
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
              packages.find((p) => getPackageId(p) === editingId) ||
              ({
                ticketPackageId: editingId,
                ticketPackageName: packageData.ticketPackageName,
                requestAmount: packageData.requestAmount,
                price: packageData.price,
                status: packageData.status,
              } as TicketPackageListItem);
            handleEdit(packageItem);
          }}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Package
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
        {viewMode === "list" && renderPackageList()}
        {(viewMode === "create" || viewMode === "edit") && renderPackageForm()}
        {viewMode === "view" && renderPackageView()}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Package</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-semibold">
                  {deleteTarget?.ticketPackageName}
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
