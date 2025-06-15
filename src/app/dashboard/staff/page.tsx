"use client";

import { useState, useEffect } from "react";
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
import { Plus, Edit, Trash2, Search, Loader2 } from "lucide-react";

interface Staff {
  staffId?: string; // Changed from 'id' to 'staffId' to match API
  fullName: string;
  email: string;
  gender: number;
  password: string;
}

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

const API_BASE_URL = "https://localhost:7218/api/Staff";

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    gender: 0,
    password: "",
  });

  const filteredStaff = staff.filter(
    (member) =>
      member.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch all staff members
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}?page=${page}&pageSize=${pageSize}`
      );
      if (response.ok) {
        const data = await response.json(); // Direct array, not wrapped in ApiResponse
        console.log("Fetched staff data:", data); // Debug log
        // Handle both possible response formats
        if (Array.isArray(data)) {
          setStaff(data);
        } else if (data.data && Array.isArray(data.data)) {
          setStaff(data.data);
        } else {
          console.warn("Unexpected API response format:", data);
          setStaff([]);
        }
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch staff:", response.status, errorText);
        setStaff([]);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch active staff members
  const fetchActiveStaff = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/Active?page=${page}&pageSize=${pageSize}`
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched active staff data:", data); // Debug log
        // Handle both possible response formats
        if (Array.isArray(data)) {
          setStaff(data);
        } else if (data.data && Array.isArray(data.data)) {
          setStaff(data.data);
        } else {
          console.warn("Unexpected API response format:", data);
          setStaff([]);
        }
      } else {
        const errorText = await response.text();
        console.error(
          "Failed to fetch active staff:",
          response.status,
          errorText
        );
        setStaff([]);
      }
    } catch (error) {
      console.error("Error fetching active staff:", error);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single staff member by ID
  const fetchStaffById = async (id: string): Promise<Staff | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`);
      if (response.ok) {
        const data = await response.json();
        // Handle both possible response formats
        return data.data || data;
      }
    } catch (error) {
      console.error("Error fetching staff by ID:", error);
    }
    return null;
  };

  // Create new staff member
  const createStaff = async (staffData: Omit<Staff, "staffId">) => {
    try {
      console.log("Creating staff with data:", staffData); // Debug log
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(staffData),
      });

      const responseText = await response.text();
      console.log("Create response:", response.status, responseText); // Debug log

      if (response.ok) {
        // Reset to page 1 to see the new staff member
        setPage(1);
        await fetchStaff(); // Refresh the list
        return true;
      } else {
        console.error(
          "Failed to create staff member:",
          response.status,
          responseText
        );
        alert(`Failed to create staff member: ${responseText}`);
        return false;
      }
    } catch (error) {
      console.error("Error creating staff:", error);
      alert(`Error creating staff: ${error}`);
      return false;
    }
  };

  // Update staff member
  const updateStaff = async (staffData: Staff) => {
    try {
      // Make sure we include the ID in the request body
      const updateData = {
        staffId: staffData.staffId, // Changed from 'id' to 'staffId'
        fullName: staffData.fullName,
        email: staffData.email,
        gender: staffData.gender,
        // Only include password if it's provided
        ...(staffData.password && { password: staffData.password }),
      };

      console.log("Updating staff with data:", updateData); // Debug log

      const response = await fetch(API_BASE_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const responseText = await response.text();
      console.log("Update response:", response.status, responseText); // Debug log

      if (response.ok) {
        await fetchStaff(); // Refresh the list
        return true;
      } else {
        console.error(
          "Failed to update staff member:",
          response.status,
          responseText
        );
        alert(`Failed to update staff member: ${responseText}`);
        return false;
      }
    } catch (error) {
      console.error("Error updating staff:", error);
      alert(`Error updating staff: ${error}`);
      return false;
    }
  };

  // Delete staff member
  const deleteStaff = async (id: string) => {
    try {
      console.log("Deleting staff with ID:", id); // Debug log
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
      });

      const responseText = await response.text();
      console.log("Delete response:", response.status, responseText); // Debug log

      if (response.ok) {
        await fetchStaff(); // Refresh the list
        return true;
      } else {
        console.error(
          "Failed to delete staff member:",
          response.status,
          responseText
        );
        alert(`Failed to delete staff member: ${responseText}`);
        return false;
      }
    } catch (error) {
      console.error("Error deleting staff:", error);
      alert(`Error deleting staff: ${error}`);
      return false;
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [page, pageSize]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let success = false;
    if (editingStaff && editingStaff.staffId) {
      // For updates, merge the existing staff data with form data
      const updateData = {
        ...editingStaff,
        ...formData,
        // Only update password if a new one is provided
        password: formData.password || editingStaff.password,
      };
      success = await updateStaff(updateData);
    } else {
      success = await createStaff(formData);
    }

    if (success) {
      setFormData({
        fullName: "",
        email: "",
        gender: 0,
        password: "",
      });
      setEditingStaff(null);
      setIsDialogOpen(false);
    }
    setLoading(false);
  };

  const handleEdit = (member: Staff) => {
    setEditingStaff(member);
    setFormData({
      fullName: member.fullName || "",
      email: member.email || "",
      gender: member.gender || 0,
      password: "", // Don't pre-fill password for security
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      await deleteStaff(id);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      gender: 0,
      password: "",
    });
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

  return (
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchActiveStaff}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Active Only
          </Button>
          <Button variant="outline" onClick={fetchStaff} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            All Staff
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent>
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
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required={!editingStaff}
                    placeholder={
                      editingStaff ? "Leave blank to keep current password" : ""
                    }
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingStaff ? "Update Staff Member" : "Add Staff Member"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Members ({staff.length} total)</CardTitle>
          <CardDescription>
            A list of all staff members in your organization
          </CardDescription>
          <div className="flex items-center gap-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="pageSize">Page Size:</Label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value));
                  setPage(1); // Reset to first page
                }}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">ID</th>
                  <th className="text-left p-4 font-medium">Full Name</th>
                  <th className="text-left p-4 font-medium">Email</th>
                  <th className="text-left p-4 font-medium">Gender</th>
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
                      <td className="p-4 font-medium">{member.staffId}</td>
                      <td className="p-4">{member.fullName}</td>
                      <td className="p-4">{member.email}</td>
                      <td className="p-4">{getGenderText(member.gender)}</td>
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              member.staffId && handleDelete(member.staffId)
                            }
                            className="text-red-600 hover:text-red-700"
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <span className="text-sm">Page {page}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={loading || filteredStaff.length < pageSize}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
