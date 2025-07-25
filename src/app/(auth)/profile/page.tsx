//src/app/(auth)/profile/page.tsx

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  User,
  Mail,
  Calendar,
  Edit3,
  Save,
  X,
  Shield,
  CreditCard,
  Activity,
  Settings,
  Camera,
  MessageSquare,
  Clock,
  CheckCircle,
  RefreshCw,
  Landmark,
  FileText,
  Download,
  Edit,
  Loader2,
  Ticket,
} from "lucide-react";
import Cookies from "js-cookie";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

interface UserProfile {
  accountId: string;
  email: string;
  fullName: string;
  username: string;
  gender: number;
  accountTicketRequest: number;
  image?: string;
  createdAt?: string;
  lastLogin?: string;
}

interface ProfileStats {
  totalBookings: number;
  activeTickets: number;
  completedBookings: number;
  memberSince: string;
}

interface Ticket {
  ticketId: string;
  userId: string;
  staffId: string | null;
  serviceId: string;
  content_Send: string;
  content_Response: string | null;
  status: "InProgress" | "ANSWERED";
}

// New interfaces for PurchasedFormsTab
interface PurchasedForm {
  customerFormId: string;
  formTemplateId: string;
  customerId: string;
  status: "NOTUSED" | "USED";
  customerFormData?: string;
}

interface FormTemplate {
  formTemplateId: string;
  formTemplateName: string;
  formTemplateData: string;
  price: number;
  status: string;
}

interface PurchasedFormWithTemplate extends PurchasedForm {
  template?: FormTemplate;
}

