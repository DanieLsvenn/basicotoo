"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Cookies from "js-cookie";

// ✅ 1. Props interface: declares that this component accepts an onTicketSent function
interface SendTicketFormProps {
  onTicketSent: () => void;
}

interface Service {
  serviceId: string;
  serviceName: string;
  serviceDescription: string;
}

interface AccountProfile {
  accountId: string;
  username: string;
  email: string;
  fullName: string;
  image: string;
  gender: number;
  accountTicketRequest: number;
}

export function SendTicketForm({ onTicketSent }: SendTicketFormProps) {
  const [content, setContent] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [accountProfile, setAccountProfile] = useState<AccountProfile | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    fetchAccountProfile();
    fetchServices();
  }, []);

  const fetchAccountProfile = async () => {
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
        setAccountProfile(data);
      } else {
        throw new Error("Failed to fetch account profile");
      }
    } catch (error) {
      console.error("Failed to fetch account profile:", error);
      toast.error("Failed to load account profile", {
        description: "Please refresh the page and try again.",
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
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

    if (!accountProfile?.accountId) {
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
          userId: accountProfile.accountId,
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

      // ✅ 3. Call the prop function after successful ticket submit!
      if (onTicketSent) {
        onTicketSent();
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

  if (isLoadingServices || isLoadingProfile) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Send Request to Staff</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Send Request to Staff</h3>

      {accountProfile && (
        <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
          Logged in as:{" "}
          <span className="font-medium">{accountProfile.fullName}</span> (
          {accountProfile.username})
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
            !accountProfile
          }
        >
          {isSubmitting ? "Sending..." : "Send Request"}
        </Button>
      </form>
    </div>
  );
}
