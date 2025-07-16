// src/app/dashboard/staff-dashboard/page.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { User, Clock, FileText, XCircle, Filter } from "lucide-react";
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
  content_Send: string;
  response?: string;
  createdAt: string;
  status: "Pending" | "Resolved";
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

  const fetchProfile = useCallback(async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1];

      if (!token) {
        console.error("Please login to continue");
        return;
      }

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
      } else {
        throw new Error("Failed to fetch profile");
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1];

      if (!token) {
        console.error("Please login to continue");
        return;
      }

      const response = await fetch("https://localhost:7103/api/Ticket/all", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }

      const data = await response.json();
      setTickets(data);
      console.log("Total tickets fetched:", data.length);
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
    if (profile) {
      fetchTickets();
    }
  }, [profile, fetchTickets]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleReply = async () => {
    if (!selectedTicket || !response) return;
    setIsSubmitting(true);

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1];

      const staffId = document.cookie
        .split("; ")
        .find((row) => row.startsWith("userId="))
        ?.split("=")[1];

      const replyResponse = await fetch(
        `https://localhost:7103/api/Ticket/${selectedTicket.ticketId}/reply`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ticketId: selectedTicket.ticketId,
            staffId,
            response,
          }),
        }
      );

      if (!replyResponse.ok) {
        const errorData = await replyResponse.json();
        throw new Error(errorData.message || "Failed to send response");
      }

      toast.success("Response sent successfully");

      // Update the local state to reflect the change
      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.ticketId === selectedTicket.ticketId
            ? { ...ticket, response, status: "Resolved" }
            : ticket
        )
      );

      setSelectedTicket(null);
      setResponse("");
    } catch (error) {
      toast.error("Failed to send response");
      console.error("Reply error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setResponse(ticket.response || "");
  };

  const toggleStatusFilter = (status: "pending" | "resolved") => {
    setStatusFilter((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const getFilteredTickets = () => {
    return tickets.filter((ticket) => {
      if (ticket.status === "Pending" && statusFilter.pending) return true;
      if (ticket.status === "Resolved" && statusFilter.resolved) return true;
      return false;
    });
  };

  const filteredTickets = getFilteredTickets();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">View Requests</h1>
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
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Loading indicator */}
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-sm">Loading tickets...</span>
                  </div>
                )}

                {!loading && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="w-[150px]">User</TableHead>
                          <TableHead>Request</TableHead>
                          <TableHead className="w-[180px]">Date</TableHead>
                          <TableHead className="w-[100px]">Status</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTickets.length > 0 ? (
                          filteredTickets.map((ticket) => (
                            <TableRow key={ticket.ticketId}>
                              <TableCell className="font-medium">
                                {ticket.userName}
                              </TableCell>
                              <TableCell>
                                <div className="max-w-xs truncate">
                                  {ticket.content_Send}
                                </div>
                              </TableCell>
                              <TableCell>
                                {formatDate(ticket.createdAt)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    ticket.status === "Pending"
                                      ? "secondary"
                                      : "default"
                                  }
                                  className={
                                    ticket.status === "Pending"
                                      ? "bg-yellow-500 text-white"
                                      : "bg-green-500 text-white"
                                  }
                                >
                                  {ticket.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleTicketClick(ticket)}
                                >
                                  {ticket.status === "Pending"
                                    ? "Respond"
                                    : "View"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
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
                {selectedTicket?.status === "Pending"
                  ? "Respond to Ticket"
                  : "Ticket Details"}
              </DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge
                    variant={
                      selectedTicket.status === "Resolved"
                        ? "default"
                        : "secondary"
                    }
                    className={
                      selectedTicket.status === "Resolved"
                        ? "bg-green-500"
                        : "bg-yellow-500"
                    }
                  >
                    {selectedTicket.status}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <User className="h-4 w-4 mt-1 text-gray-500" />
                    <div>
                      <p className="font-medium">User</p>
                      <p className="text-sm text-gray-600">
                        {selectedTicket.userName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Clock className="h-4 w-4 mt-1 text-gray-500" />
                    <div>
                      <p className="font-medium">Date</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(selectedTicket.createdAt)}
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

                  {selectedTicket.response ? (
                    <div className="flex items-start space-x-3">
                      <FileText className="h-4 w-4 mt-1 text-gray-500" />
                      <div className="w-full">
                        <p className="font-medium">Your Response</p>
                        <div className="bg-blue-50 p-4 rounded mt-2">
                          <p className="whitespace-pre-wrap text-sm">
                            {selectedTicket.response}
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
