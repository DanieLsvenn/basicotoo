// src/app/dashboard/staff-dashboard/page.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { User, Clock, FileText, XCircle, Filter, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch, API_ENDPOINTS } from "@/lib/api-utils";

interface Profile {
  accountId: string;
  username: string;
  email: string;
  fullName: string;
  image: string;
  gender: number;
  accountTicketRequest: number;
  role: string;
}

interface Ticket {
  ticketId: string;
  userId: string;
  userName: string;
  staffId?: string;
  serviceId?: string;
  content_Send: string;
  content_Response?: string;
  response?: string;
  createdAt: string;
  status: string;
}

const StaffDashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState({
    pending: true,
    resolved: true,
  });

  const getToken = () => {
    if (typeof document === "undefined") return null;
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("authToken="))
      ?.split("=")[1];
    return token;
  };

  const getUserId = () => {
    if (typeof document === "undefined") return null;
    const userId = document.cookie
      .split("; ")
      .find((row) => row.startsWith("userId="))
      ?.split("=")[1];
    return userId;
  };

  const fetchProfile = useCallback(async () => {
    try {
      const response = await apiFetch(API_ENDPOINTS.ACCOUNT.PROFILE);
      if (response.data) {
        setProfile(response.data);
        console.log("Profile fetched successfully:", response.data);
      } else {
        console.error("Profile fetch failed:", response.error);
        toast.error(response.error || "Failed to fetch profile");
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      toast.error("Failed to fetch profile");
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch(API_ENDPOINTS.TICKET.ALL);
      
      if (response.data) {
        console.log("Raw tickets data:", response.data);
        const ticketsArray = Array.isArray(response.data) ? response.data : response.data.tickets || [];

        const mappedTickets = ticketsArray.map((ticket: any) => ({
          ticketId: ticket.ticketId,
          userId: ticket.userId,
          userName: ticket.userName || "Unknown User",
          staffId: ticket.staffId,
          serviceId: ticket.serviceId,
          content_Send: ticket.content_Send,
          content_Response: ticket.content_Response,
          response: ticket.response || ticket.content_Response,
          createdAt: ticket.createdAt,
          status: ticket.status || "Pending",
        }));

        setTickets(mappedTickets);
        console.log("Processed tickets:", mappedTickets);
        console.log("Total tickets fetched:", mappedTickets.length);
      } else {
        console.error("Tickets fetch failed:", response.error);
        toast.error(response.error || "Failed to fetch tickets");
      }
    } catch (error) {
      toast.error("Failed to fetch tickets");
      console.error("Fetch tickets error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleReply = async () => {
    if (!selectedTicket || !response) return;
    setIsSubmitting(true);

    try {
      const staffId = getUserId();
      
      const replyResponse = await apiFetch(
        API_ENDPOINTS.TICKET.REPLY(selectedTicket.ticketId),
        {
          method: "PUT",
          body: JSON.stringify({
            ticketId: selectedTicket.ticketId,
            staffId,
            response,
          }),
        }
      );

      if (replyResponse.data) {
        toast.success("Response sent successfully");
        setTickets((prevTickets) =>
          prevTickets.map((ticket) =>
            ticket.ticketId === selectedTicket.ticketId
              ? {
                  ...ticket,
                  response,
                  content_Response: response,
                  status: "ANSWERED",
                }
              : ticket
          )
        );

        setSelectedTicket(null);
        setResponse("");
      } else {
        throw new Error(replyResponse.error || "Failed to send response");
      }
    } catch (error) {
      toast.error("Failed to send response");
      console.error("Reply error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setResponse(ticket.response || ticket.content_Response || "");
  };

  const toggleStatusFilter = (status: "pending" | "resolved") => {
    setStatusFilter((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const getFilteredTickets = () => {
    return tickets.filter((ticket) => {
      const status = ticket.status?.toLowerCase() || "pending";

      const isPending =
        status === "pending" || status === "inprogress" || status === "new";
      const isResolved =
        status === "resolved" || status === "answered" || status === "closed";

      if (isPending && statusFilter.pending) return true;
      if (isResolved && statusFilter.resolved) return true;
      return false;
    });
  };

  const getStatusDisplay = (status: string) => {
    const statusLower = status?.toLowerCase() || "pending";

    switch (statusLower) {
      case "answered":
      case "resolved":
      case "closed":
        return {
          text: "Resolved",
          variant: "default" as const,
          color: "bg-green-500",
        };
      case "inprogress":
        return {
          text: "In Progress",
          variant: "secondary" as const,
          color: "bg-blue-500",
        };
      case "pending":
      case "new":
      default:
        return {
          text: "Pending",
          variant: "secondary" as const,
          color: "bg-yellow-500",
        };
    }
  };

  const filteredTickets = getFilteredTickets();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">View Requests</h1>
          {/* Debug info */}
          <div className="mt-2 text-sm text-gray-500">
            Total tickets: {tickets.length} | Filtered: {filteredTickets.length}
          </div>
        </div>

        <Tabs defaultValue="tickets" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
            <TabsTrigger value="analytics" disabled>
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="mt-6">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Support Tickets</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Filter by:</span>
                    </div>
                    <button
                      onClick={() => toggleStatusFilter("pending")}
                      className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm transition-all ${
                        statusFilter.pending
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                      <span>Pending</span>
                    </button>
                    <button
                      onClick={() => toggleStatusFilter("resolved")}
                      className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm transition-all ${
                        statusFilter.resolved
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span>Resolved</span>
                    </button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchTickets}
                      disabled={loading}
                    >
                      {loading ? "Refreshing..." : "Refresh"}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Loading indicator */}
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <span className="ml-2 text-sm">Loading tickets...</span>
                  </div>
                )}

                {!loading && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="w-[150px]">User ID</TableHead>
                          <TableHead>Request</TableHead>
                          <TableHead className="w-[100px]">Status</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTickets.length > 0 ? (
                          filteredTickets.map((ticket) => {
                            const statusInfo = getStatusDisplay(ticket.status);
                            return (
                              <TableRow key={ticket.ticketId}>
                                <TableCell className="font-medium">
                                  {ticket.userId}
                                </TableCell>
                                <TableCell>
                                  <div className="max-w-xs truncate">
                                    {ticket.content_Send}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={statusInfo.variant}
                                    className={`${statusInfo.color} text-white`}
                                  >
                                    {statusInfo.text}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleTicketClick(ticket)}
                                  >
                                    {statusInfo.text === "Pending"
                                      ? "Respond"
                                      : "View"}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              {tickets.length === 0
                                ? "No tickets found"
                                : "No tickets match the current filter"}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Ticket Detail Dialog */}
        <Dialog
          open={!!selectedTicket}
          onOpenChange={() => setSelectedTicket(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedTicket &&
                getStatusDisplay(selectedTicket.status).text === "Pending"
                  ? "Respond to Ticket"
                  : "Ticket Details"}
              </DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge
                    variant={getStatusDisplay(selectedTicket.status).variant}
                    className={getStatusDisplay(selectedTicket.status).color}
                  >
                    {getStatusDisplay(selectedTicket.status).text}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <User className="h-4 w-4 mt-1 text-gray-500" />
                    <div>
                      <p className="font-medium">User ID</p>
                      <p className="text-sm text-gray-600">
                        {selectedTicket.userId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <FileText className="h-4 w-4 mt-1 text-gray-500" />
                    <div>
                      <p className="font-medium">Request</p>
                      <div className="bg-gray-50 p-4 rounded mt-2">
                        <p className="whitespace-pre-wrap text-sm">
                          {selectedTicket.content_Send}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedTicket.response ||
                  selectedTicket.content_Response ? (
                    <div className="flex items-start space-x-3">
                      <FileText className="h-4 w-4 mt-1 text-gray-500" />
                      <div className="w-full">
                        <p className="font-medium">Your Response</p>
                        <div className="bg-blue-50 p-4 rounded mt-2">
                          <p className="whitespace-pre-wrap text-sm">
                            {selectedTicket.response ||
                              selectedTicket.content_Response}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="response" className="font-medium">
                        Your Response
                      </Label>
                      <Textarea
                        id="response"
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        placeholder="Type your response here..."
                        required
                        className="min-h-[120px]"
                      />
                      <div className="flex justify-end space-x-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedTicket(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleReply}
                          disabled={isSubmitting || !response}
                        >
                          {isSubmitting ? "Sending..." : "Send Response"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Info Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Information</DialogTitle>
            </DialogHeader>
            <div className="flex items-center space-x-3">
              <XCircle className="h-8 w-8 text-gray-400" />
              <p className="text-gray-600">{dialogMessage}</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StaffDashboard;
