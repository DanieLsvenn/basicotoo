"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Edit, Trash2, Search, Award } from "lucide-react";

interface Lawyer {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  experience: number;
  barNumber: string;
  bio: string;
  hourlyRate: number;
  status: "active" | "inactive";
}

export default function LawyersPage() {
  const [lawyers, setLawyers] = useState<Lawyer[]>([
    {
      id: "1",
      name: "Sarah Johnson",
      email: "sarah.johnson@lawfirm.com",
      phone: "+1 (555) 123-4567",
      specialization: "Corporate Law",
      experience: 12,
      barNumber: "BAR123456",
      bio: "Experienced corporate lawyer with expertise in mergers and acquisitions",
      hourlyRate: 450,
      status: "active",
    },
    {
      id: "2",
      name: "Michael Chen",
      email: "michael.chen@lawfirm.com",
      phone: "+1 (555) 987-6543",
      specialization: "Criminal Defense",
      experience: 8,
      barNumber: "BAR789012",
      bio: "Dedicated criminal defense attorney with a strong track record",
      hourlyRate: 350,
      status: "active",
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLawyer, setEditingLawyer] = useState<Lawyer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    experience: 0,
    barNumber: "",
    bio: "",
    hourlyRate: 0,
    status: "active" as "active" | "inactive",
  });

  const filteredLawyers = lawyers.filter(
    (lawyer) =>
      lawyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lawyer.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lawyer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingLawyer) {
      setLawyers(
        lawyers.map((lawyer) =>
          lawyer.id === editingLawyer.id ? { ...lawyer, ...formData } : lawyer
        )
      );
    } else {
      const newLawyer: Lawyer = {
        id: Date.now().toString(),
        ...formData,
      };
      setLawyers([...lawyers, newLawyer]);
    }

    setFormData({
      name: "",
      email: "",
      phone: "",
      specialization: "",
      experience: 0,
      barNumber: "",
      bio: "",
      hourlyRate: 0,
      status: "active",
    });
    setEditingLawyer(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (lawyer: Lawyer) => {
    setEditingLawyer(lawyer);
    setFormData({
      name: lawyer.name,
      email: lawyer.email,
      phone: lawyer.phone,
      specialization: lawyer.specialization,
      experience: lawyer.experience,
      barNumber: lawyer.barNumber,
      bio: lawyer.bio,
      hourlyRate: lawyer.hourlyRate,
      status: lawyer.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setLawyers(lawyers.filter((lawyer) => lawyer.id !== id));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      specialization: "",
      experience: 0,
      barNumber: "",
      bio: "",
      hourlyRate: 0,
      status: "active",
    });
    setEditingLawyer(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Lawyers Management
          </h1>
          <p className="text-muted-foreground">
            Manage your law firm's attorney profiles and information
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Lawyer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLawyer ? "Edit Lawyer Profile" : "Add New Lawyer"}
              </DialogTitle>
              <DialogDescription>
                {editingLawyer
                  ? "Update the lawyer information below."
                  : "Enter the details for the new lawyer."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="barNumber">Bar Number</Label>
                  <Input
                    id="barNumber"
                    value={formData.barNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, barNumber: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    value={formData.specialization}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        specialization: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input
                    id="experience"
                    type="number"
                    value={formData.experience}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        experience: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hourlyRate: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as "active" | "inactive",
                      })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="bio">Biography</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Brief professional biography..."
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingLawyer ? "Update Lawyer" : "Add Lawyer"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lawyers</CardTitle>
          <CardDescription>
            Manage attorney profiles and professional information
          </CardDescription>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lawyer</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Hourly Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLawyers.map((lawyer) => (
                <TableRow key={lawyer.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-medium">{lawyer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {lawyer.email}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center mt-1">
                        <Award className="h-3 w-3 mr-1" />
                        {lawyer.barNumber}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{lawyer.specialization}</TableCell>
                  <TableCell>{lawyer.experience} years</TableCell>
                  <TableCell>${lawyer.hourlyRate}/hr</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        lawyer.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {lawyer.status}
                    </span>
                  </TableCell>
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
                        onClick={() => handleDelete(lawyer.id)}
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
        </CardContent>
      </Card>
    </div>
  );
}
