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
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Camera,
  Upload,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import dynamic from "next/dynamic";
import ReactSelect, { MultiValue, ActionMeta } from "react-select";
import { toast } from "sonner";
import { MaxWidthWrapper } from "@/components/max-width-wrapper";

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

// Dynamically import your rich text editor
const DynamicEditor = dynamic(() => import("@/components/DynamicEditor"), {
  ssr: false,
});

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
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // --- LOGIC METHODS ---

  // Fetch all lawyers
  const fetchLawyers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_LAWYER);
      const data = await res.json();
      setLawyers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all services
  const fetchServices = useCallback(async () => {
    const res = await fetch(API_SERVICE);
    const data = await res.json();
    setServices(data);
  }, []);

  // Handle image upload
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setIsUploadingImage(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      // Upload to Cloudinary via your API route
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      const { url } = await uploadResponse.json();

      // Update the form data with the new image URL
      setFormData((prev: any) => ({
        ...prev,
        accountImage: url,
      }));

      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Delete a lawyer (logic)
  const deleteLawyer = async (lawyer: Lawyer) => {
    await fetch(`${API_LAWYER}/${lawyer.accountId}`, { method: "DELETE" });
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
    await fetchLawyers();
  };

  // Edit a lawyer (logic)
  const editLawyer = (lawyer: Lawyer) => {
    setEditingLawyer(lawyer);
    setFormData({
      ...lawyer,
      serviceForLawyerDTOs: lawyer.serviceForLawyer || [],
    });
    setIsDialogOpen(true);
  };

  // Update price for a service (logic)
  const updateServicePrice = (serviceId: string, price: number) => {
    setFormData((prev: any) => ({
      ...prev,
      serviceForLawyerDTOs: prev.serviceForLawyerDTOs.map((s: any) =>
        s.serviceId === serviceId ? { ...s, pricePerHour: price } : s
      ),
    }));
  };

  // Update selected services (logic)
  const updateSelectedServices = (
    selected: MultiValue<ServiceSelectOption>,
    _actionMeta: ActionMeta<ServiceSelectOption>
  ) => {
    setFormData((prev: any) => {
      const newServiceForLawyerDTOs = (selected as ServiceSelectOption[]).map(
        (opt) => {
          const existing = prev.serviceForLawyerDTOs.find(
            (s: any) => s.serviceId === opt.value
          );
          return {
            serviceId: opt.value,
            pricePerHour: existing ? existing.pricePerHour : 0,
          };
        }
      );
      return {
        ...prev,
        serviceForLawyerDTOs: newServiceForLawyerDTOs,
      };
    });
  };

  // Submit form (logic)
  const submitLawyerForm = async () => {
    // Password validation for create only
    if (!editingLawyer) {
      const password = formData.accountPassword;
      if (
        typeof password !== "string" ||
        password.length < 6 ||
        password.length > 100
      ) {
        setPasswordError("Password must be between 6 and 100 characters.");
        setLoading(false);
        return false;
      } else {
        setPasswordError(null);
      }
    }

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
          serviceForLawyerDTOs: formData.serviceForLawyerDTOs,
        };

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setFormData(initialFormData);
    setEditingLawyer(null);
    setIsDialogOpen(false);

    setLoading(true);
    await fetchLawyers();
    setLoading(false);
    return true;
  };

  // --- HANDLER METHODS ---

  const handleDelete = (lawyer: Lawyer) => {
    setDeleteTarget(lawyer);
    setDeleteDialogOpen(true);
    setRefreshKey((prev) => prev + 1);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteLawyer(deleteTarget);
    setRefreshKey((prev) => prev + 1);
  };

  const handleEdit = (lawyer: Lawyer) => {
    editLawyer(lawyer);
    setRefreshKey((prev) => prev + 1);
  };

  const handlePriceChange = (serviceId: string, price: number) => {
    updateServicePrice(serviceId, price);
  };

  const handleServiceChange = (
    selected: MultiValue<ServiceSelectOption>,
    actionMeta: ActionMeta<ServiceSelectOption>
  ) => {
    updateSelectedServices(selected, actionMeta);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await submitLawyerForm();
    setLoading(false);
    setRefreshKey((prev) => prev + 1);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    fetchLawyers();
    fetchServices();
  }, [refreshKey]);

  const filteredLawyers = useMemo(
    () =>
      lawyers.filter((lawyer) =>
        [lawyer.accountFullName, lawyer.accountEmail].some((field) =>
          field?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      ),
    [lawyers, searchTerm]
  );

  // --- RENDER COMPONENT ---
  return (
    <MaxWidthWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Lawyers Management
            </h1>
            <p className="text-muted-foreground">
              Manage your law firm's attorney profiles
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingLawyer(null);
                  setFormData(initialFormData);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Lawyer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingLawyer ? "Edit Lawyer" : "Add Lawyer"}
                </DialogTitle>
                <DialogDescription>
                  {editingLawyer
                    ? "Update lawyer info."
                    : "Fill out to add a new lawyer."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Profile Image Upload Section */}
                <div className="flex flex-col items-center space-y-4 p-4 border rounded-lg bg-gray-50">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage
                        src={formData.accountImage || ""}
                        alt={formData.accountFullName || "Lawyer"}
                      />
                      <AvatarFallback className="text-lg font-semibold">
                        {formData.accountFullName
                          ? getInitials(formData.accountFullName)
                          : "L"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2">
                      <input
                        type="file"
                        id="lawyer-image-upload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 rounded-full p-0"
                        onClick={() =>
                          document
                            .getElementById("lawyer-image-upload")
                            ?.click()
                        }
                        disabled={isUploadingImage}
                      >
                        {isUploadingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Click the camera icon to upload a profile picture
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Max file size: 5MB. Supported formats: JPG, PNG, GIF
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 font-medium">Full Name</label>
                  <Input
                    placeholder="Please enter Full Name"
                    value={formData.accountFullName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        accountFullName: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">
                    Date of Birth
                  </label>
                  <Input
                    type="date"
                    placeholder="Please enter Date of Birth"
                    value={formData.accountDob}
                    onChange={(e) =>
                      setFormData({ ...formData, accountDob: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Gender</label>
                  <Select
                    value={formData.accountGender.toString()}
                    onValueChange={(val) =>
                      setFormData({ ...formData, accountGender: parseInt(val) })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, accountPhone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">About Lawyer</label>
                  <DynamicEditor
                    content={formData.aboutLawyer}
                    onContentChange={(val: string) =>
                      setFormData({ ...formData, aboutLawyer: val })
                    }
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Services</label>
                  <ReactSelect<ServiceSelectOption, true>
                    isMulti
                    options={services
                      .filter((s) => s.status === "Active")
                      .map((s) => ({
                        value: s.serviceId,
                        label: s.serviceName,
                      }))}
                    value={formData.serviceForLawyerDTOs.map((s: any) => ({
                      value: s.serviceId,
                      label:
                        services.find((opt) => opt.serviceId === s.serviceId)
                          ?.serviceName || "",
                    }))}
                    onChange={handleServiceChange}
                    placeholder="Please select Services"
                    className="basic-multi-select"
                    classNamePrefix="select"
                  />
                </div>
                {/* Individual price fields for each selected service */}
                {formData.serviceForLawyerDTOs.map((s: any) => {
                  const serviceName =
                    services.find((opt) => opt.serviceId === s.serviceId)
                      ?.serviceName || "Service";
                  return (
                    <div key={s.serviceId}>
                      <label className="block mb-1 font-medium">
                        Price Per Hour for {serviceName}
                      </label>
                      <Input
                        type="number"
                        placeholder={`Please enter Price Per Hour for ${serviceName}`}
                        value={s.pricePerHour}
                        onChange={(e) =>
                          handlePriceChange(
                            s.serviceId,
                            parseFloat(e.target.value) || 0
                          )
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
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            accountUsername: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-medium">Password</label>
                      <Input
                        type="password"
                        placeholder="Please enter Password"
                        value={formData.accountPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            accountPassword: e.target.value,
                          })
                        }
                        required
                      />
                      {passwordError && (
                        <label className="text-red-600 text-sm mt-1 block">
                          {passwordError}
                        </label>
                      )}
                    </div>
                    <div>
                      <label className="block mb-1 font-medium">Email</label>
                      <Input
                        type="email"
                        placeholder="Please enter Email"
                        value={formData.accountEmail}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            accountEmail: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </>
                )}
                <Button type="submit" disabled={loading || isUploadingImage}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {editingLawyer ? "Updating..." : "Adding..."}
                    </>
                  ) : editingLawyer ? (
                    "Update Lawyer"
                  ) : (
                    "Add Lawyer"
                  )}
                </Button>
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
                    <th className="text-left p-4 font-medium">Profile</th>
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
                      <td colSpan={8} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Loading lawyers...
                        </p>
                      </td>
                    </tr>
                  ) : filteredLawyers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8">
                        <p className="text-sm text-muted-foreground">
                          No lawyers found
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredLawyers.map((lawyer) => (
                      <tr
                        key={lawyer.accountId}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={lawyer.accountImage || ""}
                              alt={lawyer.accountFullName}
                            />
                            <AvatarFallback className="text-sm font-semibold">
                              {getInitials(lawyer.accountFullName)}
                            </AvatarFallback>
                          </Avatar>
                        </td>
                        <td className="p-4 font-medium">
                          {lawyer.accountFullName}
                        </td>
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
                                onClick={() => handleDelete(lawyer)}
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
            </div>
          </CardContent>
        </Card>

        {/* About Lawyer Dialog */}
        <Dialog open={aboutDialogOpen} onOpenChange={setAboutDialogOpen}>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>About Lawyer</DialogTitle>
            </DialogHeader>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{
                __html: aboutContent || "<em>No about info provided.</em>",
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Lawyer</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-semibold">
                  {deleteTarget?.accountFullName}
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

type ServiceSelectOption = { value: string; label: string };