// New interfaces for SendTicketForm
interface Service {
  serviceId: string;
  serviceName: string;
  serviceDescription: string;
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    gender: 0,
  });
  const [completedBookings, setCompletedBookings] = useState<any[]>([]);
  const [isLoadingCompletedBookings, setIsLoadingCompletedBookings] =
    useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackBooking, setFeedbackBooking] = useState<any>(null);
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [bookingsPending, setBookingsPending] = useState<any[]>([]);
  const [bookingsPaid, setBookingsPaid] = useState<any[]>([]);
  const [isLoadingBookingsPending, setIsLoadingBookingsPending] = useState(false);
  const [isLoadingBookingsPaid, setIsLoadingBookingsPaid] = useState(false);
  const [bookingsTab, setBookingsTab] = useState<"Pending" | "Paid">("Pending");

  // State variables for PurchasedFormsTab
  const [purchasedForms, setPurchasedForms] = useState<PurchasedFormWithTemplate[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(true);
  const [downloadingForms, setDownloadingForms] = useState<Set<string>>(new Set());

  // State variables for SendTicketForm
  const [content, setContent] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  const fetchProfile = async () => {
    try {
      const token = Cookies.get("authToken");
      const response = await fetch(
        "https://localhost:7218/api/Account/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setEditForm({
          fullName: data.fullName || "",
          gender: data.gender || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      toast.error("Failed to load profile data", {
        description: "Please try again later.",
        onAutoClose: (t) => console.log(`Auto-closed toast: ${t.id}`),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const fetchTickets = async () => {
    if (!profile?.accountId) return;

    setIsLoadingTickets(true);
    try {
      const token = Cookies.get("authToken");
      const response = await fetch(
        `https://localhost:7103/api/Ticket/by-customer?userid=${profile.accountId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      } else {
        throw new Error("Failed to fetch tickets");
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
      toast.error("Failed to load tickets", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const fetchStats = async () => {
    // Mock stats - replace with actual API call
    setStats({
      totalBookings: 12,
      activeTickets: 25,
      completedBookings: 8,
      memberSince: "January 2024",
    });
  };

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
      const formData = new FormData();
      formData.append("file", file);

      // Upload to Cloudinary
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      const { url } = await uploadResponse.json();

      // Update profile with new image URL
      const token = Cookies.get("authToken");
      const updateResponse = await fetch(
        "https://localhost:7218/api/Account/profile/update",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fullName: profile?.fullName,
            gender: profile?.gender,
            image: url, // Send the Cloudinary URL
          }),
        }
      );

      if (updateResponse.ok) {
        // Update local state
        setProfile((prev) => (prev ? { ...prev, image: url } : null));
        toast.success("Profile picture updated successfully");
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast.error("Failed to update profile picture");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const token = Cookies.get("authToken");
      const response = await fetch(
        "https://localhost:7218/api/Account/profile/update",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fullName: editForm.fullName,
            gender: editForm.gender,
          }),
        }
      );

      if (response.ok) {
        // Update the profile state with the new values
        setProfile((prev) =>
          prev
            ? {
              ...prev,
              fullName: editForm.fullName,
              gender: editForm.gender,
            }
            : null
        );

        setIsEditing(false);
        toast.success("Profile updated successfully", {
          onDismiss: (t) => console.log(`User dismissed toast: ${t.id}`),
        });
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile", {
        description: "Please check your input and try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      fullName: profile?.fullName || "",
      gender: profile?.gender || 0,
    });
    setIsEditing(false);
  };

  const getInitials = useCallback((name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 1);
  }, []);

  const getGenderText = useCallback((gender: number) => {
    switch (gender) {
      case 0:
        return "Male";
      case 1:
        return "Female";
      default:
        return "Not specified";
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "ANSWERED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "InProgress":
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case "ANSWERED":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Answered
          </Badge>
        );
      case "InProgress":
        return (
          <Badge variant="default" className="bg-orange-100 text-orange-800">
            In Progress
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }, []);

  const handleTicketSent = useCallback(() => {
    // Refresh tickets when a new ticket is sent
    fetchTickets();
  }, []);

  // Memoized computed values
  const userInitials = useMemo(() => {
    return profile?.fullName ? getInitials(profile.fullName) : "";
  }, [profile?.fullName, getInitials]);

  const userGenderText = useMemo(() => {
    return profile ? getGenderText(profile.gender) : "";
  }, [profile?.gender, getGenderText]);

  const fetchBookingsPending = async () => {
    if (!profile?.accountId) return;
    setIsLoadingBookingsPending(true);
    try {
      const token = Cookies.get("authToken");
      const response = await fetch(
        `https://localhost:7286/api/Booking?customerId=${profile.accountId}&status=Pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 204) {
        setBookingsPending([]);
      } else if (response.ok) {
        const data = await response.json();
        setBookingsPending(data);
      } else {
        throw new Error("Failed to fetch pending bookings");
      }
    } catch (error) {
      toast.error("Failed to load pending bookings");
    } finally {
      setIsLoadingBookingsPending(false);
    }
  };

  const fetchBookingsPaid = async () => {
    if (!profile?.accountId) return;
    setIsLoadingBookingsPaid(true);
    try {
      const token = Cookies.get("authToken");
      const response = await fetch(
        `https://localhost:7286/api/Booking?customerId=${profile.accountId}&status=Paid`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 204) {
        setBookingsPaid([]);
      } else if (response.ok) {
        const data = await response.json();
        setBookingsPaid(data);
      } else {
        throw new Error("Failed to fetch paid bookings");
      }
    } catch (error) {
      toast.error("Failed to load paid bookings");
    } finally {
      setIsLoadingBookingsPaid(false);
    }
  };

  const fetchCompletedBookings = async () => {
    if (!profile?.accountId) return;
    setIsLoadingCompletedBookings(true);
    try {
      const token = Cookies.get("authToken");
      const response = await fetch(
        `https://localhost:7286/api/Booking?customerId=${profile.accountId}&status=Completed`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 204) {
        setCompletedBookings([]);
      } else if (response.ok) {
        const data = await response.json();
        setCompletedBookings(data);
      } else {
        throw new Error("Failed to fetch completed bookings");
      }
    } catch (error) {
      toast.error("Failed to load completed bookings");
    } finally {
      setIsLoadingCompletedBookings(false);
    }
  };

  // ===== FUNCTIONS FROM PurchasedFormsTab =====
  const fetchPurchasedFormsWithTemplates = useCallback(async () => {
    if (!profile?.accountId) {
      console.log("No customer ID available");
      return;
    }

    setIsLoadingForms(true);
    try {
      const token = Cookies.get("authToken");

      if (!token) {
        toast.error("Please log in to view your forms");
        return;
      }

      console.log("Fetching forms for customer:", profile.accountId);

      // First, fetch purchased forms
      const formsResponse = await fetch(
        `https://localhost:7276/api/form/customer/${profile.accountId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!formsResponse.ok) {
        if (formsResponse.status === 404) {
          console.log("No forms found for customer");
          setPurchasedForms([]);
          return;
        }
        throw new Error(`Failed to fetch forms: ${formsResponse.status}`);
      }

      const purchasedFormsData: PurchasedForm[] = await formsResponse.json();
      console.log("Fetched purchased forms:", purchasedFormsData);

      // Only fetch templates if we have forms
      if (purchasedFormsData.length === 0) {
        setPurchasedForms([]);
        return;
      }

      // Then fetch templates
      const templatesResponse = await fetch(
        `https://localhost:7276/api/templates`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (templatesResponse.ok) {
        const allTemplates: FormTemplate[] = await templatesResponse.json();
        console.log("Fetched templates:", allTemplates.length);

        // Create map and combine data
        const templatesMap = new Map<string, FormTemplate>();
        allTemplates.forEach((template) => {
          templatesMap.set(template.formTemplateId, template);
        });

        const formsWithTemplates: PurchasedFormWithTemplate[] =
          purchasedFormsData.map((form) => ({
            ...form,
            template: templatesMap.get(form.formTemplateId),
          }));

        console.log("Combined forms with templates:", formsWithTemplates);
        setPurchasedForms(formsWithTemplates);
      } else {
        console.warn(
          "Templates fetch failed, showing forms without template data"
        );
        setPurchasedForms(purchasedFormsData);
        toast.error("Failed to load form template details");
      }
    } catch (error) {
      console.error("Failed to fetch purchased forms:", error);
      toast.error("Failed to load purchased forms");
      setPurchasedForms([]); // Set empty array on error
    } finally {
      setIsLoadingForms(false);
    }
  }, [profile?.accountId]);

  const handleDownloadForm = async (form: PurchasedFormWithTemplate) => {
    const formName = form.template?.formTemplateName || "Untitled Form";

    setDownloadingForms((prev) => new Set(prev).add(form.customerFormId));

    try {
      // Use the customer's form data (which might be edited) or fall back to template data
      const contentToDownload =
        form.customerFormData ||
        form.template?.formTemplateData ||
        "No content available";

      await generateAndDownloadPDF(contentToDownload, formName);
      toast.success("Form downloaded successfully");
    } catch (error) {
      console.error("Failed to download form:", error);
      toast.error("Failed to download form");
    } finally {
      setDownloadingForms((prev) => {
        const newSet = new Set(prev);
        newSet.delete(form.customerFormId);
        return newSet;
      });
    }
  };

  const generateAndDownloadPDF = async (
    formContent: string,
    formName: string
  ) => {
    const safeFormName = formName || "form_download";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${safeFormName}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              line-height: 1.6;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .content { 
              line-height: 1.6; 
            }
            h1 { 
              color: #333; 
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${safeFormName}</h1>
          </div>
          <div class="content">
            ${formContent}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeFormName.replace(/[^a-z0-9]/gi, "_")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEditForm = (form: PurchasedFormWithTemplate) => {
    // Navigate to edit page or open edit modal
    window.location.href = `/edit-form/${form.customerFormId}`;
  };

  // ===== FUNCTIONS FROM SendTicketForm =====
  const fetchServices = async () => {
    try {
      const token = Cookies.get("authToken");
      const response = await fetch("https://localhost:7218/active-services", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setServices(data);
        if (data.length > 0) {
          setSelectedServiceId(data[0].serviceId);
        }
      } else {
        throw new Error("Failed to fetch services");
      }
    } catch (error) {
      console.error("Failed to fetch services:", error);
      toast.error("Failed to load services", {
        description: "Please refresh the page and try again.",
      });
    } finally {
      setIsLoadingServices(false);
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedServiceId) {
      toast.error("Please select a service", {
        description: "You must select a service to send your request.",
      });
      return;
    }

    if (!content.trim()) {
      toast.error("Please enter your request", {
        description: "Your request message cannot be empty.",
      });
      return;
    }

    if (!profile?.accountId) {
      toast.error("Account information not available", {
        description: "Please refresh the page and try again.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = Cookies.get("authToken");

      const response = await fetch("https://localhost:7103/api/Ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: profile.accountId,
          serviceId: selectedServiceId,
          content_Send: content,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send ticket");
      }

      toast.success("Ticket sent successfully", {
        description: "Staff will respond to your request soon.",
      });

      setContent("");
      if (services.length > 0) {
        setSelectedServiceId(services[0].serviceId);
      }

      // Refresh tickets after successful submission
      handleTicketSent();
    } catch (error) {
      console.error("Failed to send ticket:", error);
      toast.error("Error", {
        description: "Failed to send ticket. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch both on profile/accountId change
  useEffect(() => {
    if (profile?.accountId) {
      fetchBookingsPending();
      fetchBookingsPaid();
    }
  }, [profile?.accountId]);

  // Fetch profile and stats on initial load
  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  // Fetch tickets when profile.accountId is available
  useEffect(() => {
    if (profile?.accountId) {
      fetchTickets();
    }
  }, [profile?.accountId]);

  // Fetch purchased forms when profile.accountId is available
  useEffect(() => {
    if (profile?.accountId) {
      fetchPurchasedFormsWithTemplates();
    }
  }, [profile?.accountId, fetchPurchasedFormsWithTemplates]);

  // Fetch services for ticket form on initial load
  useEffect(() => {
    fetchServices();
  }, []);

  // Helper to format price as currency
  const formatPrice = useCallback((price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }, []);

  // Fetch feedback for a booking
  const fetchFeedbackForBooking = async (bookingId: string) => {
    try {
      const res = await fetch(
        `https://localhost:7286/api/feedback/booking/${bookingId}`
      );
      if (res.ok) {
        const data = await res.json();
        setFeedbackContent(data.feedbackContent || "");
        setFeedbackRating(data.rating || 5);
        setFeedbackId(data.feedbackId);
      } else {
        setFeedbackContent("");
        setFeedbackRating(5);
        setFeedbackId(null);
      }
    } catch {
      setFeedbackContent("");
      setFeedbackRating(5);
      setFeedbackId(null);
    }
  };

  // Open feedback dialog for a booking
  const handleOpenFeedback = async (booking: any) => {
    setFeedbackBooking(booking);
    await fetchFeedbackForBooking(booking.bookingId);
    setFeedbackDialogOpen(true);
  };

  // Submit feedback (create or update)
  const handleSubmitFeedback = async () => {
    if (!feedbackBooking) return;
    setSubmittingFeedback(true);
    try {
      const token = Cookies.get("authToken");
      const url = feedbackId
        ? `https://localhost:7286/api/feedback/${feedbackId}`
        : "https://localhost:7286/api/feedback";
      const method = feedbackId ? "PUT" : "POST";
      const body = feedbackId
        ? JSON.stringify({ feedbackContent, rating: feedbackRating })
        : JSON.stringify({
          bookingId: feedbackBooking.bookingId,
          customerId: profile?.accountId,
          feedbackContent,
          rating: feedbackRating,
        });

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      if (res.ok) {
        toast.success("Feedback submitted!");
        setFeedbackDialogOpen(false);
        // Optionally refresh bookings or feedback state here
      } else {
        throw new Error("Failed to submit feedback");
      }
    } catch (error) {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded-md w-32 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded-md w-64 animate-pulse"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded-md w-20 animate-pulse"></div>
          </div>

          {/* Tabs Skeleton */}
          <div className="space-y-6">
            <div className="h-10 bg-gray-200 rounded-md w-full animate-pulse"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded-md w-full animate-pulse"></div>
              <div className="h-24 bg-gray-200 rounded-md w-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Failed to load profile data
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
          <Button variant="outline" onClick={logout}>
            Sign out
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="forms">My Forms</TabsTrigger>
            <TabsTrigger value="tickets">Support</TabsTrigger>
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Profile Header Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage
                        src={profile.image || ""}
                        alt={profile.fullName}
                      />
                      <AvatarFallback className="text-lg font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2">
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 rounded-full p-0"
                        onClick={() =>
                          document.getElementById("avatar-upload")?.click()
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
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{profile.fullName}</h2>
                    <p className="text-muted-foreground">@{profile.username}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {profile.email}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      AccountId: {profile.accountId}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="flex items-center space-x-1"
                  >
                    <Shield className="h-3 w-3" />
                    <span>Verified</span>
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold">
                          {profile.accountTicketRequest}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Available Tickets
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold">
                          {stats.totalBookings}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total Bookings
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-8 w-8 text-orange-600" />
                      <div>
                        <p className="text-2xl font-bold">
                          {stats.activeTickets}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Active Tickets
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <User className="h-8 w-8 text-purple-600" />
                      <div>
                        <p className="text-2xl font-bold">
                          {stats.completedBookings}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Completed
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Personal Information</CardTitle>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="fullName"
                        value={editForm.fullName}
                        onChange={(e) =>
                          setEditForm({ ...editForm, fullName: e.target.value })
                        }
                      />
                    ) : (
                      <p className="text-sm py-2">{profile.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <p className="text-sm py-2">@{profile.username}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <p className="text-sm py-2">{profile.email}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    {isEditing ? (
                      <select
                        id="gender"
                        value={editForm.gender}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            gender: Number(e.target.value),
                          })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value={0}>Male</option>
                        <option value={1}>Female</option>
                      </select>
                    ) : (
                      <p className="text-sm py-2">
                        {userGenderText}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Account ID</Label>
                    <p className="text-sm text-muted-foreground font-mono">
                      {profile.accountId}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Member Since</Label>
                    <p className="text-sm text-muted-foreground">
                      {stats?.memberSince || "January 2024"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Profile updated</p>
                      <p className="text-xs text-muted-foreground">
                        2 hours ago
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Booking completed</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Tickets purchased</p>
                      <p className="text-xs text-muted-foreground">
                        3 days ago
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive email updates about your bookings
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">
                      Two-Factor Authentication
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Add extra security to your account
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-red-600">
                      Delete Account
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forms" className="space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Your Purchased Forms</h3>
                  <p className="text-sm text-muted-foreground">
                    Edit and download your purchased form templates. Forms can be edited
                    once before finalization.
                  </p>
                </div>
                <Badge variant="outline">
                  {purchasedForms.length} form{purchasedForms.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              {isLoadingForms ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading your forms...</span>
                </div>
              ) : purchasedForms.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-600 mb-2">
                        No forms purchased yet
                      </h4>
                      <p className="text-gray-500 mb-4">
                        Browse our services to find and purchase form templates.
                      </p>
                      <Button asChild>
                        <Link href="/services">Browse Services</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {purchasedForms.map((form) => {
                    const formName = form.template?.formTemplateName || "Untitled Form";
                    const isEditable = form.status === "NOTUSED";

                    return (
                      <Card
                        key={form.customerFormId}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {formName}
                            </h4>
                            <Badge
                              variant={isEditable ? "default" : "secondary"}
                              className="ml-2"
                            >
                              {isEditable ? "Editable" : "Used"}
                            </Badge>
                          </div>

                          {form.template && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                Price: <Ticket className="w-4 h-4 text-amber-600" /> {form.template.price}
                              </p>
                              <p className="text-xs text-gray-400">
                                Status: {form.template.status}
                              </p>
                            </div>
                          )}

                          <div className="text-xs text-gray-400 mb-4 truncate">
                            Form ID: {form.customerFormId}
                          </div>

                          <div className="space-y-2">
                            {/* Edit Button - only show if form is editable */}
                            {isEditable ? (
                              <Button
                                onClick={() => handleEditForm(form)}
                                className="w-full"
                                size="sm"
                                variant="outline"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Form
                              </Button>
                            ) : (
                              <div title="This form has been editted before">
                                <Button
                                  onClick={() => toast.error("This form has already been edited and cannot be modified again.")}
                                  className="w-full text-gray-400 hover:text-gray-400 cursor-not-allowed"
                                  size="sm"
                                  variant="outline"
                                  aria-disabled="true"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Form
                                </Button>
                              </div>
                            )}

                            {/* Download Button */}
                            <Button
                              onClick={() => handleDownloadForm(form)}
                              disabled={downloadingForms.has(form.customerFormId)}
                              className="w-full"
                              size="sm"
                            >
                              {downloadingForms.has(form.customerFormId) ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Send New Ticket */}
              <Card>
                <CardHeader>
                  <CardTitle>Send Support Request</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile && (
                      <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                        Logged in as:{" "}
                        <span className="font-medium">{profile.fullName}</span> (
                        {profile.username})
                      </div>
                    )}

                    {isLoadingServices ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitTicket} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="service">Select Service</Label>
                          {services.length > 0 ? (
                            <select
                              id="service"
                              value={selectedServiceId}
                              onChange={(e) => setSelectedServiceId(e.target.value)}
                              required
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">-- Select a service --</option>
                              {services.map((service) => (
                                <option key={service.serviceId} value={service.serviceId}>
                                  {service.serviceName}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                              No active services available at the moment.
                            </div>
                          )}
                        </div>

                        {selectedServiceId && (
                          <div className="space-y-2">
                            <Label>Service Details</Label>
                            <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                              {services.find((s) => s.serviceId === selectedServiceId)
                                ?.serviceDescription || "No description available"}
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="request">Your Request</Label>
                          <Textarea
                            id="request"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Type your question or request here..."
                            required
                            rows={4}
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={
                            isSubmitting ||
                            !selectedServiceId ||
                            services.length === 0 ||
                            !profile
                          }
                        >
                          {isSubmitting ? "Sending..." : "Send Request"}
                        </Button>
                      </form>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Ticket History */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>My Tickets</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchTickets}
                    disabled={isLoadingTickets}
                  >
                    {isLoadingTickets ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoadingTickets ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No tickets found</p>
                      <p className="text-sm text-muted-foreground">
                        Your support requests will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {tickets.map((ticket) => (
                        <div
                          key={ticket.ticketId}
                          className="border rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(ticket.status)}
                              <span className="text-sm font-medium">
                                Ticket #{ticket.ticketId.slice(0, 8)}
                              </span>
                            </div>
                            {getStatusBadge(ticket.status)}
                          </div>

                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Your Message:
                              </p>
                              <p className="text-sm">{ticket.content_Send}</p>
                            </div>

                            {ticket.content_Response && (
                              <div className="bg-muted/50 rounded-md p-3">
                                <p className="text-sm font-medium text-muted-foreground mb-1">
                                  Staff Response:
                                </p>
                                <p className="text-sm">
                                  {ticket.content_Response}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CardTitle>My Booked Meetings</CardTitle>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant={bookingsTab === "Pending" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBookingsTab("Pending")}
                    >
                      Pending
                    </Button>
                    <Button
                      variant={bookingsTab === "Paid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBookingsTab("Paid")}
                    >
                      Paid
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      fetchBookingsPending();
                      fetchBookingsPaid();
                    }}
                    disabled={isLoadingBookingsPending || isLoadingBookingsPaid}
                  >
                    {(isLoadingBookingsPending || isLoadingBookingsPaid) ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {bookingsTab === "Pending" ? (
                  isLoadingBookingsPending ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  ) : bookingsPending.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No pending bookings found</p>
                      <p className="text-sm text-muted-foreground">
                        Your pending lawyer meetings will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {bookingsPending.map((booking) => (
                        <div
                          key={booking.bookingId}
                          className="border rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {booking.serviceName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Lawyer: {booking.lawyerName}
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{booking.bookingDate}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {booking.startTime} - {booking.endTime}
                                  </span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <Landmark className="h-4 w-4" />
                                  <span>{formatPrice(booking.price)}</span>
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/update-booking/${booking.bookingId}`}>
                                <Button variant="outline" size="sm">
                                  Update
                                </Button>
                              </Link>
                              <Link href={`/checkout/booking/${booking.serviceId}/${booking.lawyerId}`}>
                                <Button variant="outline" size="sm">
                                  Go To Checkout
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  isLoadingBookingsPaid ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  ) : bookingsPaid.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No paid bookings found</p>
                      <p className="text-sm text-muted-foreground">
                        Your paid lawyer meetings will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {bookingsPaid.map((booking) => (
                        <div
                          key={booking.bookingId}
                          className="border rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {booking.serviceName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Lawyer: {booking.lawyerName}
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{booking.bookingDate}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {booking.startTime} - {booking.endTime}
                                  </span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <Landmark className="h-4 w-4" />
                                  <span>{formatPrice(booking.price)}</span>
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/update-booking/${booking.bookingId}`}>
                                <Button variant="outline" size="sm">
                                  Update
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </CardContent>
            </Card>
            {/* Feedback Dialog */}
            <Dialog
              open={feedbackDialogOpen}
              onOpenChange={setFeedbackDialogOpen}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Leave Feedback</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    value={feedbackContent}
                    onChange={(e) => setFeedbackContent(e.target.value)}
                    placeholder="Share your experience..."
                    rows={4}
                  />
                  <div>
                    <Label>Rating</Label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={feedbackRating}
                      onChange={(e) =>
                        setFeedbackRating(Number(e.target.value))
                      }
                    />
                  </div>
                  <Button
                    onClick={handleSubmitFeedback}
                    disabled={submittingFeedback}
                    className="w-full"
                  >
                    {submittingFeedback
                      ? "Submitting..."
                      : feedbackId
                        ? "Update Feedback"
                        : "Submit Feedback"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking History</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchCompletedBookings}
                  disabled={isLoadingCompletedBookings}
                  className="ml-2"
                >
                  {isLoadingCompletedBookings ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingCompletedBookings ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : completedBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No completed bookings found
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Your completed lawyer meetings will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {completedBookings.map((booking) => (
                      <div
                        key={booking.bookingId}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {booking.lawyerName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {booking.bookingDate} {booking.startTime} -{" "}
                              {booking.endTime}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenFeedback(booking)}
                          >
                            Leave Feedback
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
