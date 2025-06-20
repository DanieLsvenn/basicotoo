"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dynamic from "next/dynamic";
import ReactSelect from "react-select";

interface ServiceOption {
  serviceId: string;
  serviceName: string;
  status: "Active" | "Inactive";
}

interface Lawyer {
  accountId: string;
  accountUsername: string;
  accountEmail: string;
  accountFullName: string;
  accountDob: string;
  accountGender: 0 | 1 | 2; // 0: Not Specified, 1: Male, 2: Female
  accountPhone: string;
  accountImage: string;
  aboutLawyer: string;
  accountStatus: "ACTIVE" | "INACTIVE";
  serviceForLawyer?: {
    serviceId: string;
    pricePerHour: number;
  }[];
}

const API_LAWYER = "https://localhost:7218/api/Lawyer";
const API_SERVICE = "https://localhost:7218/api/Service";

const initialFormData = {
  accountUsername: "",
  accountPassword: "",
  accountEmail: "",
  accountFullName: "",
  accountDob: "",
  accountGender: 0,
  accountPhone: "",
  accountImage: "",
  aboutLawyer: "",
  serviceForLawyerDTOs: [],
};

// Dynamically import your rich text editor (replace with your actual editor if needed)
const DynamicEditor = dynamic(() => import("@/components/DynamicEditor"), { ssr: false });

