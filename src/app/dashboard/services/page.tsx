"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Edit, Trash2, Search, Loader2 } from "lucide-react";

interface Service {
  serviceId: string;
  serviceName: string;
  serviceDescription: string;
  status: "Active" | "Inactive";
}

const API_URL = "https://localhost:7218/api/Service";

export default function ServicesPage() {
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    serviceName: "",
    serviceDescription: "",
  });
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  // --- LOGIC METHODS ---

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch services");
      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.error("Failed to fetch services", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createService = async (data: { serviceName: string; serviceDescription: string }) => {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  const updateService = async (service: Service, data: { serviceName: string; serviceDescription: string }) => {
    await fetch(`${API_URL}/${service.serviceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId: service.serviceId, ...data }),
    });
  };

  const deleteService = async (service: Service) => {
    await fetch(`${API_URL}/${service.serviceId}`, { method: "DELETE" });
  };

  // --- HANDLER METHODS ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingService) {
        await updateService(editingService, formData);
      } else {
        await createService(formData);
      }
      setFormData({ serviceName: "", serviceDescription: "" });
      setEditingService(null);
      setIsDialogOpen(false);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to submit service", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      serviceName: service.serviceName,
      serviceDescription: service.serviceDescription,
    });
    setIsDialogOpen(true);
    setRefreshKey((prev) => prev + 1);
  };

  const handleDeleteClick = (service: Service) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
    setRefreshKey((prev) => prev + 1);
  };

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;
    setLoading(true);
    try {
      await deleteService(serviceToDelete);
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to delete service", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ serviceName: "", serviceDescription: "" });
    setEditingService(null);
  };

  // --- EFFECTS ---

  useEffect(() => {
    fetchServices();
  }, [refreshKey]);

  // --- MEMOIZED FILTER ---

  const filteredServices = useMemo(
    () =>
      services.filter(
        (service) =>
          service.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [services, searchTerm]
  );

  // --- RENDER COMPONENT ---

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Management</h1>
          <p className="text-muted-foreground">Manage your law firm's service offerings</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" /> Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingService ? "Edit Service" : "Add New Service"}</DialogTitle>
              <DialogDescription>
                {editingService ? "Update service details." : "Enter new service details."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Service Name</label>
                <Input
                  id="serviceName"
                  placeholder="Please enter Service Name"
                  value={formData.serviceName}
                  onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Description</label>
                <Input
                  id="serviceDescription"
                  placeholder="Please enter Description"
                  value={formData.serviceDescription}
                  onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
                  required
                />
              </div>
              {loading ? (
                <Button type="submit" disabled={loading}>
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  {editingService ? "Update Service" : "Add Service"}
                </Button>
              ) : (
                <Button type="submit">{editingService ? "Update Service" : "Add Service"}</Button>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
          <CardDescription>Browse and manage available services</CardDescription>
          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-left p-4 font-medium">Description</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Loading services...
                      </p>
                    </td>
                  </tr>
                ) : filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        No services found
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((service) => (
                    <tr
                      key={service.serviceId}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-4 font-medium">{service.serviceName}</td>
                      <td className="p-4">{service.serviceDescription}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${service.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}
                        >
                          {service.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(service)}
                            disabled={loading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {service.status === "Active" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(service)}
                              className="text-red-600 hover:text-red-700"
                              aria-label="Delete service"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className="text-gray-400 cursor-not-allowed"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{serviceToDelete?.serviceName}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
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
