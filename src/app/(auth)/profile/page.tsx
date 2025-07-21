//src/app/(auth)/profile/page.tsx

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import html2pdf from "html2pdf.js";
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
import { accountApi, ticketApi, bookingApi, formApi, serviceApi, feedbackApi, API_ENDPOINTS } from "@/lib/api-utils";
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
  const [isLoadingStats, setIsLoadingStats] = useState(false);
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
      const response = await accountApi.getProfile();
      
      if (response.data) {
        setProfile(response.data);
        setEditForm({
          fullName: response.data.fullName || "",
          gender: response.data.gender || 0,
        });
      } else if (response.error) {
        throw new Error(response.error);
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
      const response = await ticketApi.getByCustomer(profile.accountId);
      
      if (response.data) {
        setTickets(response.data);
      } else if (response.error) {
        throw new Error(response.error);
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

  const fetchStats = useCallback(async () => {
    if (!profile?.accountId) return;

    setIsLoadingStats(true);
    try {
      // Fetch all booking statuses in parallel
      const [pendingResponse, paidResponse, completedResponse] = await Promise.all([
        bookingApi.getByCustomer(profile.accountId, "Pending"),
        bookingApi.getByCustomer(profile.accountId, "Paid"), 
        bookingApi.getByCustomer(profile.accountId, "Completed")
      ]);

      // Calculate total bookings
      const pendingCount = pendingResponse.data ? pendingResponse.data.length : 0;
      const paidCount = paidResponse.data ? paidResponse.data.length : 0;
      const completedCount = completedResponse.data ? completedResponse.data.length : 0;
      const totalBookings = pendingCount + paidCount + completedCount;

      // Fetch tickets to count active ones
      const ticketsResponse = await ticketApi.getByCustomer(profile.accountId);
      const activeTicketsCount = ticketsResponse.data ? 
        ticketsResponse.data.filter((ticket: Ticket) => ticket.status === "InProgress").length : 0;

      // Set the calculated stats
      setStats({
        totalBookings,
        activeTickets: activeTicketsCount,
        completedBookings: completedCount,
        memberSince: profile.createdAt ? 
          new Date(profile.createdAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
          }) : "January 2024",
      });

    } catch (error) {
      console.error("Failed to fetch stats:", error);
      // Fallback to default stats if API calls fail
      setStats({
        totalBookings: 0,
        activeTickets: 0,
        completedBookings: 0,
        memberSince: "January 2024",
      });
    } finally {
      setIsLoadingStats(false);
    }
  }, [profile?.accountId, profile?.createdAt]);

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

      // Update profile with new image URL using centralized API
      const updateResponse = await accountApi.updateProfile({
        fullName: profile?.fullName,
        gender: profile?.gender,
        image: url, // Send the Cloudinary URL
      });

      if (updateResponse.data) {
        // Update local state
        setProfile((prev) => (prev ? { ...prev, image: url } : null));
        toast.success("Profile picture updated successfully");
      } else {
        throw new Error(updateResponse.error || "Failed to update profile");
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
      const response = await accountApi.updateProfile({
        fullName: editForm.fullName,
        gender: editForm.gender,
      });

      if (response.data) {
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
        throw new Error(response.error || "Failed to update profile");
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
    // Also refresh stats to update active tickets count
    fetchStats();
  }, [fetchStats]);

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
      const response = await bookingApi.getByCustomer(profile.accountId, "Pending");
      
      if (response.status === 204 || !response.data) {
        setBookingsPending([]);
      } else {
        setBookingsPending(response.data);
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
      const response = await bookingApi.getByCustomer(profile.accountId, "Paid");
      
      if (response.status === 204 || !response.data) {
        setBookingsPaid([]);
      } else {
        setBookingsPaid(response.data);
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
      const response = await bookingApi.getByCustomer(profile.accountId, "Completed");
      
      if (response.status === 204 || !response.data) {
        setCompletedBookings([]);
      } else {
        setCompletedBookings(response.data);
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
      console.log("Fetching forms for customer:", profile.accountId);

      // First, fetch purchased forms
      const formsResponse = await formApi.getByCustomer(profile.accountId);

      if (!formsResponse.data) {
        if (formsResponse.status === 404) {
          console.log("No forms found for customer");
          setPurchasedForms([]);
          return;
        }
        throw new Error(formsResponse.error || `Failed to fetch forms: ${formsResponse.status}`);
      }

      const purchasedFormsData: PurchasedForm[] = formsResponse.data;
      console.log("Fetched purchased forms:", purchasedFormsData);

      // Only fetch templates if we have forms
      if (purchasedFormsData.length === 0) {
        setPurchasedForms([]);
        return;
      }

      // Then fetch templates
      const templatesResponse = await formApi.getTemplates();

      if (templatesResponse.data) {
        const allTemplates: FormTemplate[] = templatesResponse.data;
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

    // Clean and format HTML content for PDF generation
    const formatHTMLContent = (content: string): string => {
      return content
        // Clean up HTML entities first
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&Agrave;/g, 'À')
        .replace(/&Aacute;/g, 'Á')
        .replace(/&Acirc;/g, 'Â')
        .replace(/&Atilde;/g, 'Ã')
        .replace(/&Auml;/g, 'Ä')
        .replace(/&Aring;/g, 'Å')
        .replace(/&agrave;/g, 'à')
        .replace(/&aacute;/g, 'á')
        .replace(/&acirc;/g, 'â')
        .replace(/&atilde;/g, 'ã')
        .replace(/&auml;/g, 'ä')
        .replace(/&aring;/g, 'å')
        .replace(/&Egrave;/g, 'È')
        .replace(/&Eacute;/g, 'É')
        .replace(/&Ecirc;/g, 'Ê')
        .replace(/&Euml;/g, 'Ë')
        .replace(/&egrave;/g, 'è')
        .replace(/&eacute;/g, 'é')
        .replace(/&ecirc;/g, 'ê')
        .replace(/&euml;/g, 'ë')
        .replace(/&Igrave;/g, 'Ì')
        .replace(/&Iacute;/g, 'Í')
        .replace(/&Icirc;/g, 'Î')
        .replace(/&Iuml;/g, 'Ï')
        .replace(/&igrave;/g, 'ì')
        .replace(/&iacute;/g, 'í')
        .replace(/&icirc;/g, 'î')
        .replace(/&iuml;/g, 'ï')
        .replace(/&Ograve;/g, 'Ò')
        .replace(/&Oacute;/g, 'Ó')
        .replace(/&Ocirc;/g, 'Ô')
        .replace(/&Otilde;/g, 'Õ')
        .replace(/&Ouml;/g, 'Ö')
        .replace(/&ograve;/g, 'ò')
        .replace(/&oacute;/g, 'ó')
        .replace(/&ocirc;/g, 'ô')
        .replace(/&otilde;/g, 'õ')
        .replace(/&ouml;/g, 'ö')
        .replace(/&Ugrave;/g, 'Ù')
        .replace(/&Uacute;/g, 'Ú')
        .replace(/&Ucirc;/g, 'Û')
        .replace(/&Uuml;/g, 'Ü')
        .replace(/&ugrave;/g, 'ù')
        .replace(/&uacute;/g, 'ú')
        .replace(/&ucirc;/g, 'û')
        .replace(/&uuml;/g, 'ü')
        .replace(/&hellip;/g, '…')
        // Fix problematic line breaks and underscores
        .replace(/<br>\s*_+/gi, '</p><hr class="pdf-divider"><p>')
        .replace(/_+/g, '<span class="pdf-underline">_________________________________</span>')
        // Preserve center alignment and text formatting
        .replace(/<p([^>]*align\s*=\s*["\']center["\'][^>]*)>/gi, '<p class="pdf-paragraph pdf-center"$1>')
        .replace(/<p([^>]*style[^>]*text-align:\s*center[^>]*)>/gi, '<p class="pdf-paragraph pdf-center"$1>')
        .replace(/<p([^>]*style[^>]*text-align:\s*right[^>]*)>/gi, '<p class="pdf-paragraph pdf-right"$1>')
        .replace(/<div([^>]*style[^>]*text-align:\s*center[^>]*)>/gi, '<div class="pdf-div pdf-center"$1>')
        .replace(/<div([^>]*style[^>]*text-align:\s*right[^>]*)>/gi, '<div class="pdf-div pdf-right"$1>')
        // Add CSS classes for better styling
        .replace(/<h1([^>]*)>/gi, '<h1 class="pdf-h1"$1>')
        .replace(/<h2([^>]*)>/gi, '<h2 class="pdf-h2"$1>')
        .replace(/<h3([^>]*)>/gi, '<h3 class="pdf-h3"$1>')
        .replace(/<h4([^>]*)>/gi, '<h4 class="pdf-h4"$1>')
        .replace(/<h5([^>]*)>/gi, '<h5 class="pdf-h5"$1>')
        .replace(/<h6([^>]*)>/gi, '<h6 class="pdf-h6"$1>')
        .replace(/<p(?![^>]*(class|style|align))([^>]*)>/gi, '<p class="pdf-paragraph"$2>')
        .replace(/<ul([^>]*)>/gi, '<ul class="pdf-list"$1>')
        .replace(/<ol([^>]*)>/gi, '<ol class="pdf-list pdf-ordered"$1>')
        .replace(/<li([^>]*)>/gi, '<li class="pdf-list-item"$1>')
        .replace(/<table([^>]*)>/gi, '<table class="pdf-table"$1>')
        .replace(/<th([^>]*)>/gi, '<th class="pdf-table-header"$1>')
        .replace(/<td([^>]*)>/gi, '<td class="pdf-table-cell"$1>')
        .replace(/<strong([^>]*)>/gi, '<strong class="pdf-bold"$1>')
        .replace(/<b([^>]*)>/gi, '<b class="pdf-bold"$1>')
        .replace(/<em([^>]*)>/gi, '<em class="pdf-italic"$1>')
        .replace(/<i([^>]*)>/gi, '<i class="pdf-italic"$1>')
        .replace(/<div(?![^>]*(class|style))([^>]*)>/gi, '<div class="pdf-div"$2>')
        // Remove any remaining problematic tags that might cause issues
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<link[^>]*>/gi, '')
        .trim();
    };

    const formattedHTMLContent = formatHTMLContent(formContent);

    // Try popup window approach first
    try {
      console.log('Attempting popup window PDF generation...');
      const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      if (!newWindow) {
        throw new Error('Popup blocked');
      }

      // Write a complete HTML document with comprehensive CSS for PDF formatting
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>PDF Generation</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 12px;
              line-height: 1.6;
              color: #000000;
              background-color: #ffffff;
              padding: 5mm;
              margin: 0;
              width: auto;
              min-height: auto;
              box-sizing: border-box;
            }
            
            .pdf-content {
              margin: 0;
              padding: 0;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            
            /* Alignment classes */
            .pdf-center {
              text-align: center !important;
              display: block;
              width: 100%;
            }
            
            .pdf-right {
              text-align: right !important;
              display: block;
              width: 100%;
            }
            
            /* Divider for underlines */
            .pdf-divider {
              border: none;
              border-top: 1px solid #000000;
              margin: 5px 0;
              width: 100%;
            }
            
            .pdf-underline {
              text-decoration: underline;
              text-decoration-style: solid;
              text-decoration-thickness: 1px;
            }
            
            /* Heading Styles */
            .pdf-h1 {
              font-size: 22px;
              font-weight: bold;
              color: #000000;
              margin: 25px 0 15px 0;
              padding-bottom: 8px;
              border-bottom: 1px solid #cccccc;
              page-break-after: avoid;
            }
            
            .pdf-h2 {
              font-size: 18px;
              font-weight: bold;
              color: #333333;
              margin: 20px 0 12px 0;
              page-break-after: avoid;
            }
            
            .pdf-h3 {
              font-size: 16px;
              font-weight: bold;
              color: #444444;
              margin: 18px 0 10px 0;
              page-break-after: avoid;
            }
            
            .pdf-h4 {
              font-size: 14px;
              font-weight: bold;
              color: #555555;
              margin: 15px 0 8px 0;
              page-break-after: avoid;
            }
            
            .pdf-h5 {
              font-size: 13px;
              font-weight: bold;
              color: #666666;
              margin: 12px 0 6px 0;
              page-break-after: avoid;
            }
            
            .pdf-h6 {
              font-size: 12px;
              font-weight: bold;
              color: #777777;
              margin: 10px 0 5px 0;
              page-break-after: avoid;
            }
            
            /* Paragraph Styles */
            .pdf-paragraph {
              margin: 4px 0;
              text-indent: 0;
              line-height: 1.4;
              word-wrap: break-word;
              overflow-wrap: break-word;
              hyphens: auto;
            }
            
            /* Center alignment for titles and headers */
            .pdf-content p[style*="text-align: center"], 
            .pdf-content div[style*="text-align: center"],
            .pdf-content *[align="center"],
            .pdf-center {
              text-align: center !important;
              display: block;
              width: 100%;
            }
            
            .pdf-content p[style*="text-align: right"],
            .pdf-content div[style*="text-align: right"],
            .pdf-right {
              text-align: right !important;
              display: block;
              width: 100%;
            }
            
            /* Handle underlines properly */
            .pdf-content u {
              text-decoration: underline;
              text-decoration-thickness: 1px;
              text-underline-offset: 2px;
            }
            
            /* Handle line breaks and spacing */
            .pdf-content br {
              display: block;
              margin: 2px 0;
              content: "";
            }
            
            /* Page break handling for long text */
            .pdf-paragraph, .pdf-div {
              page-break-inside: avoid;
              orphans: 2;
              widows: 2;
            }
            
            /* List Styles */
            .pdf-list {
              margin: 10px 0;
              padding-left: 25px;
            }
            
            .pdf-ordered {
              list-style-type: decimal;
            }
            
            .pdf-list-item {
              margin: 5px 0;
              line-height: 1.6;
            }
            
            /* Table Styles */
            .pdf-table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              font-size: 11px;
            }
            
            .pdf-table-header {
              background-color: #f5f5f5;
              border: 1px solid #cccccc;
              padding: 8px;
              font-weight: bold;
              text-align: left;
            }
            
            .pdf-table-cell {
              border: 1px solid #cccccc;
              padding: 6px 8px;
              vertical-align: top;
            }
            
            /* Text Formatting */
            .pdf-bold {
              font-weight: bold;
            }
            
            .pdf-italic {
              font-style: italic;
            }
            
            /* Div Styles */
            .pdf-div {
              margin: 8px 0;
            }
            
            /* Page Break Controls */
            .page-break-before {
              page-break-before: always;
            }
            
            .page-break-after {
              page-break-after: always;
            }
            
            .no-page-break {
              page-break-inside: avoid;
            }
            
            /* Additional utility styles */
            br {
              line-height: 1.8;
            }
            
            hr {
              border: none;
              border-top: 1px solid #cccccc;
              margin: 20px 0;
            }
            
            blockquote {
              margin: 15px 0;
              padding: 10px 15px;
              border-left: 4px solid #cccccc;
              background-color: #f9f9f9;
              font-style: italic;
            }
            
            code {
              background-color: #f5f5f5;
              padding: 2px 4px;
              border-radius: 3px;
              font-family: 'Courier New', monospace;
              font-size: 11px;
            }
            
            pre {
              background-color: #f5f5f5;
              padding: 10px;
              border-radius: 5px;
              overflow-wrap: break-word;
              white-space: pre-wrap;
              font-family: 'Courier New', monospace;
              font-size: 10px;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="pdf-content">
            ${formattedHTMLContent}
          </div>
          
          <script>
            console.log('PDF generation document loaded with HTML formatting');
          </script>
        </body>
        </html>
      `);
      newWindow.document.close();

      // Wait for the document to be ready
      await new Promise(resolve => setTimeout(resolve, 500));

      // Import html2pdf in the new window context
      const script = newWindow.document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      
      await new Promise((resolve, reject) => {
        script.onload = () => {
          console.log('html2pdf script loaded successfully');
          resolve(true);
        };
        script.onerror = (error) => {
          console.error('Failed to load html2pdf script:', error);
          reject(error);
        };
        newWindow.document.head.appendChild(script);
      });

      // Wait for html2pdf to be available
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate PDF in the isolated window
      const html2pdfLib = (newWindow as any).html2pdf;
      if (!html2pdfLib) {
        throw new Error('html2pdf library failed to load in isolated window');
      }

      console.log('Generating PDF with html2pdf...');
      const options = {
        margin: 5,
        filename: `${safeFormName.replace(/[^a-z0-9]/gi, "_")}.pdf`,
        html2canvas: {
          scale: 1.5,
          backgroundColor: '#ffffff',
          useCORS: false,
          allowTaint: true,
          logging: false,
          width: 794,
          letterRendering: true,
          removeContainer: true
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
          compress: true
        },
        pagebreak: { 
          mode: ['avoid-all', 'css'],
          before: '.page-break-before',
          after: '.page-break-after',
          avoid: '.pdf-paragraph, .pdf-div, .no-page-break'
        }
      };

      await html2pdfLib()
        .from(newWindow.document.body)
        .set(options)
        .save();

      console.log('PDF generated successfully!');
      
      // Clean up: close the popup window
      setTimeout(() => {
        newWindow.close();
      }, 2000);

    } catch (popupError) {
      console.log('Popup approach failed:', popupError);
      console.log('Trying local html2pdf fallback...');
      
      // Fallback 1: Try using local html2pdf with DOM manipulation instead of iframe
      try {
        console.log('Trying direct DOM approach with local html2pdf...');
        
        // Create a temporary div to hold our content
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.style.width = '210mm';
        tempDiv.style.visibility = 'hidden';
        
        // Add comprehensive styles and HTML content to the div
        tempDiv.innerHTML = `
          <style>
            .pdf-container {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 12px;
              line-height: 1.6;
              color: #000;
              background: #fff;
              padding: 5mm;
              margin: 0;
              box-sizing: border-box;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            
            /* Alignment classes */
            .pdf-center {
              text-align: center !important;
              display: block;
              width: 100%;
            }
            
            .pdf-right {
              text-align: right !important;
              display: block;
              width: 100%;
            }
            
            /* Divider for underlines */
            .pdf-divider {
              border: none;
              border-top: 1px solid #000000;
              margin: 5px 0;
              width: 100%;
            }
            
            .pdf-underline {
              text-decoration: underline;
              text-decoration-style: solid;
              text-decoration-thickness: 1px;
            }
            
            /* HTML Content Styles */
            .pdf-content h1, .pdf-h1 {
              font-size: 22px;
              font-weight: bold;
              color: #000;
              margin: 25px 0 15px 0;
              padding-bottom: 8px;
              border-bottom: 1px solid #ccc;
            }
            .pdf-content h2, .pdf-h2 {
              font-size: 18px;
              font-weight: bold;
              color: #333;
              margin: 20px 0 12px 0;
            }
            .pdf-content h3, .pdf-h3 {
              font-size: 16px;
              font-weight: bold;
              color: #444;
              margin: 18px 0 10px 0;
            }
            .pdf-content h4, .pdf-h4 {
              font-size: 14px;
              font-weight: bold;
              color: #555;
              margin: 15px 0 8px 0;
            }
            .pdf-content h5, .pdf-h5 {
              font-size: 13px;
              font-weight: bold;
              color: #666;
              margin: 12px 0 6px 0;
            }
            .pdf-content h6, .pdf-h6 {
              font-size: 12px;
              font-weight: bold;
              color: #777;
              margin: 10px 0 5px 0;
            }
            .pdf-content p, .pdf-paragraph {
              margin: 4px 0;
              line-height: 1.4;
              word-wrap: break-word;
              overflow-wrap: break-word;
              hyphens: auto;
            }
            
            /* Center alignment for titles and headers */
            .pdf-content p[style*="text-align: center"], 
            .pdf-content div[style*="text-align: center"],
            .pdf-content *[align="center"],
            .pdf-center {
              text-align: center !important;
              display: block;
              width: 100%;
            }
            
            .pdf-content p[style*="text-align: right"],
            .pdf-content div[style*="text-align: right"],
            .pdf-right {
              text-align: right !important;
              display: block;
              width: 100%;
            }
            
            /* Handle underlines properly */
            .pdf-content u {
              text-decoration: underline;
              text-decoration-thickness: 1px;
              text-underline-offset: 2px;
            }
            
            /* Handle line breaks and spacing */
            .pdf-content br {
              display: block;
              margin: 2px 0;
              content: "";
            }
            
            /* Page break handling for long text */
            .pdf-paragraph, .pdf-div {
              page-break-inside: avoid;
              orphans: 2;
              widows: 2;
            }
            .pdf-content ul, .pdf-content ol, .pdf-list {
              margin: 10px 0;
              padding-left: 25px;
            }
            .pdf-content li, .pdf-list-item {
              margin: 5px 0;
              line-height: 1.6;
            }
            .pdf-content table, .pdf-table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              font-size: 11px;
            }
            .pdf-content th, .pdf-table-header {
              background-color: #f5f5f5;
              border: 1px solid #ccc;
              padding: 8px;
              font-weight: bold;
              text-align: left;
            }
            .pdf-content td, .pdf-table-cell {
              border: 1px solid #ccc;
              padding: 6px 8px;
              vertical-align: top;
            }
            .pdf-content strong, .pdf-content b, .pdf-bold {
              font-weight: bold;
            }
            .pdf-content em, .pdf-content i, .pdf-italic {
              font-style: italic;
            }
            .pdf-content div, .pdf-div {
              margin: 4px 0;
            }
            .pdf-content br {
              line-height: 1.8;
            }
            .pdf-content hr {
              border: none;
              border-top: 1px solid #ccc;
              margin: 20px 0;
            }
            .pdf-content blockquote {
              margin: 15px 0;
              padding: 10px 15px;
              border-left: 4px solid #ccc;
              background-color: #f9f9f9;
              font-style: italic;
            }
          </style>
          <div class="pdf-container">
            <div class="pdf-content">${formattedHTMLContent}</div>
          </div>
        `;
        
        document.body.appendChild(tempDiv);
        
        // Wait a moment for styles to apply
        await new Promise(resolve => setTimeout(resolve, 100));

        const options = {
          margin: 5,
          filename: `${safeFormName.replace(/[^a-z0-9]/gi, "_")}.pdf`,
          html2canvas: {
            scale: 1.5,
            backgroundColor: '#ffffff',
            useCORS: false,
            allowTaint: true,
            logging: false,
            width: 794,
            letterRendering: true,
            removeContainer: true
          },
          jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait' as const,
            compress: true
          },
          pagebreak: { 
            mode: ['avoid-all', 'css'],
            avoid: '.pdf-paragraph, .pdf-div, .no-page-break'
          }
        };

        console.log('Generating PDF from DOM element...');
        await html2pdf().from(tempDiv).set(options).save();
        console.log('PDF generated successfully from DOM element!');
        
        document.body.removeChild(tempDiv);

      } catch (domError) {
        console.error('DOM approach also failed:', domError);
        console.log('Falling back to text file download...');
        
        // Convert HTML to plain text for fallback
        const convertHTMLToPlainText = (htmlContent: string): string => {
          return htmlContent
            .replace(/<h[1-6][^>]*>/gi, '\n\n--- ')
            .replace(/<\/h[1-6]>/gi, ' ---\n')
            .replace(/<p[^>]*>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<br[^>]*>/gi, '\n')
            .replace(/<div[^>]*>/gi, '\n')
            .replace(/<\/div>/gi, '\n')
            .replace(/<li[^>]*>/gi, '\n• ')
            .replace(/<\/li>/gi, '')
            .replace(/<[^>]*>/g, '') // Remove all remaining HTML tags
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .replace(/^\s+|\s+$/g, '')
            .trim();
        };
        
        // Fallback 2: Create a simple text file download
        const plainTextForFallback = convertHTMLToPlainText(formattedHTMLContent);
        const textContent = `
${safeFormName}
Generated on ${new Date().toLocaleDateString()}

${plainTextForFallback}
        `.trim();

        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${safeFormName.replace(/[^a-z0-9]/gi, "_")}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show a helpful message to the user
        throw new Error('PDF generation not supported in this browser. Form downloaded as text file instead.');
      }
    }
  };

  const handleEditForm = (form: PurchasedFormWithTemplate) => {
    // Navigate to edit page or open edit modal
    window.location.href = `/edit-form/${form.customerFormId}`;
  };

  // ===== FUNCTIONS FROM SendTicketForm =====
  const fetchServices = useCallback(async () => {
    try {
      const response = await serviceApi.getAll();
      if (!response.data) {
        throw new Error(response.error || "Failed to fetch services");
      }
      setServices(response.data);
      if (response.data.length > 0) {
        setSelectedServiceId(response.data[0].serviceId);
      }
    } catch (error) {
      console.error("Failed to fetch services:", error);
      toast.error("Failed to load services", {
        description: "Please refresh the page and try again.",
      });
    } finally {
      setIsLoadingServices(false);
    }
  }, []);

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

    if (profile.accountTicketRequest <= 0) {
      toast.error("No tickets available", {
        description: "You need to purchase more tickets to send support requests.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await ticketApi.create({
        userId: profile.accountId,
        serviceId: selectedServiceId,
        content_Send: content,
      });
      console.log(profile.accountId, selectedServiceId, content);

      if (response.data) {
        toast.success("Ticket sent successfully", {
          description: `Staff will respond to your request soon. Remaining tickets: ${profile.accountTicketRequest - 1}`,
        });

        setContent("");
        if (services.length > 0) {
          setSelectedServiceId(services[0].serviceId);
        }

        // Update profile to decrease available tickets
        if (profile && profile.accountTicketRequest > 0) {
          setProfile(prev => prev ? {
            ...prev,
            accountTicketRequest: prev.accountTicketRequest - 1
          } : null);
        }

        // Refresh tickets after successful submission
        handleTicketSent();
      } else {
        throw new Error(response.error || "Failed to send ticket");
      }
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
  }, []);

  // Fetch stats when profile is available
  useEffect(() => {
    if (profile?.accountId) {
      fetchStats();
    }
  }, [profile?.accountId, fetchStats]);

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
      const response = await feedbackApi.getByBooking(bookingId);
      
      if (response.data) {
        setFeedbackContent(response.data.feedbackContent || "");
        setFeedbackRating(response.data.rating || 5);
        setFeedbackId(response.data.feedbackId);
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
      const data = feedbackId
        ? { feedbackContent, rating: feedbackRating }
        : {
            bookingId: feedbackBooking.bookingId,
            customerId: profile?.accountId,
            feedbackContent,
            rating: feedbackRating,
          };

      const response = feedbackId
        ? await feedbackApi.update(feedbackId, data)
        : await feedbackApi.create(data);

      if (response.data) {
        toast.success("Feedback submitted!");
        setFeedbackDialogOpen(false);
        // Optionally refresh bookings or feedback state here
      } else {
        throw new Error(response.error || "Failed to submit feedback");
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
            {isLoadingStats ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                        <div>
                          <div className="h-6 w-12 bg-gray-200 rounded animate-pulse mb-1" />
                          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : stats && (
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
                          Completed bookings
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
                      <>
                        <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                          Logged in as:{" "}
                          <span className="font-medium">{profile.fullName}</span> (
                          {profile.username})
                        </div>
                        
                        <div className={`text-sm p-3 border rounded-md transition-all duration-300 ${
                          profile.accountTicketRequest > 0 
                            ? 'bg-green-50 border-green-200 text-green-700' 
                            : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                          <div className="flex items-center gap-2">
                            <Ticket className="h-4 w-4" />
                            <span className="font-medium">
                              Available Tickets: 
                              <span className="ml-1 inline-block transition-all duration-300 hover:scale-110">
                                {profile.accountTicketRequest}
                              </span>
                            </span>
                          </div>
                          {profile.accountTicketRequest === 0 && (
                            <p className="text-xs mt-1">
                              You need to purchase tickets to send support requests.
                            </p>
                          )}
                          {profile.accountTicketRequest > 0 && profile.accountTicketRequest <= 3 && (
                            <p className="text-xs mt-1">
                              Low ticket count! Consider purchasing more tickets.
                            </p>
                          )}
                        </div>
                      </>
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
                            !profile ||
                            profile.accountTicketRequest <= 0
                          }
                        >
                          {isSubmitting ? "Sending..." : profile?.accountTicketRequest === 0 ? "No Tickets Available" : "Send Request (1 ticket)"}
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
                    onClick={() => {
                      fetchTickets();
                      fetchStats(); // Refresh stats when tickets are refreshed
                    }}
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
                      fetchStats(); // Refresh stats when bookings are refreshed
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
