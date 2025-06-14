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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ServiceOption {
  serviceId: string;
  serviceName: string;
}

interface Lawyer {
  accountId: string;
  accountUsername: string;
  accountEmail: string;
  accountFullName: string;
  accountDob: string;
  accountGender: number;
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
  accountGender: 1,
  accountPhone: "",
  accountImage: "",
  aboutLawyer: "",
  serviceForLawyerDTOs: [{ serviceId: "", pricePerHour: 0 }],
};

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

  const fetchLawyers = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_LAWYER);
      const data = await res.json();
      setLawyers(data);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    const res = await fetch(API_SERVICE);
    const data = await res.json();
    setServices(data);
  };

  useEffect(() => {
    fetchLawyers();
    fetchServices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      : formData;

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setFormData(initialFormData);
    setEditingLawyer(null);
    setIsDialogOpen(false);
    fetchLawyers();
  };

  const handleEdit = (lawyer: Lawyer) => {
    setEditingLawyer(lawyer);
    setFormData({
      ...lawyer,
      serviceForLawyerDTOs: lawyer.serviceForLawyer || [{ serviceId: "", pricePerHour: 0 }],
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (lawyer: Lawyer) => {
    setDeleteTarget(lawyer);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`${API_LAWYER}/${deleteTarget.accountId}`, { method: "DELETE" });
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
    fetchLawyers();
  };

  const filteredLawyers = useMemo(
    () =>
      lawyers.filter((lawyer) =>
        [lawyer.accountFullName, lawyer.accountEmail, lawyer.aboutLawyer]
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
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingLawyer(null);
              setFormData(initialFormData);
            }}>
              <Plus className="mr-2 h-4 w-4" /> Add Lawyer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLawyer ? "Edit Lawyer" : "Add Lawyer"}</DialogTitle>
              <DialogDescription>
                {editingLawyer ? "Update lawyer info." : "Fill out to add a new lawyer."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Full Name"
                value={formData.accountFullName}
                onChange={(e) => setFormData({ ...formData, accountFullName: e.target.value })}
                required
              />
              <Input
                type="date"
                value={formData.accountDob}
                onChange={(e) => setFormData({ ...formData, accountDob: e.target.value })}
                required
              />
              <Select
                value={formData.accountGender.toString()}
                onValueChange={(val) => setFormData({ ...formData, accountGender: parseInt(val) })}
              >
                <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Male</SelectItem>
                  <SelectItem value="2">Female</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Phone"
                value={formData.accountPhone}
                onChange={(e) => setFormData({ ...formData, accountPhone: e.target.value })}
              />
              <Input
                placeholder="Image URL"
                value={formData.accountImage}
                onChange={(e) => setFormData({ ...formData, accountImage: e.target.value })}
              />
              <Input
                placeholder="About Lawyer"
                value={formData.aboutLawyer}
                onChange={(e) => setFormData({ ...formData, aboutLawyer: e.target.value })}
              />
              <Select
                value={formData.serviceForLawyerDTOs[0].serviceId}
                onValueChange={(val) =>
                  setFormData({
                    ...formData,
                    serviceForLawyerDTOs: [{ ...formData.serviceForLawyerDTOs[0], serviceId: val }],
                  })
                }
              >
                <SelectTrigger><SelectValue placeholder="Select Service" /></SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.serviceId} value={s.serviceId}>
                      {s.serviceName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Price Per Hour"
                value={formData.serviceForLawyerDTOs[0].pricePerHour}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    serviceForLawyerDTOs: [{
                      ...formData.serviceForLawyerDTOs[0],
                      pricePerHour: parseFloat(e.target.value),
                    }],
                  })
                }
              />
              {!editingLawyer && (
                <>
                  <Input
                    placeholder="Username"
                    value={formData.accountUsername}
                    onChange={(e) => setFormData({ ...formData, accountUsername: e.target.value })}
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={formData.accountPassword}
                    onChange={(e) => setFormData({ ...formData, accountPassword: e.target.value })}
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.accountEmail}
                    onChange={(e) => setFormData({ ...formData, accountEmail: e.target.value })}
                    required
                  />
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
          {loading ? (
            <p>Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>About</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLawyers.map((lawyer) => (
                  <TableRow key={lawyer.accountId}>
                    <TableCell>{lawyer.accountFullName}</TableCell>
                    <TableCell>{lawyer.accountEmail}</TableCell>
                    <TableCell>{lawyer.accountPhone}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          lawyer.accountStatus === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {lawyer.accountStatus}
                      </span>
                    </TableCell>
                    <TableCell>{lawyer.aboutLawyer}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(lawyer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(lawyer)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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