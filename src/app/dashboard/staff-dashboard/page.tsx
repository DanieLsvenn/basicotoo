// src/app/dashboard/staff-dashboard/page.tsx

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Cookies from "js-cookie";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Ticket {
  ticketId: string;
  userId: string;
  userName: string;
  content_Send: string;
  response?: string;
  createdAt: string;
  status: "Pending" | "Resolved";
}

function StaffTicketsList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const token = Cookies.get("authToken");
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
    } catch (error) {
      toast.error("Failed to fetch tickets");
      console.error("Fetch tickets error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !response) return;
    setIsSubmitting(true);

    try {
      const token = Cookies.get("authToken");
      const staffId = Cookies.get("userId");

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Customer Requests</h2>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
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
                {tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <TableRow key={ticket.ticketId}>
                      <TableCell className="font-medium">
                        {ticket.userName}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {ticket.content_Send}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            ticket.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setResponse(ticket.response || "");
                          }}
                          disabled={ticket.status === "Resolved"}
                        >
                          {ticket.status === "Pending" ? "Respond" : "View"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No tickets found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {selectedTicket && (
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <h3 className="font-medium">
                  Request from {selectedTicket.userName}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTicket(null)}
                >
                  Close
                </Button>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <p className="whitespace-pre-wrap">
                  {selectedTicket.content_Send}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {formatDate(selectedTicket.createdAt)}
                </p>
              </div>

              {selectedTicket.response ? (
                <div className="bg-blue-50 p-4 rounded">
                  <h4 className="font-medium text-blue-800">Your Response:</h4>
                  <p className="whitespace-pre-wrap">
                    {selectedTicket.response}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="response">Your Response</Label>
                    <Textarea
                      id="response"
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="Type your response here..."
                      required
                      className="min-h-[120px]"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
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
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default StaffTicketsList;
