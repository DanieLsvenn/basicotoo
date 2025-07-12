"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Edit, Trash2, Search, Loader2, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { MaxWidthWrapper } from "@/components/max-width-wrapper";

interface Staff {
  staffId?: string;
  username?: string;
  fullName: string;
  email: string;
  gender: number;
  password?: string;
  imageUrl: string;
  status?: "ACTIVE" | "INACTIVE";
}

const API_BASE_URL = "https://localhost:7218/api/Staff";

const initialFormData = {
  username: "",
  fullName: "",
  email: "",
  gender: 0,
  password: "",
  imageUrl: "",
};

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // --- LOGIC METHODS ---

  // Fetch all staff and determine their status
  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch both all staff and active staff
      const [allStaffResponse, activeStaffResponse] = await Promise.all([
        fetch(`${API_BASE_URL}?page=1&pageSize=100`),
        fetch(`${API_BASE_URL}/Active?page=1&pageSize=100`),
      ]);

      if (allStaffResponse.ok && activeStaffResponse.ok) {
        const allStaffData = await allStaffResponse.json();
        const activeStaffData = await activeStaffResponse.json();

        // Handle both possible response formats
        const allStaff = Array.isArray(allStaffData)
          ? allStaffData
          : allStaffData.data || [];
        const activeStaff = Array.isArray(activeStaffData)
          ? activeStaffData
          : activeStaffData.data || [];

        // Create a set of active staff IDs for quick lookup
        const activeStaffIds = new Set(
          activeStaff.map((s: Staff) => s.staffId)
        );

        // Add status to each staff member
        const staffWithStatus = allStaff.map((member: Staff) => ({
          ...member,
          status: activeStaffIds.has(member.staffId) ? "ACTIVE" : "INACTIVE",
        }));

        setStaff(staffWithStatus);
      } else {
        console.error("Failed to fetch staff data");
        setStaff([]);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
      setStaff([]);
    } finally {
      setLoading(false);
    }
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
      setFormData((prev) => ({
        ...prev,
        imageUrl: url,
      }));

      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Create new staff member
  const createStaff = async (staffData: Omit<Staff, "staffId">) => {
    try {
      console.log("Creating staff with data:", staffData);
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(staffData),
      });

      const responseText = await response.text();
      console.log("Create response:", response.status, responseText);

      if (response.ok) {
        setRefreshKey((prev) => prev + 1);
        return true;
      } else {
        console.error(
          "Failed to create staff member:",
          response.status,
          responseText
        );
        toast.error(`Failed to create staff member: ${responseText}`);
        return false;
      }
    } catch (error) {
      console.error("Error creating staff:", error);
      toast.error(`Error creating staff: ${error}`);
      return false;
    }
  };

  // Update staff member
  const updateStaff = async (staffData: Staff) => {
    try {
      const updateData = {
        staffId: staffData.staffId,
        fullName: staffData.fullName,
        email: staffData.email,
        gender: staffData.gender,
        imageUrl: staffData.imageUrl,
      };

      console.log("Updating staff with data:", updateData);

      const response = await fetch(API_BASE_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const responseText = await response.text();
      console.log("Update response:", response.status, responseText);

      if (response.ok) {
        setRefreshKey((prev) => prev + 1);
        return true;
      } else {
        console.error(
          "Failed to update staff member:",
          response.status,
          responseText
        );
        toast.error(`Failed to update staff member: ${responseText}`);
        return false;
      }
    } catch (error) {
      console.error("Error updating staff:", error);
      toast.error(`Error updating staff: ${error}`);
      return false;
    }
  };

  // Delete staff member
  const deleteStaff = async (id: string) => {
    try {
      console.log("Deleting staff with ID:", id);
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
      });

      const responseText = await response.text();
      console.log("Delete response:", response.status, responseText);

      if (response.ok) {
        setRefreshKey((prev) => prev + 1);
        return true;
      } else {
        console.error(
          "Failed to delete staff member:",
          response.status,
          responseText
        );
        toast.error(`Failed to delete staff member: ${responseText}`);
        return false;
      }
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error(`Error deleting staff: ${error}`);
      return false;
    }
  };

  // --- HANDLER METHODS ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let success = false;
    if (editingStaff && editingStaff.staffId) {
      const updateData = {
        ...editingStaff,
        ...formData,
      };
      success = await updateStaff(updateData);
    } else {
      success = await createStaff(formData);
    }

    if (success) {
      setFormData(initialFormData);
      setEditingStaff(null);
      setIsDialogOpen(false);
    }
    setLoading(false);
  };

  const handleEdit = (member: Staff) => {
    setEditingStaff(member);
    setFormData({
      username: member.username || "",
      fullName: member.fullName || "",
      email: member.email || "",
      gender: member.gender || 0,
      password: "",
      imageUrl: member.imageUrl || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (member: Staff) => {
    setDeleteTarget(member);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.staffId) return;
    await deleteStaff(deleteTarget.staffId);
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingStaff(null);
  };

  const getGenderText = (gender: number) => {
    switch (gender) {
      case 0:
        return "Male";
      case 1:
        return "Female";
      case 2:
        return "Other";
      default:
        return "Unknown";
    }
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
    fetchStaff();
  }, [refreshKey]);

  const filteredStaff = useMemo(
    () =>
      staff.filter(
        (member) =>
          member.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [staff, searchTerm]
  );

  return (
    <MaxWidthWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Staff Management
            </h1>
            <p className="text-muted-foreground">
              Manage your law firm's staff members
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
                </DialogTitle>
                <DialogDescription>
                  {editingStaff
                    ? "Update the staff member information below."
                    : "Enter the details for the new staff member."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Profile Image Upload Section */}
                <div className="flex flex-col items-center space-y-4 p-4 border rounded-lg bg-gray-50">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage
                        src={formData.imageUrl || ""}
                        alt={formData.fullName || "Staff"}
                      />
                      <AvatarFallback className="text-lg font-semibold">
                        {formData.fullName
                          ? getInitials(formData.fullName)
                          : "S"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2">
                      <input
                        type="file"
                        id="staff-image-upload"
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
                          document.getElementById("staff-image-upload")?.click()
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

                {!editingStaff && (
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      required
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gender: parseInt(e.target.value),
                      })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value={0}>Male</option>
                    <option value={1}>Female</option>
                    <option value={2}>Other</option>
                  </select>
                </div>

                {!editingStaff && (
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || isUploadingImage}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingStaff ? "Update Staff Member" : "Add Staff Member"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Staff Members ({staff.length} total)</CardTitle>
            <CardDescription>
              A list of all staff members in your organization
            </CardDescription>
            <div className="relative max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff..."
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
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Loading staff...
                        </p>
                      </td>
                    </tr>
                  ) : filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8">
                        <p className="text-sm text-muted-foreground">
                          No staff members found
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((member) => (
                      <tr
                        key={member.staffId}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={member.imageUrl || ""}
                              alt={member.fullName}
                            />
                            <AvatarFallback className="text-sm font-semibold">
                              {getInitials(member.fullName)}
                            </AvatarFallback>
                          </Avatar>
                        </td>
                        <td className="p-4 font-medium">{member.fullName}</td>
                        <td className="p-4">{member.email}</td>
                        <td className="p-4">{getGenderText(member.gender)}</td>
                        <td className="p-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              member.status === "ACTIVE"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {member.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(member)}
                              disabled={loading}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {member.status === "ACTIVE" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(member)}
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
                Showing {filteredStaff.length} of {staff.length} staff members
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Staff Member</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-semibold">{deleteTarget?.fullName}</span>?
                This action cannot be undone.
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