export default function LawyersPage() {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLawyer, setEditingLawyer] = useState<Lawyer | null>(null);
  const [formData, setFormData] = useState<any>(initialFormData);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Lawyer | null>(null);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const [aboutContent, setAboutContent] = useState<string>("");
  const [serviceError, setServiceError] = useState<string | null>(null);
  // Fetch both lawyers and services in parallel
  const fetchData = async () => {
    setLoading(true);
    try {
      const [lawyersRes, servicesRes] = await Promise.all([
        fetch(API_LAWYER),
        fetch(API_SERVICE)
      ]);
      
      const [lawyersData, servicesData] = await Promise.all([
        lawyersRes.json(),
        servicesRes.json()
      ]);
      
      setLawyers(lawyersData);
      setServices(servicesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };  const handleServiceChange = (selected: any[]) => {
    if (!selected || selected.length === 0) {
      setServiceError("Please select at least one service.");
    } else {
      setServiceError(null);
    }
    
    setFormData((prev: any) => ({
      ...prev,
      serviceForLawyerDTOs: selected.map((opt) => {
        const existing = prev.serviceForLawyerDTOs.find((s: any) => s.serviceId === opt.value);
        return {
          serviceId: opt.value,
          pricePerHour: existing ? existing.pricePerHour : 0,
        };
      }),
    }));
  };

  const handlePriceChange = (serviceId: string, price: number) => {
    setFormData((prev: any) => ({
      ...prev,
      serviceForLawyerDTOs: prev.serviceForLawyerDTOs.map((s: any) =>
        s.serviceId === serviceId ? { ...s, pricePerHour: price } : s
      ),
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that at least one service is selected
    if (!formData.serviceForLawyerDTOs || formData.serviceForLawyerDTOs.length === 0) {
      setServiceError("Please select at least one service.");
      return;
    }
    setServiceError(null);

    const method = editingLawyer ? "PUT" : "POST";
    const url = editingLawyer
      ? `${API_LAWYER}/${editingLawyer.accountId}`
      : API_LAWYER;
    const payload = editingLawyer
      ? {
          accountId: editingLawyer.accountId,
          accountFullName: formData.accountFullName,
          accountDob: formData.accountDob,
          accountGender: formData.accountGender,
          accountPhone: formData.accountPhone,
          accountImage: formData.accountImage,
          aboutLawyer: formData.aboutLawyer,
          serviceForLawyer: formData.serviceForLawyerDTOs,
        }
      : {
          ...formData,
          serviceForLawyer: formData.serviceForLawyerDTOs,
        };

    try {
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setFormData(initialFormData);
      setEditingLawyer(null);
      setIsDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };
  const handleEdit = (lawyer: Lawyer) => {
    setEditingLawyer(lawyer);
    setFormData({
      ...lawyer,
      serviceForLawyerDTOs: lawyer.serviceForLawyer || [],
    });
    setServiceError(null);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (lawyer: Lawyer) => {
    setDeleteTarget(lawyer);
    setDeleteDialogOpen(true);
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      await fetch(`${API_LAWYER}/${deleteTarget.accountId}`, { method: "DELETE" });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error deleting lawyer:", error);
    }
  };

  const filteredLawyers = useMemo(
    () =>
      lawyers.filter((lawyer) =>
        [lawyer.accountFullName, lawyer.accountEmail]
          .some((field) => field?.toLowerCase().includes(searchTerm.toLowerCase()))
      ),
    [lawyers, searchTerm]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lawyers Management</h1>
          <p className="text-muted-foreground">Manage your law firm's attorney profiles</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>            <Button onClick={() => {
              setEditingLawyer(null);
              setFormData(initialFormData);
              setServiceError(null);
            }}>
              <Plus className="mr-2 h-4 w-4" /> Add Lawyer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLawyer ? "Edit Lawyer" : "Add Lawyer"}</DialogTitle>
              <DialogDescription>
                {editingLawyer ? "Update lawyer info." : "Fill out to add a new lawyer."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Full Name</label>
                <Input
                  placeholder="Please enter Full Name"
                  value={formData.accountFullName}
                  onChange={(e) => setFormData({ ...formData, accountFullName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Date of Birth</label>
                <Input
                  type="date"
                  placeholder="Please enter Date of Birth"
                  value={formData.accountDob}
                  onChange={(e) => setFormData({ ...formData, accountDob: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Gender</label>
                <Select
                  value={formData.accountGender.toString()}
                  onValueChange={(val) => setFormData({ ...formData, accountGender: parseInt(val) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Please enter Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Male</SelectItem>
                    <SelectItem value="2">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Phone</label>
                <Input
                  placeholder="Please enter Phone"
                  value={formData.accountPhone}
                  onChange={(e) => setFormData({ ...formData, accountPhone: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Image URL</label>
                <Input
                  placeholder="Please enter Image URL"
                  value={formData.accountImage}
                  onChange={(e) => setFormData({ ...formData, accountImage: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">About Lawyer</label>
                <DynamicEditor
                  content={formData.aboutLawyer}
                  onContentChange={(val: string) => setFormData({ ...formData, aboutLawyer: val })}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Services</label>
                <ReactSelect
                  isMulti
                  options={services
                    .filter(s => s.status === "Active")
                    .map(s => ({
                      value: s.serviceId,
                      label: s.serviceName,
                    }))}
                  value={formData.serviceForLawyerDTOs
                    .filter((s: any) => s.serviceId)
                    .map((s: any) => ({
                      value: s.serviceId,
                      label: services.find(opt => opt.serviceId === s.serviceId)?.serviceName || "",
                    }))
                  }                  onChange={handleServiceChange}
                  placeholder="Please select Services"
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
                {serviceError && (
                  <p className="text-red-600 text-sm mt-1">{serviceError}</p>
                )}
              </div>
              {/* Individual price fields for each selected service */}
              {formData.serviceForLawyerDTOs
                .filter((s: any) => s.serviceId)
                .map((s: any) => {
                  const serviceName =
                    services.find(opt => opt.serviceId === s.serviceId)?.serviceName || "Service";
                  return (
                    <div key={s.serviceId}>
                      <label className="block mb-1 font-medium">
                        Price Per Hour for {serviceName}
                      </label>
                      <Input
                        type="number"
                        min={0}
                        placeholder={`Please enter Price Per Hour for ${serviceName}`}
                        value={s.pricePerHour}
                        onChange={e =>
                          handlePriceChange(s.serviceId, parseFloat(e.target.value) || 0)
                        }
                        required
                      />
                    </div>
                  );
                })}
              {!editingLawyer && (
                <>
                  <div>
                    <label className="block mb-1 font-medium">Username</label>
                    <Input
                      placeholder="Please enter Username"
                      value={formData.accountUsername}
                      onChange={(e) => setFormData({ ...formData, accountUsername: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Password</label>
                    <Input
                      type="password"
                      placeholder="Please enter Password"
                      value={formData.accountPassword}
                      onChange={(e) => setFormData({ ...formData, accountPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Email</label>
                    <Input
                      type="email"
                      placeholder="Please enter Email"
                      value={formData.accountEmail}
                      onChange={(e) => setFormData({ ...formData, accountEmail: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}
              <Button type="submit">{editingLawyer ? "Update" : "Create"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lawyers</CardTitle>
          <CardDescription>Manage existing lawyers</CardDescription>
          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search lawyers..."
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
                  <th className="text-left p-4 font-medium">Full Name</th>
                  <th className="text-left p-4 font-medium">Email</th>
                  <th className="text-left p-4 font-medium">Gender</th>
                  <th className="text-left p-4 font-medium">Phone</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">About</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Loading lawyers...
                      </p>
                    </td>
                  </tr>
                ) : filteredLawyers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        No lawyers found
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredLawyers.map((lawyer) => (
                    <tr key={lawyer.accountId} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{lawyer.accountFullName}</td>
                      <td className="p-4">{lawyer.accountEmail}</td>
                      <td className="p-4">
                        {lawyer.accountGender === 0
                          ? ""
                          : lawyer.accountGender === 1
                          ? "Male"
                          : "Female"}
                      </td>
                      <td className="p-4">{lawyer.accountPhone}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            lawyer.accountStatus === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {lawyer.accountStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAboutContent(lawyer.aboutLawyer);
                            setAboutDialogOpen(true);
                          }}
                        >
                          Show About Lawyer
                        </Button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(lawyer)}
                            disabled={loading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {lawyer.accountStatus === "ACTIVE" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(lawyer)}
                              className="text-red-600 hover:text-red-700"
                              disabled={loading}
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
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {filteredLawyers.length} of {lawyers.length} lawyers
            </div>
            {/* Pagination controls can be added here if needed */}
          </div>
        </CardContent>
      </Card>

      {/* About Lawyer Dialog */}
      <Dialog open={aboutDialogOpen} onOpenChange={setAboutDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>About Lawyer</DialogTitle>
          </DialogHeader>
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: aboutContent || "<em>No about info provided.</em>" }} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lawyer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteTarget?.accountFullName}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}